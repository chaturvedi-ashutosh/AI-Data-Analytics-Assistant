import { useState } from 'react'
import { Boxes, ChevronDown, Database, KeyRound } from 'lucide-react'

export default function SchemaOverview({ tables, loading, error, onInsert = () => {} }) {
  const [expandedTables, setExpandedTables] = useState(() => new Set())

  function toggleTable(name) {
    setExpandedTables((current) => {
      const next = new Set(current)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  return (
    <section className="surface-card p-5" id="data-sources">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-ink"><span className="grid size-8 place-items-center rounded-lg bg-accent-soft text-accent"><Database size={16} /></span> Database schema</div>
          <p className="mt-2 text-xs text-muted">Select a table or column to add it to your question</p>
        </div>
        <span className="rounded-full bg-surface-raised px-2.5 py-1 text-xs font-medium text-muted">{tables.length} tables</span>
      </div>

      {loading ? (
        <p className="mt-5 text-sm text-muted">Loading schema...</p>
      ) : error ? (
        <p className="mt-5 rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">{error}</p>
      ) : tables.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-line px-4 py-6 text-center">
          <Boxes className="mx-auto text-subtle" size={22} />
          <p className="mt-2 text-sm font-medium text-ink">No tables found yet</p>
          <p className="mt-1 text-xs text-muted">Run the database setup and seed scripts.</p>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {tables.map((table) => {
            const expanded = expandedTables.has(table.name)
            return (
              <li className="py-2 first:pt-0 last:pb-0" key={table.name}>
                <div className="flex items-center gap-1">
                  <button className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-1.5 py-2 text-left transition hover:bg-accent-soft" onClick={() => onInsert(table.name)} type="button" aria-label={`Insert table ${table.name} into question`}>
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent"><Boxes size={15} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{table.name}</span>
                      <span className="block text-xs text-muted">{table.columns.length} columns</span>
                    </span>
                    <span className="hidden items-center gap-1 text-[11px] text-subtle sm:flex"><KeyRound size={12} /> {table.columns.filter((column) => column.primaryKey).length}</span>
                  </button>
                  <button className="grid size-9 shrink-0 place-items-center rounded-lg text-subtle transition hover:bg-surface-raised hover:text-ink" onClick={() => toggleTable(table.name)} type="button" aria-label={`${expanded ? 'Hide' : 'Show'} ${table.name} columns`} aria-expanded={expanded}>
                    <ChevronDown className={`transition-transform ${expanded ? 'rotate-180' : ''}`} size={15} />
                  </button>
                </div>
                {expanded && (
                  <ul className="ml-5 mt-1 space-y-0.5 border-l border-line pl-3">
                    {table.columns.map((column) => (
                      <li key={column.name}>
                        <button className="flex w-full min-w-0 items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-accent-soft" onClick={() => onInsert(`${table.name}.${column.name}`)} type="button" aria-label={`Insert column ${table.name}.${column.name} into question`}>
                          <span className="truncate font-mono text-[11px] text-ink">{column.name}</span>
                          <span className="shrink-0 text-[10px] text-subtle">{column.dataType || column.nativeType || 'column'}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
