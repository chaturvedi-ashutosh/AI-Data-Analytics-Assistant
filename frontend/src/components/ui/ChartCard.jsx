import { lazy, Suspense } from 'react'
import { BarChart3 } from 'lucide-react'
import EmptyState from './EmptyState.jsx'

const ChartRenderer = lazy(() => import('../ChartRenderer.jsx'))

export default function ChartCard({ title = 'Visualization', description, visualization, className = '' }) {
  if (!visualization || visualization.type === 'table') {
    return <section className={`surface-card p-5 ${className}`.trim()}><EmptyState icon={BarChart3} title="No chart available" description="This result is best explored as a table." /></section>
  }
  return <section className={`surface-card min-w-0 p-4 sm:p-5 ${className}`.trim()}>
    <header className="mb-4"><h3 className="font-display text-sm font-semibold text-ink">{title}</h3>{description && <p className="mt-1 text-xs text-muted">{description}</p>}</header>
    <Suspense fallback={<div className="grid min-h-64 place-items-center text-sm text-muted" role="status">Loading chart…</div>}><ChartRenderer visualization={visualization} /></Suspense>
  </section>
}
