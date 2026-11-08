import { NavLink } from 'react-router-dom'
import { navigationItems } from './Sidebar.jsx'

export default function MobileTabBar() {
  return (
    <nav className="mobile-tabbar fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t px-1 pb-[max(env(safe-area-inset-bottom),0.35rem)] pt-2 md:hidden" aria-label="Mobile navigation">
      {navigationItems.map(({ label, path, icon: Icon }) => (
        <NavLink className={({ isActive }) => `mobile-tab ${isActive ? 'mobile-tab-active' : ''}`} end={path === '/'} key={path} to={path}>
          <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
