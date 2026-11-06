import parserPackage from 'node-sql-parser'
import { approvedAnalyticsTables } from '../config/analyticsSchema.js'

const { Parser } = parserPackage
const parser = new Parser()
const MAX_SQL_LENGTH = 12000
const SAFE_FUNCTIONS = new Set([
  'abs', 'avg', 'ceil', 'ceiling', 'char_length', 'coalesce', 'concat', 'count', 'date_part',
  'date_trunc', 'floor', 'greatest', 'least', 'length', 'lower', 'max', 'min', 'nullif',
  'round', 'substring', 'sum', 'to_char', 'upper',
])
const SAFE_WINDOW_FUNCTIONS = new Set(['dense_rank', 'first_value', 'lag', 'last_value', 'lead', 'nth_value', 'rank', 'row_number'])

function reject(message) {
  throw Object.assign(new Error(message), { status: 422, code: 'SQL_VALIDATION_FAILED' })
}

function identifier(value) {
  return String(value?.expr?.value ?? value?.value ?? value ?? '').replace(/^"|"$/g, '')
}

function columnRef(node) {
  return {
    alias: node.table ? String(node.table).toLowerCase() : null,
    name: node.column === '*' ? '*' : identifier(node.column),
  }
}

function selectOutputColumns(query, sourceMap) {
  return (query.columns || []).flatMap((item) => {
    const expression = item.expr
    if (expression?.type === 'column_ref' && expression.column !== '*') {
      const ref = columnRef(expression)
      const source = ref.alias ? sourceMap.get(ref.alias) : uniqueSourceForColumn(sourceMap, ref.name)
      return [[String(item.as || ref.name).toLowerCase(), source?.origins.get(ref.name.toLowerCase()) || null]]
    }
    return item.as ? [[String(item.as).toLowerCase(), null]] : []
  })
}

function uniqueSourceForColumn(sourceMap, name) {
  const matches = [...new Set(sourceMap.values())].filter((source) => source.columns.has(name.toLowerCase()))
  return matches.length === 1 ? matches[0] : null
}

