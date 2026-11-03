import { Boxes, ChevronRight, Database, KeyRound } from 'lucide-react'

export default function SchemaOverview({ tables, loading, error }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Database size={16} className="text-indigo-600" /> Database schema
          </div>
          <p className="mt-1 text-xs text-slate-500">Tables available in the public schema</p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          {tables.length} tables
        </span>
      </div>

      {loading ? (
        <p className="mt-5 text-sm text-slate-400">Loading schema…</p>
      ) : error ? (
        <p className="mt-5 rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-800">{error}</p>
      ) : tables.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center">
          <Boxes className="mx-auto text-slate-300" size={22} />
          <p className="mt-2 text-sm font-medium text-slate-600">No tables found yet</p>
          <p className="mt-1 text-xs text-slate-400">Run the database setup and seed scripts.</p>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {tables.map((table) => (
            <li className="flex items-center justify-between py-3 first:pt-0 last:pb-0" key={table.name}>
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Boxes size={15} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{table.name}</p>
                  <p className="text-xs text-slate-400">{table.columns.length} columns</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span className="hidden items-center gap-1 text-[11px] sm:flex">
                  <KeyRound size={12} /> {table.columns.filter((column) => column.primaryKey).length} key
                </span>
                <ChevronRight size={15} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
