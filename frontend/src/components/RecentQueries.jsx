import { Clock3 } from 'lucide-react'

export default function RecentQueries({ items, onSelect }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800"><Clock3 size={15} className="text-slate-400" /> Recent queries</div>
      {!items.length ? <p className="mt-3 text-xs text-slate-400">Your recent questions will appear here.</p> : (
        <ul className="mt-3 space-y-1">{items.map((item, index) => <li key={`${item.question}-${index}`}>
          <button className="w-full rounded-lg px-2.5 py-2 text-left text-xs leading-5 text-slate-600 hover:bg-slate-50 hover:text-indigo-700" onClick={() => onSelect(item.question)} type="button">{item.question}</button>
        </li>)}</ul>
      )}
    </section>
  )
}
