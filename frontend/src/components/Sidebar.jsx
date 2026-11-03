import {
  Activity,
  Database,
  LayoutDashboard,
  MessageSquareText,
  Settings2,
} from 'lucide-react'

const navigation = [
  { label: 'Overview', icon: LayoutDashboard, active: true },
  { label: 'Ask data', icon: MessageSquareText },
  { label: 'Data sources', icon: Database },
  { label: 'Activity', icon: Activity },
]

export default function Sidebar({ databaseStatus }) {
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-slate-200 bg-white px-5 py-5 md:min-h-screen md:w-64 md:border-b-0 md:border-r md:px-4">
      <a className="flex items-center gap-3 px-2" href="#overview" aria-label="Analytics home">
        <span className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
          <Activity size={20} strokeWidth={2.4} />
        </span>
        <span>
          <span className="block text-sm font-bold tracking-tight text-slate-900">Northstar</span>
          <span className="block text-xs text-slate-500">Analytics assistant</span>
        </span>
      </a>

      <div className="mt-9 hidden px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 md:block">
        Workspace
      </div>
      <nav className="mt-5 flex gap-2 overflow-x-auto md:flex-col" aria-label="Main navigation">
        {navigation.map(({ label, icon: Icon, active }) => (
          <a
            className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              active
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
            href={active ? '#overview' : '#question'}
            key={label}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={17} />
            {label}
          </a>
        ))}
      </nav>

      <div className="mt-auto hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 md:block">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <span className={`size-2 rounded-full ${databaseStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
          Database {databaseStatus === 'connected' ? 'connected' : 'not connected'}
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Your workspace is ready to explore once a database is connected.
        </p>
        <button className="mt-3 flex items-center gap-2 text-xs font-semibold text-indigo-700" type="button">
          <Settings2 size={14} /> Connection settings
        </button>
      </div>
    </aside>
  )
}
