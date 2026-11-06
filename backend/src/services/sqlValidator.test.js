import test from 'node:test'
import assert from 'node:assert/strict'
import { validateSql } from './sqlValidator.js'

const schema = {
  tables: [
    { name: 'regions', columns: [{ name: 'id' }, { name: 'name' }] },
    { name: 'customers', columns: [{ name: 'id' }, { name: 'region_id' }, { name: 'signup_date' }] },
    { name: 'products', columns: [{ name: 'id' }, { name: 'name' }, { name: 'category' }] },
    { name: 'orders', columns: [{ name: 'id' }, { name: 'customer_id' }, { name: 'order_date' }, { name: 'status' }, { name: 'total_amount' }] },
    { name: 'order_items', columns: [{ name: 'id' }, { name: 'order_id' }, { name: 'product_id' }, { name: 'quantity' }, { name: 'unit_price' }, { name: 'line_total' }] },
  ],
  relationships: [
    { from: 'customers.region_id', to: 'regions.id' },
    { from: 'orders.customer_id', to: 'customers.id' },
    { from: 'order_items.order_id', to: 'orders.id' },
    { from: 'order_items.product_id', to: 'products.id' },
  ],
}

test('accepts a simple SELECT', () => {
  assert.equal(validateSql('SELECT id, status FROM orders', schema).sql, 'SELECT id, status FROM orders')
})

test('accepts FK joins and grouped aggregations', () => {
  const query = 'SELECT p.name, SUM(oi.line_total) AS revenue FROM products p JOIN order_items oi ON oi.product_id = p.id GROUP BY p.name ORDER BY revenue DESC'
  assert.match(validateSql(query, schema).sql, /GROUP BY p.name/i)
})

test('accepts supported date aggregation', () => {
  const query = "SELECT DATE_TRUNC('month', order_date) AS month, SUM(total_amount) AS revenue FROM orders GROUP BY 1 ORDER BY month"
  assert.doesNotThrow(() => validateSql(query, schema))
})

test('accepts a safe window function and rejects unsupported functions', () => {
  assert.doesNotThrow(() => validateSql('SELECT id, ROW_NUMBER() OVER (ORDER BY order_date) AS sequence FROM orders', schema))
  assert.throws(() => validateSql('SELECT current_setting(\'search_path\') FROM orders', schema), /Function is not approved/)
})

test('accepts bounded subqueries and read-only CTEs', () => {
  const subquery = 'SELECT q.product_id, q.revenue FROM (SELECT product_id, SUM(line_total) AS revenue FROM order_items GROUP BY product_id) q ORDER BY q.revenue DESC'
  const cte = 'WITH sales AS (SELECT customer_id, SUM(total_amount) AS revenue FROM orders GROUP BY customer_id) SELECT customer_id, revenue FROM sales ORDER BY revenue DESC'
  assert.doesNotThrow(() => validateSql(subquery, schema))
  assert.doesNotThrow(() => validateSql(cte, schema))
})

test('rejects write operations and multiple statements', () => {
  for (const query of [
    'DELETE FROM orders',
    'UPDATE orders SET status = \'completed\'',
    'DROP TABLE orders',
    'ALTER TABLE orders ADD COLUMN x integer',
    'TRUNCATE orders',
    'SELECT id FROM orders; SELECT id FROM customers',
  ]) assert.throws(() => validateSql(query, schema))
})

test('rejects unauthorized tables, columns, and unapproved functions', () => {
  assert.throws(() => validateSql('SELECT * FROM payroll', schema), /not approved/)
  const alteredContext = { ...schema, tables: [...schema.tables, { name: 'payroll', columns: [{ name: 'salary' }] }] }
  assert.throws(() => validateSql('SELECT salary FROM payroll', alteredContext), /not approved/)
  assert.throws(() => validateSql('SELECT secret FROM orders', schema), /unknown or ambiguous/i)
  assert.throws(() => validateSql('SELECT pg_sleep(10) FROM orders', schema), /Function is not approved/)
})

test('rejects cross joins, malformed queries, empty SQL, and excessive length', () => {
  assert.throws(() => validateSql('SELECT p.name FROM products p CROSS JOIN orders o', schema), /Cross joins/)
  assert.throws(() => validateSql('SELECT FROM', schema), /malformed/)
  assert.throws(() => validateSql('', schema), /cannot be empty/)
  assert.throws(() => validateSql(`SELECT '${'x'.repeat(12000)}'`, schema), /character limit/)
})

test('rejects a data-modifying CTE', () => {
  assert.throws(() => validateSql('WITH changed AS (DELETE FROM orders RETURNING id) SELECT id FROM changed', schema))
})
