import { useState } from 'react'
import { BarChart3, Clock3, Pin, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import ChartCard from '../components/ui/ChartCard.jsx'
import DataTable from '../components/ui/DataTable.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import InsightCard from '../components/InsightCard.jsx'
import SqlBlock from '../components/ui/SqlBlock.jsx'
import PageFrame from '../components/layout/PageFrame.jsx'
import { Button, Card, IconButton } from '../components/ui/index.js'
import { loadDashboardPins, saveDashboardPins } from '../lib/storage.js'

function formatPinnedDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString([], { dateStyle: 'medium' })
}

export default function DashboardPage() {
  const [items, setItems] = useState(loadDashboardPins)
  const [error, setError] = useState('')

  function removePin(id) {
    const next = items.filter((item) => item.id !== id)
    if (!saveDashboardPins(next)) {
      setError('Could not update your dashboard in this browser.')
      return
    }
    setItems(next)
    setError('')
  }

  function clearPins() {
    if (!window.confirm('Remove all saved results from this dashboard?')) return
    removeAllPins()
  }

  function removeAllPins() {
    if (!saveDashboardPins([])) {
      setError('Could not update your dashboard in this browser.')
      return
    }
    setItems([])
    setError('')
  }

  return (
    <PageFrame title="Dashboards" description="A personal board of charts and results you have pinned from Workspace.">
      {error && <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-200" role="alert">{error}</p>}
      {items.length ? (
        <>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted"><span className="font-semibold text-ink">{items.length}</span> pinned {items.length === 1 ? 'result' : 'results'} · Saved in this browser</p>
            <Button variant="ghost" size="sm" onClick={clearPins}><Trash2 size={13} aria-hidden="true" />Clear board</Button>
          </div>
          <div className="grid items-start gap-5 xl:grid-cols-2">
            {items.map((item) => (
              <article className="surface-card min-w-0 overflow-hidden" key={item.id}>
                <header className="flex items-start justify-between gap-3 border-b border-line p-4 sm:p-5">
                  <div className="min-w-0">
                    <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent"><Pin size={11} className="fill-current" aria-hidden="true" />Pinned result</p>
                    <h2 className="break-words text-sm font-semibold leading-6 text-ink">{item.question}</h2>
                    {item.pinnedAt && <p className="mt-1 flex items-center gap-1.5 text-[10px] text-subtle"><Clock3 size={11} aria-hidden="true" />Saved {formatPinnedDate(item.pinnedAt)}</p>}
                  </div>
                  <IconButton label={`Remove pinned result: ${item.question}`} title="Remove from dashboard" onClick={() => removePin(item.id)}><Trash2 size={15} aria-hidden="true" /></IconButton>
                </header>
                <div className="space-y-4 p-4 sm:p-5">
                  {item.visualization?.type !== 'table' && item.visualization
                    ? <ChartCard title={item.visualization.title || 'Saved visualization'} visualization={item.visualization} />
                    : <Card className="p-4"><p className="text-xs font-semibold text-ink">Result preview</p><p className="mt-1 text-xs text-muted">This question is best shown as a table.</p></Card>}
                  {item.insight && <InsightCard insight={item.insight} />}
                  {item.truncated && <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-200" role="status">The saved result was capped at the first 500 rows.</p>}
                  <details className="group rounded-xl border border-line bg-surface">
                    <summary className="cursor-pointer px-4 py-3 text-xs font-semibold text-ink focus-visible:outline-offset-[-2px]">View saved rows and SQL</summary>
                    <div className="space-y-4 border-t border-line p-3 sm:p-4">
                      <DataTable columns={item.columns || []} rows={item.rows || []} truncated={item.truncated} />
                      {item.sql && <SqlBlock sql={item.sql} />}
                    </div>
                  </details>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <Card className="grid min-h-72 place-items-center p-8"><EmptyState icon={BarChart3} title="Your board is empty" description="Pin a successful chart or result from Workspace to keep a local snapshot here." action={<Link className="button button-secondary" to="/"><Pin size={15} aria-hidden="true" />Explore an analysis</Link>} /></Card>
      )}
    </PageFrame>
  )
}
