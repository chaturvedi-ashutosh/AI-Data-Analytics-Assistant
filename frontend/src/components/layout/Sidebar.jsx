import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { BarChart3, ChevronLeft, Database, History, LayoutDashboard, Settings2 } from 'lucide-react'

export const navigationItems = [
  { label: 'Workspace', path: '/', icon: LayoutDashboard },
  { label: 'History', path: '/history', icon: History },
  { label: 'Schema', path: '/schema', icon: Database },
  { label: 'Dashboards', path: '/dashboards', icon: BarChart3 },
  { label: 'Settings', path: '/settings', icon: Settings2 },
]

function readCollapsed() {
  try { return window.localStorage.getItem('asklytics-sidebar-collapsed') === 'true' } catch { return false }
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(readCollapsed)

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current
      try { window.localStorage.setItem('asklytics-sidebar-collapsed', String(next)) } catch { /* Keep collapse state for this session. */ }
      return next
    })
  }

  return (
    <aside className={`desktop-sidebar hidden shrink-0 border-r md:sticky md:top-0 md:flex md:h-screen md:flex-col ${collapsed ? 'md:w-[76px]' : 'md:w-[248px]'}`}>
      <div className={`flex h-[76px] items-center ${collapsed ? 'justify-center px-2' : 'justify-between px-5'}`}>
        <Link className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" to="/" aria-label="Asklytics workspace">
          <img className="size-10 shrink-0 object-contain" src="/asklytics-logo.png" alt="" />
          {!collapsed && <span className="min-w-0"><span className="block font-display text-[15px] font-bold tracking-tight text-ink">Asklytics</span><span className="mt-0.5 block text-[10px] text-muted">Analytics workspace</span></span>}
        </Link>
      </div>
      <nav className={`flex-1 space-y-1 px-3 pt-4 ${collapsed ? 'px-2' : ''}`} aria-label="Primary navigation">
        {!collapsed && <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">Workspace</p>}
        {navigationItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            className={({ isActive }) => `nav-item group ${collapsed ? 'justify-center px-0' : ''} ${isActive ? 'nav-item-active' : ''}`}
            end={path === '/'}
            key={path}
            to={path}
            title={collapsed ? label : undefined}
            aria-label={collapsed ? label : undefined}
          >
            <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>
      <div className={`border-t border-line p-3 ${collapsed ? 'px-2' : 'px-4 py-4'}`}>
        <button className={`sidebar-collapse ${collapsed ? 'mx-auto' : ''}`} onClick={toggleCollapsed} type="button" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-pressed={collapsed}>
          <ChevronLeft className={collapsed ? 'rotate-180' : ''} size={17} aria-hidden="true" />
          {!collapsed && <span>Collapse sidebar</span>}
        </button>
      </div>
    </aside>
  )
}
