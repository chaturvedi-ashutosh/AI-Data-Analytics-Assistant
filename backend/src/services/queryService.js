import { pool } from '../db/pool.js'
import { config } from '../config/env.js'
import { approvedAnalyticsTables } from '../config/analyticsSchema.js'

function databaseError(error) {
  const timeout = error.code === '57014'
  const result = new Error(timeout
    ? 'The analytics query exceeded its execution time limit.'
    : 'The analytics query could not be completed.')
  result.status = timeout ? 408 : 500
  result.publicMessage = result.message
  result.cause = error
  return result
}

export async function executeAnalyticsQuery(validatedQuery, {
  databasePool = pool,
  maxRows = config.analyticsMaxRows,
  timeoutMs = config.analyticsQueryTimeoutMs,
} = {}) {
  if (!validatedQuery || typeof validatedQuery.sql !== 'string') {
    throw Object.assign(new Error('A validated SQL query is required.'), { status: 500 })
  }

  const client = await databasePool.connect()
  let transactionOpen = false
  try {
    await client.query('BEGIN READ ONLY')
    transactionOpen = true
    await client.query("SELECT set_config('statement_timeout', $1, true)", [`${timeoutMs}ms`])

    const roleCheck = await client.query(
      `SELECT current_user AS role_name,
              role.rolsuper AS is_superuser,
              role.rolcreatedb AS can_create_database,
              role.rolcreaterole AS can_create_roles,
              EXISTS (
                SELECT 1 FROM pg_auth_members AS membership
                WHERE membership.member = role.oid
              ) AS has_role_memberships,
              EXISTS (
                SELECT 1
                FROM unnest($1::text[]) AS approved(table_name)
                WHERE has_table_privilege(current_user, format('public.%I', approved.table_name), 'INSERT')
                   OR has_any_column_privilege(current_user, format('public.%I', approved.table_name), 'INSERT')
                   OR has_table_privilege(current_user, format('public.%I', approved.table_name), 'UPDATE')
                   OR has_any_column_privilege(current_user, format('public.%I', approved.table_name), 'UPDATE')
                   OR has_table_privilege(current_user, format('public.%I', approved.table_name), 'DELETE')
              ) AS has_write_privileges,
              has_column_privilege(current_user, 'public.customers', 'full_name', 'SELECT')
                OR has_column_privilege(current_user, 'public.customers', 'email', 'SELECT') AS can_read_customer_pii,
              current_setting('transaction_read_only') = 'on' AS transaction_read_only
       FROM pg_roles AS role
       WHERE role.rolname = current_user`,
      [approvedAnalyticsTables],
    )
    const role = roleCheck.rows[0]
    if (!role || role.role_name !== config.analyticsDatabaseRole || role.is_superuser || role.can_create_database || role.can_create_roles || role.has_role_memberships || role.has_write_privileges || role.can_read_customer_pii || !role.transaction_read_only) {
      throw Object.assign(new Error('The configured PostgreSQL connection is not restricted to the analytics read-only role.'), {
        status: 503,
        publicMessage: 'Analytics is unavailable because the database connection is not using the required read-only role.',
      })
    }

    const startedAt = process.hrtime.bigint()
    const result = await client.query({
      text: `SELECT * FROM (${validatedQuery.sql}) AS "_analytics_bounded_result" LIMIT $1`,
      values: [maxRows + 1],
    })
    const executionTime = Number((process.hrtime.bigint() - startedAt) / 1000000n)
    await client.query('COMMIT')
    transactionOpen = false

    return {
      columns: result.fields.map((field) => field.name),
      columnMetadata: result.fields.map((field) => ({
        name: field.name,
        dataTypeId: field.dataTypeID,
      })),
      rows: result.rows.slice(0, maxRows),
      truncated: result.rows.length > maxRows,
      executionTime,
    }
  } catch (error) {
    if (transactionOpen) {
      try { await client.query('ROLLBACK') } catch { /* The connection will be returned after rollback failure. */ }
    }
    if (error.publicMessage) throw error
    console.error('Analytics query execution failed', { code: error.code, message: error.message })
    throw databaseError(error)
  } finally {
    client.release()
  }
}
