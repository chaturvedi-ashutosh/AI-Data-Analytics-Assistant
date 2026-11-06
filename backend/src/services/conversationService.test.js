import test from 'node:test'
import assert from 'node:assert/strict'
import { getConversationContext, saveConversationTurn } from './conversationService.js'

test('retains only the latest bounded follow-up context for a conversation', () => {
  const id = 'f83a16cb-3925-40d9-97f6-0ace935e3fb9'
  saveConversationTurn(id, { question: 'Show monthly revenue', sql: 'SELECT month, SUM(total_amount) AS revenue FROM orders GROUP BY month' })
  assert.deepEqual(getConversationContext(id), {
    previousQuestion: 'Show monthly revenue',
    previousSql: 'SELECT month, SUM(total_amount) AS revenue FROM orders GROUP BY month',
  })
  saveConversationTurn(id, { question: 'Now compare it with last year' })
  assert.deepEqual(getConversationContext(id), { previousQuestion: 'Now compare it with last year', previousSql: null })
})
