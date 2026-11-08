import { ArrowUpRight, Sparkles } from 'lucide-react'

function makeSuggestions({ columns = [], visualization }) {
  const xAxis = visualization?.xAxis
  const measure = visualization?.yAxis
  const suggestions = []
  const isTimeSeries = visualization?.type === 'line' || /date|day|month|year|time/i.test(xAxis || '')
  const breakdown = columns.find((column) => column !== xAxis && column !== measure &&
    !/^(id|.*_id|.*_key)$/i.test(column) &&
    !/(percent|pct|share|proportion|revenue|sales|amount|total|count|quantity|value|date|day|month|year|time)/i.test(column))

  if (isTimeSeries) suggestions.push(`Compare this ${measure || 'trend'} with the previous year`)
  if (breakdown && measure) suggestions.push(`Compare ${measure} by ${breakdown}`)
  if (!isTimeSeries && xAxis && measure) suggestions.push(`Show the top ${xAxis} by ${measure}`)
  return [...new Set(suggestions)].slice(0, 3)
}

export default function FollowUpChips({ columns, visualization, onSelect }) {
  const suggestions = makeSuggestions({ columns, visualization })
  if (!suggestions.length) return null

  return (
    <section className="mt-5 border-t border-line pt-4" aria-label="Suggested follow-up questions">
      <p className="mb-2.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-subtle"><Sparkles size={12} className="text-accent" /> Suggested follow-up</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-accent-line bg-accent-soft px-3 py-2 text-left text-[11px] font-medium leading-4 text-accent transition hover:border-accent hover:bg-surface" key={suggestion} onClick={() => onSelect(suggestion)} type="button">
            <span>{suggestion}</span><ArrowUpRight className="shrink-0" size={12} />
          </button>
        ))}
      </div>
    </section>
  )
}
