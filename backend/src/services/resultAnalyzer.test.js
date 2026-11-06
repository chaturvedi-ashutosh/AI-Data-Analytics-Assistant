import test from 'node:test'
import assert from 'node:assert/strict'
import { analyzeResults } from './resultAnalyzer.js'

test('handles empty results without inventing observations', () => {
  assert.match(analyzeResults({ question: 'revenue?', rows: [] }).insight, /returned no rows/)
})

test('summarizes observed category highs and lows without causal claims', () => {
  const result = analyzeResults({
    question: 'Revenue by region',
    sql: 'SELECT region, SUM(revenue) AS revenue FROM data GROUP BY region',
    rows: [{ region: 'West', revenue: '120' }, { region: 'East', revenue: '80' }],
    columnMetadata: [{ name: 'revenue', dataTypeId: 1700 }],
  })
  assert.match(result.insight, /West has the highest revenue \(120\)/)
  assert.match(result.insight, /East has the lowest revenue \(80\)/)
  assert.doesNotMatch(result.insight, /because|caused/i)
})

test('calculates a date change from returned values and caveats capped data', () => {
  const result = analyzeResults({
    question: 'Monthly revenue',
    sql: '...',
    rows: [{ month: '2025-01-01', revenue: '100' }, { month: '2025-02-01', revenue: '125' }],
    columnMetadata: [{ name: 'month', dataTypeId: 1082 }, { name: 'revenue', dataTypeId: 1700 }],
    truncated: true,
  })
  assert.match(result.insight, /increased by 25\.0%/)
  assert.match(result.insight, /only the returned rows/)
})

test('flags only statistically separated values as potential outliers', () => {
  const result = analyzeResults({
    question: 'Revenue by region',
    rows: [
      { region: 'A', revenue: 10 }, { region: 'B', revenue: 11 },
      { region: 'C', revenue: 9 }, { region: 'D', revenue: 12 }, { region: 'E', revenue: 100 },
    ],
  })
  assert.match(result.insight, /Potential outlier.*E \(100\)/)
})
