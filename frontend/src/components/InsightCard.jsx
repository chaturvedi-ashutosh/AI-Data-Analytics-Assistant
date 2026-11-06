import { Lightbulb } from 'lucide-react'

export default function InsightCard({ insight }) {
  if (!insight) return null
  return (
    <section className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5" aria-label="Analysis insight">
      <div className="flex items-center gap-2 text-sm font-semibold text-indigo-950"><Lightbulb size={17} className="text-indigo-600" /> Insight</div>
      <p className="mt-3 text-sm leading-6 text-slate-700">{insight}</p>
    </section>
  )
}
