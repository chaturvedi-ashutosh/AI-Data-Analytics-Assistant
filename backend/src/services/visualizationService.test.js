import test from 'node:test'
import assert from 'node:assert/strict'
import { buildVisualization } from './visualizationService.js'

test('selects a KPI for one numeric result', () => {
  assert.equal(buildVisualization({ question: 'Total revenue', rows: [{ revenue: '240' }], columns: ['revenue'] }).type, 'kpi')
})

test('selects a categorical bar chart', () => {
  const chart = buildVisualization({ question: 'Revenue by region', rows: [{ region: 'West', revenue: '3' }, { region: 'East', revenue: '2' }], columns: ['region', 'revenue'] })
  assert.equal(chart.type, 'bar')
  assert.equal(chart.xAxis, 'region')
  assert.equal(buildVisualization({ question: 'How many orders for each status?', rows: [{ status: 'completed', count: '5' }, { status: 'pending', count: '1' }], columns: ['status', 'count'] }).type, 'bar')
})

test('selects and orders a time-series line chart', () => {
  const chart = buildVisualization({
    question: 'Monthly revenue',
    rows: [{ month: '2025-02-01', revenue: '2' }, { month: '2025-01-01', revenue: '1' }],
    columns: ['month', 'revenue'],
  })
  assert.equal(chart.type, 'line')
  assert.equal(chart.data[0].month, '2025-01-01')
})

test('selects a pie for small composition datasets and a table for detail requests', () => {
  const rows = [{ category: 'A', share: 70 }, { category: 'B', share: 30 }]
  assert.equal(buildVisualization({ question: 'Share composition by category', rows, columns: ['category', 'share'] }).type, 'pie')
  assert.equal(buildVisualization({ question: 'Show detailed records by category', rows, columns: ['category', 'share'] }).type, 'table')
})

test('uses the requested percentage metric and ignores numeric identifiers', () => {
  const chart = buildVisualization({
    question: 'Top products and percentage of total revenue',
    rows: [
      { id: 7, name: 'Keyboard', revenue: '120', revenue_percentage: '60.00' },
      { id: 8, name: 'Mouse', revenue: '80', revenue_percentage: '40.00' },
    ],
    columns: ['id', 'name', 'revenue', 'revenue_percentage'],
  })
  assert.equal(chart.type, 'pie')
  assert.equal(chart.xAxis, 'name')
  assert.equal(chart.yAxis, 'revenue_percentage')
})

test('falls back to a table for empty or unsupported data', () => {
  assert.equal(buildVisualization({ question: 'Empty', rows: [], columns: [] }).type, 'table')
  assert.equal(buildVisualization({ question: 'Details', rows: [{ label: 'x' }], columns: ['label'] }).type, 'table')
})
