import { createContext, createElement, useCallback, useContext, useLayoutEffect, useMemo, useState } from 'react'

const THEME_KEY = 'asklytics-theme'
const ACCENT_KEY = 'asklytics-accent'
const ThemeContext = createContext(null)

function readPreference(key, allowed, fallback) {
  try {
    const value = window.localStorage.getItem(key)
    return allowed.includes(value) ? value : fallback
  } catch {
    return fallback
  }
}

function resolveTheme(theme) {
  return theme === 'dark' || (theme === 'system' && (window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false))
    ? 'dark'
    : 'light'
}

function applyAppearance(theme, accent) {
  const dark = resolveTheme(theme) === 'dark'
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.dataset.theme = theme
  document.documentElement.dataset.accent = accent
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => readPreference(THEME_KEY, ['light', 'dark', 'system'], 'system'))
  const [accent, setAccentValue] = useState(() => readPreference(ACCENT_KEY, ['amethyst', 'berry'], 'amethyst'))
  const [resolvedTheme, setResolvedTheme] = useState(() => resolveTheme(theme))

  const setAccent = useCallback((nextAccent) => {
    const value = typeof nextAccent === 'function' ? nextAccent(accent) : nextAccent
    if (!['amethyst', 'berry'].includes(value)) return
    document.documentElement.dataset.accent = value
    try { window.localStorage.setItem(ACCENT_KEY, value) } catch { /* The selection still applies for this session. */ }
    setAccentValue(value)
  }, [accent])

  useLayoutEffect(() => {
    applyAppearance(theme, accent)
    setResolvedTheme(resolveTheme(theme))
    try {
      window.localStorage.setItem(THEME_KEY, theme)
      window.localStorage.setItem(ACCENT_KEY, accent)
    } catch {
      // The current session still uses the selected appearance if storage is unavailable.
    }
    if (theme !== 'system') return undefined
    const preference = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!preference) return undefined
    const update = () => {
      applyAppearance('system', accent)
      setResolvedTheme(resolveTheme('system'))
    }
    preference.addEventListener?.('change', update)
    return () => preference.removeEventListener?.('change', update)
  }, [theme, accent])

  const value = useMemo(() => ({ theme, setTheme, resolvedTheme, accent, setAccent }), [theme, resolvedTheme, accent])
  return createElement(ThemeContext.Provider, { value }, children)
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside ThemeProvider')
  return context
}
