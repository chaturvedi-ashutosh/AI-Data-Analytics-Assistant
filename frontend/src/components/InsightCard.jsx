import { Lightbulb } from 'lucide-react'

export default function InsightCard({ insight }) {
  if (!insight) return null
  return (
    <section className="surface-card relative overflow-hidden bg-gradient-to-br from-accent-soft via-surface to-surface p-5" aria-label="Analysis insight">
      <div className="flex items-center gap-2 text-sm font-semibold text-ink"><span className="grid size-8 place-items-center rounded-lg bg-accent-soft text-accent"><Lightbulb size={16} /></span> Key insight</div>
      <p className="mt-3 text-sm leading-6 text-muted">{insight}</p>
    </section>
  )
}
