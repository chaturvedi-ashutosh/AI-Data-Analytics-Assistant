import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Moon, Palette, Sun } from 'lucide-react'
import { getHealth } from '../../services/analyticsApi.js'
import { useTheme } from '../../hooks/useTheme.js'
import { IconButton, StatusPill } from '../ui/index.js'

const pageTitles = {
  '/': 'Workspace',
  '/history': 'Query history',
  '/schema': 'Schema explorer',
  '/dashboards': 'Dashboards',
  '/settings': 'Settings',
  '/404': 'Page not found',
}

function serviceState(value, requestFailed) {
  if (value === 'ok' || value === true) return 'online'
  if (value === 'unavailable' || value === 'error' || value === false) return 'offline'
  return requestFailed ? 'offline' : 'checking'
}

function HealthStatus({ health, error }) {
  const api = serviceState(health?.services?.api, Boolean(error))
  const database = serviceState(health?.services?.database, Boolean(error))
  const ollamaValue = health?.services?.ollama
  const ollama = ollamaValue === undefined ? 'not-reported' : serviceState(ollamaValue, false)
  const items = [{ label: 'API', state: api }, { label: 'DB', state: database }, { label: 'Ollama', state: ollama }]

  return (
    <div className="flex items-center gap-2 sm:gap-3" aria-label="Service health" aria-live="polite">
      {items.map(({ label, state }) => <StatusPill className="!min-h-7 !gap-1.5 !border-0 !bg-transparent !px-0 !text-[10px] sm:!text-[11px]" key={label} label={label} status={state} title={`${label}: ${state}`} aria-label={`${label}: ${state}`} />)}
    </div>
  )
}

export default function TopBar() {
  const location = useLocation()
  const { theme, setTheme, resolvedTheme, accent, setAccent } = useTheme()
  const [health, setHealth] = useState(null)
  const [healthError, setHealthError] = useState('')
  const title = pageTitles[location.pathname] || 'Asklytics'

  useEffect(() => {
    let active = true
    async function refreshHealth() {
      try {
        const result = await getHealth()
        if (active) { setHealth(result); setHealthError('') }
      } catch (error) {
        if (active) setHealthError(error.message)
      }
    }
    refreshHealth()
    const timer = window.setInterval(refreshHealth, 30000)
    return () => { active = false; window.clearInterval(timer) }
  }, [])

  const isDark = resolvedTheme === 'dark'

  function toggleTheme() {
    setTheme(isDark ? 'light' : 'dark')
  }

  const ThemeIcon = isDark ? Sun : Moon

  return (
    <header className="topbar sticky top-0 z-30 flex h-[68px] items-center justify-between gap-3 border-b px-4 sm:px-6 lg:px-8">
      <div className="min-w-0">
        <p className="hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle sm:block">Asklytics</p>
        <h1 className="truncate font-display text-base font-semibold tracking-tight text-ink sm:mt-0.5 sm:text-lg">{title}</h1>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <HealthStatus health={health} error={healthError} />
        <span className="hidden h-6 w-px bg-line sm:block" aria-hidden="true" />
        <IconButton onClick={toggleTheme} label={`Switch to ${isDark ? 'light' : 'dark'} theme`} title={`Switch to ${isDark ? 'light' : 'dark'} theme`}>
          <ThemeIcon size={17} aria-hidden="true" />
        </IconButton>
        <IconButton
          type="button"
          className="accent-switch"
          onClick={() => setAccent(accent === 'amethyst' ? 'berry' : 'amethyst')}
          label={`Change accent to ${accent === 'amethyst' ? 'Berry Blush' : 'Indigo / Dark Amethyst'}`}
          title={`Current: ${accent === 'amethyst' ? 'Indigo / Dark Amethyst' : 'Berry Blush'}. Click to change accent.`}
        >
          <Palette size={17} aria-hidden="true" />
        </IconButton>
      </div>
    </header>
  )
}
