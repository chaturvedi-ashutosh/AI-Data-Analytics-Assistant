import { pool } from './db/pool.js'

const failures = []

function check(condition, description) {
  const label = condition ? 'PASS' : 'FAIL'
  console.log(`${label} ${description}`)
  if (!condition) failures.push(description)
}

const expectedColumns = {
  regions: ['id', 'name', 'created_at'],
  customers: ['id', 'full_name', 'email', 'region_id', 'signup_date', 'created_at'],
  products: ['id', 'name', 'category', 'unit_price', 'active', 'created_at'],
  orders: ['id', 'customer_id', 'order_date', 'status', 'total_amount', 'created_at'],
  order_items: ['id', 'order_id', 'product_id', 'quantity', 'unit_price', 'line_total'],
}

const expectedRows = {
  regions: 5,
  customers: 12,
  products: 10,
  orders: 21,
  order_items: 38,
}

const expectedForeignKeys = [
  'customers.region_id->regions.id',
  'orders.customer_id->customers.id',
  'order_items.order_id->orders.id',
  'order_items.product_id->products.id',
]

const expectedIndexes = [
  'idx_customers_region_id',
  'idx_customers_signup_date',
  'idx_products_category',
  'idx_orders_customer_id',
  'idx_orders_order_date',
  'idx_orders_status_order_date',
  'idx_order_items_order_id',
  'idx_order_items_product_id',
]

try {
  const connection = await pool.query(
    `SELECT
       current_database() AS database,
       current_setting('transaction_read_only') = 'on' AS default_read_only,
       current_user = 'analytics_user' AS is_analytics_user,
       roles.rolsuper AS superuser,
       has_schema_privilege(current_user, 'public', 'CREATE') AS can_create_in_public
     FROM pg_roles AS roles
     WHERE roles.rolname = current_user`,
  )
  const role = connection.rows[0]

  console.log('Connection:', role)
  check(role?.database === 'analytics_db', 'connected to analytics_db')
  check(role?.is_analytics_user === true, 'connected as analytics_user')
  check(role?.default_read_only === true, 'new sessions are read-only by default')
  check(role?.superuser === false, 'application role is not a superuser')
  check(role?.can_create_in_public === false, 'application role cannot create objects in public')

  const columnsResult = await pool.query(
    `SELECT table_name, column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
     ORDER BY table_name, ordinal_position`,
  )
  const columnMap = new Map()
  for (const { table_name, column_name } of columnsResult.rows) {
    if (!columnMap.has(table_name)) columnMap.set(table_name, new Set())
    columnMap.get(table_name).add(column_name)
  }

  for (const [table, expected] of Object.entries(expectedColumns)) {
    const actual = columnMap.get(table)
    const missing = expected.filter((column) => !actual?.has(column))
    check(actual && missing.length === 0, `${table} has expected columns${missing.length ? ` (missing: ${missing.join(', ')})` : ''}`)
  }

  for (const [table, minimumRows] of Object.entries(expectedRows)) {
    if (!columnMap.has(table)) continue
    const result = await pool.query(`SELECT COUNT(*)::int AS count FROM public.${table}`)
    const count = result.rows[0].count
    console.log(`  ${table}: ${count} rows`)
    check(count >= minimumRows, `${table} contains at least ${minimumRows} sample rows`)
  }

  const foreignKeyResult = await pool.query(
    `SELECT
       source_table.relname || '.' || source_column.attname || '->' ||
         target_table.relname || '.' || target_column.attname AS relationship
     FROM pg_constraint AS constraint_details
     JOIN pg_class AS source_table ON source_table.oid = constraint_details.conrelid
     JOIN pg_namespace AS source_schema ON source_schema.oid = source_table.relnamespace
     JOIN pg_class AS target_table ON target_table.oid = constraint_details.confrelid
     JOIN LATERAL unnest(constraint_details.conkey) WITH ORDINALITY AS source_key(attnum, position)
       ON TRUE
     JOIN LATERAL unnest(constraint_details.confkey) WITH ORDINALITY AS target_key(attnum, position)
       ON target_key.position = source_key.position
     JOIN pg_attribute AS source_column
       ON source_column.attrelid = source_table.oid AND source_column.attnum = source_key.attnum
     JOIN pg_attribute AS target_column
       ON target_column.attrelid = target_table.oid AND target_column.attnum = target_key.attnum
     WHERE constraint_details.contype = 'f'
       AND source_schema.nspname = 'public'`,
  )
  const actualForeignKeys = new Set(foreignKeyResult.rows.map(({ relationship }) => relationship))
  console.log('Foreign keys:', [...actualForeignKeys])
  for (const relationship of expectedForeignKeys) {
    check(actualForeignKeys.has(relationship), `foreign key ${relationship}`)
  }

  const indexResult = await pool.query(
    `SELECT indexname
     FROM pg_indexes
     WHERE schemaname = 'public'`,
  )
  const actualIndexes = new Set(indexResult.rows.map(({ indexname }) => indexname))
  for (const index of expectedIndexes) {
    check(actualIndexes.has(index), `index ${index}`)
  }

  const totalsResult = await pool.query(
    `SELECT COUNT(*)::int AS mismatches
     FROM orders AS order_record
     WHERE order_record.total_amount <> COALESCE(
       (SELECT SUM(item.line_total) FROM order_items AS item WHERE item.order_id = order_record.id),
       0
     )`,
  )
  check(totalsResult.rows[0].mismatches === 0, 'order totals match their line items')

  const statusResult = await pool.query('SELECT DISTINCT status FROM orders')
  const statuses = new Set(statusResult.rows.map(({ status }) => status))
  for (const status of ['pending', 'processing', 'shipped', 'completed', 'cancelled', 'refunded']) {
    check(statuses.has(status), `sample orders include ${status} status`)
  }

  if (columnMap.has('orders') && columnMap.has('order_items')) {
    const privileges = await pool.query(
      `SELECT
         has_table_privilege('analytics_user', 'public.orders', 'SELECT') AS can_select,
         has_table_privilege('analytics_user', 'public.orders', 'INSERT') AS can_insert,
         has_table_privilege('analytics_user', 'public.orders', 'UPDATE') AS can_update,
         has_table_privilege('analytics_user', 'public.orders', 'DELETE') AS can_delete`,
    )
    const access = privileges.rows[0]
    check(access.can_select === true, 'application role can read analytics tables')
    check(access.can_insert === false, 'application role cannot insert rows')
    check(access.can_update === false, 'application role cannot update rows')
    check(access.can_delete === false, 'application role cannot delete rows')
  }
} catch (error) {
  console.error('Database verification could not complete:', error.message)
  process.exitCode = 1
} finally {
  await pool.end()
}

if (failures.length > 0) {
  console.error(`\n${failures.length} database check(s) failed.`)
  process.exitCode = 1
} else if (process.exitCode !== 1) {
  console.log('\nAll database checks passed.')
}
