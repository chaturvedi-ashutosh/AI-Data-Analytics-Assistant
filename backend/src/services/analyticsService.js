import { generateSqlForQuestion } from './sqlGenerationService.js'
import { validateSql } from './sqlValidator.js'
import { executeAnalyticsQuery } from './queryService.js'
import { analyzeResults } from './resultAnalyzer.js'
import { buildVisualization } from './visualizationService.js'

export async function analyzeQuestion(question, {
  conversationContext = null,
  generator = generateSqlForQuestion,
  queryExecutor = executeAnalyticsQuery,
} = {}) {
  const generated = await generator(question, { conversationContext })
  if (generated.status === 'clarification_needed') {
    return { question, sql: null, explanation: generated.explanation, status: 'clarification_needed' }
  }

  let validatedQuery
  try {
    validatedQuery = validateSql(generated.sql, generated.schemaContext)
  } catch (error) {
    let repaired
    try {
      const repairHint = /JOIN must match/i.test(error.message)
        ? 'Remove the non-foreign-key join. For percentage-of-total results, use a window aggregate such as SUM(SUM(oi.line_total)) OVER () in the grouped product query; keep only products JOIN order_items ON oi.product_id = p.id.'
        : null
      repaired = await generator(question, {
        conversationContext,
        schemaContext: generated.schemaContext,
        validationFeedback: { sql: generated.sql, reason: error.message, repairHint },
      })
    } catch (repairError) {
      return { status: 'rejected', reason: repairError.message || error.message }
    }
    if (repaired.status === 'clarification_needed') {
      return { question, sql: null, explanation: repaired.explanation, status: 'clarification_needed' }
    }
    try {
      validatedQuery = validateSql(repaired.sql, repaired.schemaContext || generated.schemaContext)
    } catch (repairError) {
      return { status: 'rejected', reason: repairError.message }
    }
    generated.sql = repaired.sql
    generated.explanation = repaired.explanation
    generated.schemaContext = repaired.schemaContext || generated.schemaContext
  }

  const execution = await queryExecutor(validatedQuery)
  const analysis = analyzeResults({
    question,
    sql: validatedQuery.sql,
    rows: execution.rows,
    columnMetadata: execution.columnMetadata,
    truncated: execution.truncated,
  })
  const visualization = buildVisualization({
    question,
    rows: execution.rows,
    columns: execution.columns,
    columnMetadata: execution.columnMetadata,
  })

  return {
    question,
    sql: validatedQuery.sql,
    explanation: generated.explanation,
    columns: execution.columns,
    columnMetadata: execution.columnMetadata,
    rows: execution.rows,
    insight: analysis.insight,
    visualization,
    truncated: execution.truncated,
    executionTime: execution.executionTime,
    status: 'success',
  }
}

