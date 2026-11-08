import { lazy, Suspense } from 'react'
import { BarChart3, Code2, Lightbulb, Pin, Table2 } from 'lucide-react'
import DataTable from './ui/DataTable.jsx'
import FollowUpChips from './FollowUpChips.jsx'
import InsightCard from './InsightCard.jsx'
import SqlViewer from './ui/SqlBlock.jsx'
import Tabs from './ui/Tabs.jsx'

const ChartRenderer = lazy(() => import('./ChartRenderer.jsx'))
const resultTabs = [
  { id: 'insight', label: 'Insight', icon: Lightbulb },
  { id: 'chart', label: 'Chart', icon: BarChart3 },
  { id: 'table', label: 'Table', icon: Table2 },
  { id: 'sql', label: 'SQL', icon: Code2 },
]

export default function ResultsPanel({ analysis, activeTab, onTabChange, onFollowUp, onPinResult, isPinned = false, pinError = '' }) {
  const successful = analysis?.status === 'success'
  const clarification = analysis?.status === 'clarification_needed'
  const rejected = analysis?.status === 'rejected'

  return (
    <section className="surface-card flex min-h-[400px] flex-col overflow-hidden sm:min-h-[460px] xl:min-h-[520px]" aria-label="Analysis results">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 md:px-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">Analysis workspace</p>
          <h3 className="mt-1 text-sm font-semibold text-ink">Results</h3>
        </div>
        {successful && <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-line bg-surface-raised px-2.5 py-1 text-[11px] font-medium text-muted">
            {analysis.rows.length} rows | {analysis.executionTime} ms{analysis.truncated ? ' | capped' : ''}
          </span>
          {onPinResult && <button className={`button button-sm inline-flex gap-1.5 ${isPinned ? 'button-primary' : 'button-secondary'}`} onClick={onPinResult} type="button" aria-pressed={isPinned}>
            <Pin size={13} aria-hidden="true" className={isPinned ? 'fill-current' : ''} />{isPinned ? 'Pinned' : 'Pin result'}
          </button>}
        </div>}
      </header>

      {successful ? (
        <>
          {pinError && <p className="mx-4 mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-200 sm:mx-5" role="alert">{pinError}</p>}
          <Tabs
            className="px-3 sm:px-5"
            idPrefix="result"
            items={resultTabs.map(({ id, label, icon }) => ({ value: id, label, icon }))}
            label="Result views"
            onChange={onTabChange}
            value={activeTab}
          />

          {resultTabs.map(({ id }) => <div className="min-h-0 flex-1 p-4 sm:p-5 md:p-6" id={`result-panel-${id}`} key={id} role="tabpanel" aria-labelledby={`result-tab-${id}`} tabIndex={activeTab === id ? 0 : undefined} hidden={activeTab !== id}>
            {activeTab === id && id === 'insight' && <InsightCard insight={analysis.insight} />}
            {activeTab === id && id === 'chart' && (
              <Suspense fallback={<div className="grid min-h-80 place-items-center text-sm text-muted" role="status">Loading chart...</div>}>
                <ChartRenderer visualization={analysis.visualization} />
              </Suspense>
            )}
            {activeTab === id && id === 'table' && <DataTable columns={analysis.columns} rows={analysis.rows} truncated={analysis.truncated} />}
            {activeTab === id && id === 'sql' && <SqlViewer sql={analysis.sql} />}
          </div>)}
          {onFollowUp && <div className="px-4 pb-5 sm:px-5 md:px-6"><FollowUpChips columns={analysis.columns} visualization={analysis.visualization} onSelect={onFollowUp} /></div>}
        </>
      ) : (
        <div className="grid flex-1 place-items-center p-8 text-center">
          <div className="max-w-sm">
            <span className={`mx-auto grid size-12 place-items-center rounded-2xl ${clarification ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' : rejected ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' : 'bg-accent-soft text-accent'}`}><BarChart3 size={21} /></span>
            <h4 className="mt-4 text-sm font-semibold text-ink">{clarification ? 'A quick clarification' : rejected ? 'Let’s try a different question' : 'Your analysis will appear here'}</h4>
            <p className="mt-1.5 text-xs leading-5 text-muted">{clarification ? analysis.explanation : rejected ? 'I couldn’t safely answer that question with the available data. Rephrase it or ask about a specific table, metric, or time period.' : 'Submit a question to see its insight, visualization, result table, and validated SQL in one place.'}</p>
            {clarification && <p className="mt-3 text-[11px] font-medium text-accent">Answer in the conversation to continue.</p>}
          </div>
        </div>
      )}
    </section>
  )
}
