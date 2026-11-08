import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Download } from 'lucide-react'

const numberFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })
const percentageFormat = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function comparable(value) {
  if (value == null) return ''
  const number = Number(value)
  return String(value).trim() && Number.isFinite(number) ? number : String(value).toLocaleLowerCase()
}

function displayValue(value, column) {
  if (value == null) return 'N/A'
  const text = String(value)
  if (/^(id|.*_id|.*_key)$/i.test(column) || !text.trim()) return text
  const number = Number(text)
  if (!Number.isFinite(number)) return text
  if (/percent|pct|share|proportion/i.test(column)) return `${percentageFormat.format(number)}%`
  return numberFormat.format(number)
}

function csvCell(value) {
  const text = value == null ? '' : String(value)
  return `"${text.replaceAll('"', '""')}"`
}

export default function DataTable({ columns = [], rows = [], truncated = false }) {
  const [sort, setSort] = useState(null)
  const [page, setPage] = useState(0)
  const pageSize = 10
  useEffect(() => setPage(0), [rows])
  const sorted = useMemo(() => {
    if (!sort) return rows
    return [...rows].sort((a, b) => {
      const left = comparable(a[sort.column]); const right = comparable(b[sort.column])
      const order = left < right ? -1 : left > right ? 1 : 0
      return sort.direction === 'asc' ? order : -order
    })
  }, [rows, sort])
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const visible = sorted.slice(page * pageSize, (page + 1) * pageSize)

  if (!rows.length) return <div className="grid min-h-36 place-items-center rounded-2xl border border-dashed border-line bg-surface-raised text-sm text-muted">No rows returned.</div>

  function toggleSort(column) {
    setPage(0)
    setSort((current) => current?.column === column
      ? { column, direction: current.direction === 'asc' ? 'desc' : 'asc' }
      : { column, direction: 'asc' })
  }

  function downloadCsv() {
    const csv = [columns, ...rows.map((row) => columns.map((column) => row[column]))]
      .map((line) => line.map(csvCell).join(','))
      .join('\r\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'asklytics-results.csv'
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div>
      {truncated && <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs leading-5 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-200" role="status">This query returned more rows than the display limit. The table and CSV include the first 500 rows only.</p>}
      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="min-w-full divide-y divide-line text-left text-xs">
          <thead className="sticky top-0 bg-surface-raised/95 text-muted backdrop-blur"><tr>{columns.map((column) => (
            <th className="whitespace-nowrap px-4 py-3.5 font-semibold uppercase tracking-wide" key={column} aria-sort={sort?.column === column ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
              <button className="inline-flex min-h-8 items-center gap-1.5 transition hover:text-accent" onClick={() => toggleSort(column)} type="button" aria-label={`Sort by ${column}${sort?.column === column && sort.direction === 'asc' ? ' descending' : ' ascending'}`}>
                {column} {sort?.column === column ? (sort.direction === 'asc' ? <ArrowUp size={12} aria-hidden="true" /> : <ArrowDown size={12} aria-hidden="true" />) : <ArrowUpDown size={12} aria-hidden="true" />}
              </button>
            </th>
          ))}</tr></thead>
          <tbody className="divide-y divide-line">{visible.map((row, index) => (
            <tr className="transition-colors odd:bg-surface even:bg-surface-raised/50 hover:bg-accent-soft" key={`${page}-${index}`}>
              {columns.map((column) => <td className={`max-w-72 whitespace-nowrap px-4 py-3 text-ink ${typeof row[column] === 'number' || /^-?\d+(\.\d+)?$/.test(String(row[column] ?? '')) ? 'tabular-nums' : ''}`} key={column}>{displayValue(row[column], column)}</td>)}
            </tr>
          ))}</tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>{rows.length} returned rows</span>
        <div className="flex items-center gap-2">
          <button className="button button-secondary button-sm inline-flex gap-1.5" onClick={downloadCsv} type="button"><Download size={13} /> Export CSV</button>
          <button className="button button-secondary button-sm" disabled={page === 0} onClick={() => setPage(page - 1)} type="button">Previous</button>
          <span>Page {page + 1} of {pages}</span>
          <button className="button button-secondary button-sm" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)} type="button">Next</button>
        </div>
      </div>
    </div>
  )
}
