const HISTORY_KEY = 'asklytics-query-history'
const DASHBOARD_KEY = 'asklytics-dashboard-pins'
const PREFERENCES_KEY = 'asklytics-ui-preferences'
const PENDING_KEY = 'asklytics-pending-navigation'

const defaultPreferences = { density: 'comfortable', defaultChartType: 'auto' }

function readJson(key, fallback) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || 'null')
    return value ?? fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function loadQueryHistory() {
  const value = readJson(HISTORY_KEY, [])
  return Array.isArray(value)
    ? value.filter((item) => item && typeof item.id === 'string' && typeof item.question === 'string').slice(0, 100)
    : []
}

export function saveQueryHistory(items) {
  return writeJson(HISTORY_KEY, items.slice(0, 100))
}

export function loadDashboardPins() {
  const value = readJson(DASHBOARD_KEY, [])
  return Array.isArray(value)
    ? value.filter((item) => item && typeof item.id === 'string' && typeof item.question === 'string' && Array.isArray(item.columns) && Array.isArray(item.rows)).slice(0, 20)
    : []
}

export function saveDashboardPins(items) {
  return writeJson(DASHBOARD_KEY, items.slice(0, 20))
}

export function loadUiPreferences() {
  const value = readJson(PREFERENCES_KEY, {})
  return {
    density: value?.density === 'compact' ? 'compact' : defaultPreferences.density,
    defaultChartType: ['auto', 'bar', 'line', 'pie'].includes(value?.defaultChartType)
      ? value.defaultChartType
      : defaultPreferences.defaultChartType,
  }
}

export function saveUiPreferences(preferences) {
  return writeJson(PREFERENCES_KEY, {
    density: preferences.density === 'compact' ? 'compact' : 'comfortable',
    defaultChartType: ['auto', 'bar', 'line', 'pie'].includes(preferences.defaultChartType)
      ? preferences.defaultChartType
      : 'auto',
  })
}

export function savePendingNavigation(value) {
  try {
    window.sessionStorage.setItem(PENDING_KEY, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function consumePendingNavigation() {
  try {
    const value = JSON.parse(window.sessionStorage.getItem(PENDING_KEY) || 'null')
    window.sessionStorage.removeItem(PENDING_KEY)
    return value && typeof value === 'object' ? value : null
  } catch {
    return null
  }
}
