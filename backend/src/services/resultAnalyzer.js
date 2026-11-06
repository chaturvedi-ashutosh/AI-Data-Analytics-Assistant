const DATE_TYPES = new Set([1082, 1114, 1184])

function numberValue(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value)
  return null
}

function formatValue(value) {
  const numeric = numberValue(value)
  if (numeric !== null) return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(numeric)
  return String(value)
}

function quantile(sortedValues, fraction) {
  const position = (sortedValues.length - 1) * fraction
  const lowerIndex = Math.floor(position)
  const upperIndex = Math.ceil(position)
  const blend = position - lowerIndex
  return sortedValues[lowerIndex] * (1 - blend) + sortedValues[upperIndex] * blend
}

export function analyzeResults({ question, sql, rows, columnMetadata = [], truncated = false }) {
  if (!rows?.length) {
    return { insight: 'The query returned no rows, so there are no results to summarize.', observations: [] }
  }

  const metadata = new Map(columnMetadata.map((column) => [column.name, column]))
  const columns = Object.keys(rows[0])
  const numericColumns = columns.filter((column) => rows.some((row) => numberValue(row[column]) !== null))
  const dateColumn = columns.find((column) => DATE_TYPES.has(metadata.get(column)?.dataTypeId) || /\b(date|day|month|year|time)\b/i.test(column))
  const categoryColumn = columns.find((column) => column !== dateColumn && !numericColumns.includes(column))
  const observations = []

  if (rows.length === 1 && numericColumns.length === 1) {
    const measure = numericColumns[0]
    const subject = categoryColumn ? ` for ${String(rows[0][categoryColumn])}` : ''
    observations.push(`${measure}${subject}: ${formatValue(rows[0][measure])}.`)
  } else if (numericColumns.length && categoryColumn) {
    const measure = numericColumns[0]
    const ranked = rows
      .map((row) => ({ label: String(row[categoryColumn]), value: numberValue(row[measure]) }))
      .filter((item) => item.value !== null)
    if (ranked.length) {
      const highest = ranked.reduce((best, item) => item.value > best.value ? item : best)
      const lowest = ranked.reduce((best, item) => item.value < best.value ? item : best)
      observations.push(`Among the returned rows, ${highest.label} has the highest ${measure} (${formatValue(highest.value)}).`)
      if (ranked.length > 1 && highest.label !== lowest.label) {
        observations.push(`${lowest.label} has the lowest ${measure} (${formatValue(lowest.value)}).`)
      }
      if (ranked.length >= 4) {
        const sortedValues = ranked.map((item) => item.value).sort((a, b) => a - b)
        const q1 = quantile(sortedValues, 0.25)
        const q3 = quantile(sortedValues, 0.75)
        const spread = q3 - q1
        const outliers = ranked.filter((item) => item.value < q1 - 1.5 * spread || item.value > q3 + 1.5 * spread)
        if (outliers.length) {
          const examples = outliers.slice(0, 3).map((item) => `${item.label} (${formatValue(item.value)})`).join(', ')
          observations.push(`Potential outlier in the returned rows: ${examples} (outside the 1.5×IQR range).`)
        }
      }
    }
  } else if (numericColumns.length) {
    const measure = numericColumns[0]
    const values = rows.map((row) => numberValue(row[measure])).filter((value) => value !== null)
    if (values.length) {
      const total = values.reduce((sum, value) => sum + value, 0)
      observations.push(`${measure} totals ${formatValue(total)} across ${values.length} returned rows.`)
    }
  }

  if (dateColumn && numericColumns.length > 0 && rows.length > 1) {
    const measure = numericColumns[0]
    const dated = rows.map((row) => ({ date: Date.parse(row[dateColumn]), value: numberValue(row[measure]) }))
      .filter((item) => Number.isFinite(item.date) && item.value !== null)
      .sort((a, b) => a.date - b.date)
    if (dated.length > 1 && dated[0].value !== 0) {
      const change = ((dated.at(-1).value - dated[0].value) / Math.abs(dated[0].value)) * 100
      const direction = change > 0 ? 'increased' : change < 0 ? 'decreased' : 'was unchanged'
      observations.push(`${measure} ${direction} by ${Math.abs(change).toFixed(1)}% from the earliest to latest returned date.`)
    }
  }

  if (!observations.length) observations.push(`The query returned ${rows.length} rows. Review the table for details.`)
  if (truncated) observations.push('The result set was capped; these observations describe only the returned rows.')
  // Keep the SQL in the interface to make provenance explicit; never infer causality from result values.
  return { insight: observations.join(' '), observations, question, sql }
}

