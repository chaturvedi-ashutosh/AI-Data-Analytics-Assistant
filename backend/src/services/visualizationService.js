function numericValue(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value)
  return null
}

export function buildVisualization({ question, rows, columns, columnMetadata = [] }) {
  const data = rows || []
  const names = columns?.length ? columns : (data[0] ? Object.keys(data[0]) : [])
  if (!data.length || !names.length) {
    return { type: 'table', title: 'Query results', xAxis: null, yAxis: null, data }
  }

  const meta = new Map(columnMetadata.map((column) => [column.name, column]))
  const numericColumns = names.filter((name) => data.some((row) => numericValue(row[name]) !== null))
  const metricColumns = numericColumns.filter((name) => !/^(id|.*_id|.*_key)$/i.test(name))
  const dateColumn = names.find((name) => [1082, 1114, 1184].includes(meta.get(name)?.dataTypeId) || /\b(date|day|month|year|time)\b/i.test(name))
  const category = names.find((name) => name !== dateColumn && !numericColumns.includes(name))
  const detailQuestion = /\b(details?|records?|list|all rows)\b/i.test(question || '')
  const percentageQuestion = /\b(share|composition|proportion|percentage of total)\b/i.test(question || '')
  const yAxis = (percentageQuestion
    ? metricColumns.find((name) => /percent|pct|share|proportion/i.test(name))
    : null) || metricColumns.find((name) => /revenue|sales|amount|total|count|quantity|value/i.test(name)) || metricColumns[0]

  if (data.length === 1 && yAxis) {
    return {
      type: 'kpi',
      title: question || yAxis,
      label: category ? String(data[0][category]) : yAxis,
      xAxis: category || null,
      yAxis,
      value: numericValue(data[0][yAxis]),
      data,
    }
  }
  if (detailQuestion || !yAxis || !category && !dateColumn) {
    return { type: 'table', title: 'Query results', xAxis: null, yAxis: null, data }
  }

  const xAxis = dateColumn || category
  const chartData = data.map((row) => ({
    [xAxis]: row[xAxis],
    [yAxis]: numericValue(row[yAxis]),
  })).filter((row) => row[yAxis] !== null)
  if (!chartData.length) return { type: 'table', title: 'Query results', xAxis: null, yAxis: null, data }

  if (dateColumn) {
    chartData.sort((a, b) => Date.parse(a[xAxis]) - Date.parse(b[xAxis]))
    return { type: 'line', title: question || `${yAxis} over time`, xAxis, yAxis, data: chartData }
  }
  if (percentageQuestion && chartData.length <= 8) {
    return { type: 'pie', title: question || `Composition by ${category}`, xAxis: category, yAxis, data: chartData }
  }
  return { type: 'bar', title: question || `${yAxis} by ${category}`, xAxis: category, yAxis, data: chartData }
}

