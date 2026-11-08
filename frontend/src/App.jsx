import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/layout/AppShell.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import SchemaPage from './pages/SchemaPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import WorkspacePage from './pages/WorkspacePage.jsx'
import { ThemeProvider } from './hooks/useTheme.js'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<WorkspacePage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="schema" element={<SchemaPage />} />
            <Route path="dashboards" element={<DashboardPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate replace to="/404" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
