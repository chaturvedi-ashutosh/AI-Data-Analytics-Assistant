import test from 'node:test'
import assert from 'node:assert/strict'
import { analyzeQuestion } from './analyticsService.js'

const schemaContext = {
  tables: [
    { name: 'orders', columns: [{ name: 'id' }, { name: 'status' }, { name: 'total_amount' }] },
    { name: 'products', columns: [{ name: 'id' }, { name: 'name' }] },
    { name: 'order_items', columns: [{ name: 'id' }, { name: 'product_id' }, { name: 'line_total' }] },
  ],
  relationships: [{ from: 'order_items.product_id', to: 'products.id' }],
}

test('runs the generated SQL through validation, execution, analysis and visualization', async () => {
  let executed = null
  const response = await analyzeQuestion('How many orders by status?', {
    generator: async () => ({
      status: 'generated',
      sql: 'SELECT status, COUNT(*) AS order_count FROM orders GROUP BY status ORDER BY order_count DESC',
      explanation: 'Counts orders for each status.',
      schemaContext,
    }),
    queryExecutor: async (query) => {
      executed = query
      return {
        columns: ['status', 'order_count'],
        columnMetadata: [{ name: 'status', dataTypeId: 25 }, { name: 'order_count', dataTypeId: 20 }],
        rows: [{ status: 'completed', order_count: '14' }, { status: 'pending', order_count: '1' }],
        truncated: false,
        executionTime: 3,
      }
    },
  })

  assert.ok(executed)
  assert.equal(response.status, 'success')
  assert.deepEqual(response.columns, ['status', 'order_count'])
  assert.equal(response.rows.length, 2)
  assert.equal(response.visualization.type, 'bar')
  assert.match(response.insight, /completed has the highest order_count/)
})

test('does not execute SQL rejected by validation', async () => {
  let executeCount = 0
  const result = await analyzeQuestion('Show payroll', {
    generator: async () => ({ status: 'generated', sql: 'SELECT salary FROM payroll', schemaContext }),
    queryExecutor: async () => { executeCount += 1 },
  })
  assert.equal(result.status, 'rejected')
  assert.equal(executeCount, 0)
})

test('repairs a rejection-prone percentage query, then validates before executing', async () => {
  const invalidSql = 'WITH product_revenue AS (SELECT p.id, p.name, SUM(oi.line_total) AS revenue FROM products p JOIN order_items oi ON oi.product_id = p.id GROUP BY p.id, p.name), revenue_summary AS (SELECT SUM(revenue) AS total_revenue FROM product_revenue) SELECT pr.id, pr.name, pr.revenue, pr.revenue / rs.total_revenue * 100 AS revenue_percentage FROM product_revenue pr JOIN revenue_summary rs ON TRUE ORDER BY pr.revenue DESC LIMIT 3'
  const validSql = 'SELECT p.id, p.name, SUM(oi.line_total) AS revenue, 100.0 * SUM(oi.line_total) / NULLIF(SUM(SUM(oi.line_total)) OVER (), 0) AS revenue_percentage FROM products p JOIN order_items oi ON oi.product_id = p.id GROUP BY p.id, p.name ORDER BY revenue DESC LIMIT 3'
  const drafts = []
  let executed
  const result = await analyzeQuestion('Top 3 products and their percentage of total revenue', {
    generator: async (_question, options) => {
      drafts.push(options)
      if (drafts.length === 1) return { status: 'generated', sql: invalidSql, explanation: 'draft', schemaContext }
      return { status: 'generated', sql: validSql, explanation: 'Uses a window aggregate for the overall total.', schemaContext }
    },
    queryExecutor: async (validated) => {
      executed = validated.sql
      return {
        columns: ['id', 'name', 'revenue', 'revenue_percentage'],
        columnMetadata: [],
        rows: [{ id: 1, name: 'Keyboard', revenue: '100', revenue_percentage: '50' }],
        truncated: false,
        executionTime: 1,
      }
    },
  })

  assert.equal(drafts.length, 2)
  assert.match(drafts[1].validationFeedback.reason, /JOIN must match/)
  assert.match(drafts[1].validationFeedback.sql, /ON TRUE/)
  assert.equal(executed, validSql)
  assert.equal(result.status, 'success')
})

test('returns clarification without running SQL and forwards safe follow-up context', async () => {
  let receivedContext
  let executeCount = 0
  const clarification = await analyzeQuestion('Which time range?', {
    generator: async (_question, options) => {
      receivedContext = options.conversationContext
      return { status: 'clarification_needed', explanation: 'Which year do you mean?' }
    },
    queryExecutor: async () => { executeCount += 1 },
    conversationContext: { previousQuestion: 'Show monthly revenue', previousSql: 'SELECT ...' },
  })
  assert.equal(clarification.status, 'clarification_needed')
  assert.deepEqual(receivedContext, { previousQuestion: 'Show monthly revenue', previousSql: 'SELECT ...' })
  assert.equal(executeCount, 0)
})
