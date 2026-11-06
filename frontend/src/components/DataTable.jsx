import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

function comparable(value) {
  if (value == null) return ''
  const number = Number(value)
  return String(value).trim() && Number.isFinite(number) ? number : String(value).toLocaleLowerCase()
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

  if (!rows.length) return <div className="grid min-h-36 place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">No rows returned.</div>

  function toggleSort(column) {
    setPage(0)
    setSort((current) => current?.column === column
      ? { column, direction: current.direction === 'asc' ? 'desc' : 'asc' }
      : { column, direction: 'asc' })
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
          <thead className="bg-slate-50 text-slate-500"><tr>{columns.map((column) => (
            <th className="whitespace-nowrap px-4 py-3 font-semibold" key={column}>
              <button className="inline-flex items-center gap-1.5 hover:text-slate-900" onClick={() => toggleSort(column)} type="button">
                {column} {sort?.column === column ? (sort.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} />}
              </button>
            </th>
          ))}</tr></thead>
          <tbody className="divide-y divide-slate-100 bg-white">{visible.map((row, index) => (
            <tr className="hover:bg-slate-50/80" key={`${page}-${index}`}>
              {columns.map((column) => <td className="max-w-72 whitespace-nowrap px-4 py-3 text-slate-700" key={column}>{row[column] == null ? '—' : String(row[column])}</td>)}
            </tr>
          ))}</tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>{rows.length} returned rows{truncated ? ' · result capped at 500 rows' : ''}</span>
        <div className="flex items-center gap-2">
          <button className="rounded-md border border-slate-200 px-2.5 py-1.5 disabled:opacity-40" disabled={page === 0} onClick={() => setPage(page - 1)} type="button">Previous</button>
          <span>Page {page + 1} of {pages}</span>
          <button className="rounded-md border border-slate-200 px-2.5 py-1.5 disabled:opacity-40" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)} type="button">Next</button>
        </div>
      </div>
    </div>
  )
}
