import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import TopBar from './TopBar.jsx'
import MobileTabBar from './MobileTabBar.jsx'

export default function AppShell() {
  return (
    <div className="app-shell min-h-screen md:flex">
      <Sidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="min-w-0 flex-1 pb-24 md:pb-8" id="main-content" tabIndex="-1">
          <Outlet />
        </main>
      </div>
      <MobileTabBar />
    </div>
  )
}