function validateQuery(query, approvedTables, relationships, inheritedCtes = new Map(), depth = 0) {
  if (depth > 12 || !query || query.type !== 'select' || query.into?.position) reject('Only read-only SELECT queries are allowed.')
  if (query.recursive) reject('Recursive CTEs are not supported.')

  const ctes = new Map(inheritedCtes)
  for (const cte of query.with || []) {
    const name = identifier(cte.name).toLowerCase()
    if (!name || ctes.has(name)) reject('Invalid or duplicate CTE name.')
    const cteOutput = validateQuery(cte.stmt, approvedTables, relationships, ctes, depth + 1)
    const declaredColumns = cte.columns?.map((column) => identifier(column).toLowerCase())
    if (declaredColumns?.length && declaredColumns.length !== cteOutput.length) reject('CTE column count does not match its query.')
    const columns = new Set(declaredColumns?.length ? declaredColumns : cteOutput.map(([column]) => column))
    const origins = new Map()
    cteOutput.forEach(([column, origin], index) => origins.set(declaredColumns?.length ? declaredColumns[index] : column, origin))
    ctes.set(name, { columns, origins, baseTable: null })
  }

  const sourceMap = new Map()
  for (const [index, item] of (query.from || []).entries()) {
    if (index > 0 && !item.join) reject('Comma-separated tables are not allowed; join approved tables through declared keys.')
    let source
    if (item.expr?.ast) {
      const output = validateQuery(item.expr.ast, approvedTables, relationships, ctes, depth + 1)
      source = { columns: new Set(output.map(([column]) => column)), origins: new Map(output), baseTable: null }
    } else {
      const name = String(item.table || '').toLowerCase()
      source = ctes.get(name)
      if (!source) {
        if (item.db || item.schema) reject('Schema-qualified table references are not allowed.')
        const table = approvedTables.get(name)
        if (!table) reject(`Table is not approved for analytics: ${item.table || 'unknown'}.`)
        source = {
          columns: new Set(table.columns.map((column) => column.name.toLowerCase())),
          origins: new Map(table.columns.map((column) => [column.name.toLowerCase(), { table: name, column: column.name.toLowerCase() }])),
          baseTable: name,
        }
      }
    }
    const alias = String(item.as || item.table || '').toLowerCase()
    if (!alias || sourceMap.has(alias)) reject('Invalid or duplicate table alias.')
    sourceMap.set(alias, source)
  }

  for (const [index, item] of (query.from || []).entries()) {
    if (index === 0) continue
    if (/cross/i.test(item.join || '') || !item.on) reject('Cross joins and joins without a key condition are not allowed.')
    const rightAlias = String(item.as || item.table || '').toLowerCase()
    const rightSource = sourceMap.get(rightAlias)
    const joinPairs = []
    walkLocal(item.on, (node) => {
      if (node.type === 'binary_expr' && node.operator === '=' && node.left?.type === 'column_ref' && node.right?.type === 'column_ref') {
        joinPairs.push([columnRef(node.left), columnRef(node.right)])
      }
    }, (nested) => validateQuery(nested, approvedTables, relationships, ctes, depth + 1))
    const validJoin = (relationships || []).some(({ from, to }) => {
      const [fromTable, fromColumn] = from.split('.')
      const [toTable, toColumn] = to.split('.')
      const hasOrigin = (tableName, columnName) => [...sourceMap.values()].some((source) =>
        [...source.origins.values()].some((origin) => origin?.table === tableName.toLowerCase() && origin.column === columnName.toLowerCase()))
      if (!hasOrigin(fromTable, fromColumn) || !hasOrigin(toTable, toColumn)) return false
      return joinPairs.some(([left, right]) => {
        const leftOrigin = sourceMap.get(left.alias)?.origins.get(left.name.toLowerCase())
        const rightOrigin = sourceMap.get(right.alias)?.origins.get(right.name.toLowerCase())
        return (leftOrigin?.table === fromTable.toLowerCase() && leftOrigin.column === fromColumn.toLowerCase() && rightOrigin?.table === toTable.toLowerCase() && rightOrigin.column === toColumn.toLowerCase()) ||
          (rightOrigin?.table === fromTable.toLowerCase() && rightOrigin.column === fromColumn.toLowerCase() && leftOrigin?.table === toTable.toLowerCase() && leftOrigin.column === toColumn.toLowerCase())
      })
    })
    if (!validJoin) reject('JOIN must match an approved foreign-key relationship.')
  }

  const selectedAliases = new Set((query.columns || []).map((item) => item.as && String(item.as).toLowerCase()).filter(Boolean))
  walkLocal(query, (node) => {
    if (node.type === 'column_ref') {
      const ref = columnRef(node)
      if (ref.name === '*') {
        if (ref.alias && !sourceMap.has(ref.alias)) reject(`Unknown table alias: ${ref.alias}.`)
        return
      }
      if (ref.alias) {
        const source = sourceMap.get(ref.alias)
        if (!source || !source.columns.has(ref.name.toLowerCase())) reject(`Column is not approved for analytics: ${ref.alias}.${ref.name}.`)
      } else if (!selectedAliases.has(ref.name.toLowerCase()) && !uniqueSourceForColumn(sourceMap, ref.name)) {
        reject(`Column is unknown or ambiguous: ${ref.name}.`)
      }
    }
    if (node.type === 'function') {
      const functionName = node.name?.name?.at(-1)?.value?.toLowerCase()
      if (!SAFE_FUNCTIONS.has(functionName)) reject(`Function is not approved for analytics: ${functionName || 'unknown'}.`)
    }
    if (node.type === 'aggr_func' && !SAFE_FUNCTIONS.has(String(node.name).toLowerCase())) reject(`Aggregate is not approved: ${node.name}.`)
    if (node.type === 'window_func') {
      const functionName = String(node.name?.name?.at(-1)?.value || node.name).toLowerCase()
      if (!SAFE_WINDOW_FUNCTIONS.has(functionName)) reject(`Window function is not approved: ${functionName}.`)
    }
  }, (nested) => validateQuery(nested, approvedTables, relationships, ctes, depth + 1))

  const outputs = selectOutputColumns(query, sourceMap)
  if (query._next) validateQuery(query._next, approvedTables, relationships, ctes, depth + 1)
  return outputs
}

function walkLocal(value, visit, onQuery = () => {}, root = value) {
  if (!value || typeof value !== 'object') return
  if (Array.isArray(value)) return value.forEach((item) => walkLocal(item, visit, onQuery, root))
  if (value !== root && ['select', 'insert', 'update', 'delete'].includes(value.type)) {
    if (value.type !== 'select') reject('Only read-only SELECT operations are allowed.')
    onQuery(value)
    return
  }
  visit(value)
  for (const [key, child] of Object.entries(value)) {
    if (['with', 'stmt', '_next'].includes(key)) continue
    if (key === 'ast' && child?.type === 'select') {
      onQuery(child)
      continue
    }
    walkLocal(child, visit, onQuery, root)
  }
}

export function validateSql(input, schemaContext, { maxLength = MAX_SQL_LENGTH } = {}) {
  const sql = String(input || '').trim().replace(/^```(?:sql)?\s*/i, '').replace(/\s*```$/, '').trim().replace(/;\s*$/, '')
  if (!sql) reject('SQL query cannot be empty.')
  if (sql.length > maxLength) reject(`SQL query exceeds the ${maxLength} character limit.`)

  let ast
  try { ast = parser.astify(sql, { database: 'Postgresql' }) } catch {
    reject('SQL query is malformed or unsupported.')
  }
  if (Array.isArray(ast)) reject('Multiple SQL statements are not allowed.')

  const approvedNames = new Set(approvedAnalyticsTables)
  const approvedTables = new Map((schemaContext.tables || [])
    .filter((table) => approvedNames.has(table.name.toLowerCase()))
    .map((table) => [table.name.toLowerCase(), table]))
  validateQuery(ast, approvedTables, schemaContext.relationships || [])
  return Object.freeze({ sql })
}

export const sqlLimits = Object.freeze({ maxLength: MAX_SQL_LENGTH, maxRows: 500, statementTimeoutMs: 5000 })
