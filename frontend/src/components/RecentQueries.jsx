import { useMemo, useState } from 'react'
import { Clock3, Pin, Play, Search, Trash2 } from 'lucide-react'

export default function RecentQueries({ items, onRun, onTogglePin, onClear }) {
  const [search, setSearch] = useState('')
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    return query ? items.filter((item) => item.question.toLocaleLowerCase().includes(query)) : items
  }, [items, search])

  return (
    <section className="surface-card p-5" id="activity" aria-label="Query history">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink"><span className="grid size-8 place-items-center rounded-lg bg-surface-raised text-muted"><Clock3 size={15} /></span> Query history</div>
        <button className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium text-subtle transition hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-rose-950/40 dark:hover:text-rose-300" onClick={onClear} disabled={!items.length} type="button" aria-label="Clear query history"><Trash2 size={13} /> Clear</button>
      </div>
      <label className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-surface-raised px-3">
        <Search size={14} className="shrink-0 text-subtle" aria-hidden="true" />
        <span className="sr-only">Search query history</span>
        <input className="min-w-0 flex-1 border-0 bg-transparent py-2 text-xs text-ink outline-none placeholder:text-subtle focus:ring-0" onChange={(event) => setSearch(event.target.value)} placeholder="Search questions" value={search} type="search" />
      </label>
      {!items.length ? (
        <p className="mt-3 text-xs text-subtle">Your questions will be saved here on this device.</p>
      ) : filtered.length ? (
        <ul className="mt-3 max-h-80 space-y-1 overflow-y-auto overscroll-contain">
          {filtered.map((item) => (
            <li className="group flex items-start gap-1 rounded-xl px-1 py-1 transition hover:bg-surface-raised" key={item.id}>
              <button className="min-w-0 flex-1 px-2 py-2 text-left text-xs leading-5 text-muted transition hover:text-accent" onClick={() => onRun(item.question)} type="button" aria-label={`Run saved question: ${item.question}`}>
                <span className="block">{item.question}</span>
                <span className="mt-0.5 block text-[10px] text-subtle">{item.pinned ? 'Pinned' : 'Recent'}{item.createdAt ? ` · ${new Date(item.createdAt).toLocaleDateString()}` : ''}</span>
              </button>
              <button className="mt-1 grid size-8 shrink-0 place-items-center rounded-lg text-subtle transition hover:bg-accent-soft hover:text-accent" onClick={() => onTogglePin(item.id)} type="button" aria-label={item.pinned ? `Unpin question: ${item.question}` : `Pin question: ${item.question}`} aria-pressed={item.pinned} title={item.pinned ? 'Unpin question' : 'Pin question'}><Pin size={14} className={item.pinned ? 'fill-current text-accent' : ''} /></button>
              <button className="mt-1 grid size-8 shrink-0 place-items-center rounded-lg text-subtle transition hover:bg-accent-soft hover:text-accent" onClick={() => onRun(item.question)} type="button" aria-label={`Run question: ${item.question}`} title="Run question"><Play size={13} /></button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 rounded-lg bg-surface-raised px-3 py-2.5 text-xs text-muted" role="status">No saved questions match “{search}”.</p>
      )}
    </section>
  )
}
