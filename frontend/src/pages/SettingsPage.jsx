import { useEffect, useState } from 'react'
import { Keyboard, Monitor, Moon, Palette, Sun } from 'lucide-react'
import PageFrame from '../components/layout/PageFrame.jsx'
import { useTheme } from '../hooks/useTheme.js'
import { Button, Card } from '../components/ui/index.js'
import { loadUiPreferences, saveUiPreferences } from '../lib/storage.js'

const themeOptions = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

export default function SettingsPage() {
  const { theme, setTheme, accent, setAccent } = useTheme()
  const [preferences, setPreferences] = useState(loadUiPreferences)
  const [storageMessage, setStorageMessage] = useState('')

  useEffect(() => {
    document.documentElement.dataset.density = preferences.density
    if (!saveUiPreferences(preferences)) setStorageMessage('Preferences are active for this session but could not be saved in this browser.')
    else setStorageMessage('')
  }, [preferences])

  function updatePreference(key, value) {
    setPreferences((current) => ({ ...current, [key]: value }))
  }

  return (
    <PageFrame title="Settings" description="Choose how Asklytics looks on this device.">
      <div className="max-w-3xl space-y-5">
        {storageMessage && <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-200" role="status">{storageMessage}</p>}
        <Card className="p-5 sm:p-6" aria-labelledby="appearance-title">
          <div className="flex items-center gap-3">
            <span className="empty-icon !m-0"><Palette size={18} aria-hidden="true" /></span>
            <div><h3 className="font-display text-base font-semibold text-ink" id="appearance-title">Appearance</h3><p className="mt-1 text-xs text-muted">Theme and accent preferences are saved in this browser.</p></div>
          </div>
          <fieldset className="mt-6">
            <legend className="mb-2.5 text-xs font-semibold text-ink">Theme</legend>
            <div className="grid grid-cols-3 gap-2" role="group" aria-label="Color theme">
              {themeOptions.map(({ value, label, icon: Icon }) => (
                <button className={`preference-option ${theme === value ? 'preference-option-active' : ''}`} key={value} onClick={() => setTheme(value)} type="button" aria-pressed={theme === value}>
                  <Icon size={16} aria-hidden="true" /><span>{label}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="mt-6">
            <legend className="mb-2.5 text-xs font-semibold text-ink">Accent</legend>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Accent color">
              <button className={`accent-option ${accent === 'amethyst' ? 'accent-option-active' : ''}`} onClick={() => setAccent('amethyst')} type="button" aria-pressed={accent === 'amethyst'}>
                <span className="size-4 rounded-full bg-[#5f0a87]" aria-hidden="true" /> Indigo / Dark Amethyst
              </button>
              <button className={`accent-option ${accent === 'berry' ? 'accent-option-active' : ''}`} onClick={() => setAccent('berry')} type="button" aria-pressed={accent === 'berry'}>
                <span className="size-4 rounded-full bg-[#a4508b]" aria-hidden="true" /> Berry Blush
              </button>
            </div>
          </fieldset>
          <fieldset className="mt-6">
            <legend className="mb-2.5 text-xs font-semibold text-ink">Density</legend>
            <p className="mb-2.5 text-xs text-muted">Compact mode reduces spacing across the interface.</p>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Interface density">
              {[
                { value: 'comfortable', label: 'Comfortable' },
                { value: 'compact', label: 'Compact' },
              ].map(({ value, label }) => <Button key={value} variant={preferences.density === value ? 'primary' : 'secondary'} aria-pressed={preferences.density === value} onClick={() => updatePreference('density', value)}>{label}</Button>)}
            </div>
          </fieldset>
          <fieldset className="mt-6">
            <label className="field-label" htmlFor="default-chart-type">Default chart type</label>
            <p className="mb-2.5 mt-1 text-xs text-muted">Used when a saved visualization can support that chart.</p>
            <select className="field-control max-w-sm" id="default-chart-type" onChange={(event) => updatePreference('defaultChartType', event.target.value)} value={preferences.defaultChartType}>
              <option value="auto">Automatic (recommended)</option>
              <option value="bar">Bar</option>
              <option value="line">Line</option>
              <option value="pie">Donut</option>
            </select>
          </fieldset>
        </Card>
        <Card className="p-5 sm:p-6" aria-labelledby="shortcuts-title">
          <div className="flex items-center gap-3">
            <span className="empty-icon !m-0"><Keyboard size={18} aria-hidden="true" /></span>
            <div><h3 className="font-display text-base font-semibold text-ink" id="shortcuts-title">Keyboard shortcuts</h3><p className="mt-1 text-xs text-muted">Available while the Workspace is open.</p></div>
          </div>
          <dl className="mt-5 divide-y divide-line text-xs">
            {[
              ['Enter', 'Send a question'],
              ['Shift + Enter', 'Add a new line'],
              ['/', 'Focus the question composer'],
              ['Esc', 'Cancel the current request'],
              ['Ctrl / Cmd + K', 'Start a new chat'],
            ].map(([shortcut, description]) => <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0" key={shortcut}>
              <dt className="text-muted">{description}</dt><dd><kbd className="rounded-md border border-line bg-surface-raised px-2 py-1 font-mono text-[10px] text-ink">{shortcut}</kbd></dd>
            </div>)}
          </dl>
        </Card>
      </div>
    </PageFrame>
  )
}
