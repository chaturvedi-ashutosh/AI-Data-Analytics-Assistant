import test from 'node:test'
import assert from 'node:assert/strict'
import { executeAnalyticsQuery } from './queryService.js'

function createFakePool({ resultRows = [], failExecution = false, invalidRole = false } = {}) {
  const calls = []
  let released = false
  const client = {
    async query(query) {
      calls.push(query)
      const sql = typeof query === 'string' ? query : query.text
      if (sql.startsWith('SELECT current_user AS role_name')) {
        return { rows: [{
          role_name: invalidRole ? 'postgres' : 'analytics_user',
          is_superuser: invalidRole,
          can_create_database: false,
          can_create_roles: false,
          has_role_memberships: false,
          has_write_privileges: false,
          can_read_customer_pii: false,
          transaction_read_only: true,
        }] }
      }
      if (failExecution && typeof query !== 'string' && sql.includes('_analytics_bounded_result')) {
        throw Object.assign(new Error('query canceled'), { code: '57014' })
      }
      if (typeof query !== 'string' && sql.includes('_analytics_bounded_result')) {
        return { fields: [{ name: 'status' }], rows: resultRows }
      }
      return { rows: [] }
    },
    release() { released = true },
  }
  return { pool: { async connect() { return client } }, calls, wasReleased: () => released }
}

test('executes in a read-only transaction and caps returned rows', async () => {
  const fake = createFakePool({ resultRows: [{ status: 'a' }, { status: 'b' }, { status: 'c' }] })
  const result = await executeAnalyticsQuery({ sql: 'SELECT status FROM orders' }, { databasePool: fake.pool, maxRows: 2 })
  assert.deepEqual(result.columns, ['status'])
  assert.deepEqual(result.rows, [{ status: 'a' }, { status: 'b' }])
  assert.equal(result.truncated, true)
  assert.equal(fake.calls[0], 'BEGIN READ ONLY')
  assert.equal(fake.calls.at(-1), 'COMMIT')
  assert.equal(fake.wasReleased(), true)
})

test('refuses an incorrectly configured database role before query execution', async () => {
  const fake = createFakePool({ invalidRole: true })
  await assert.rejects(
    executeAnalyticsQuery({ sql: 'SELECT status FROM orders' }, { databasePool: fake.pool }),
    /analytics read-only role/,
  )
  assert.ok(fake.calls.includes('ROLLBACK'))
  assert.equal(fake.wasReleased(), true)
})

test('maps PostgreSQL statement timeout to a safe API error', async () => {
  const fake = createFakePool({ failExecution: true })
  await assert.rejects(
    executeAnalyticsQuery({ sql: 'SELECT status FROM orders' }, { databasePool: fake.pool }),
    (error) => error.status === 408 && /time limit/.test(error.message),
  )
  assert.ok(fake.calls.includes('ROLLBACK'))
})
