import { lazy, Suspense, useEffect, useState } from 'react'
import { Activity, ArrowRight, Database, Layers3, MessageSquareText } from 'lucide-react'
import { analyzeQuestion, getHealth, getSchema } from './services/analyticsApi.js'
import ChatInput from './components/ChatInput.jsx'
import ChatMessage from './components/ChatMessage.jsx'
import DataTable from './components/DataTable.jsx'
import ErrorMessage from './components/ErrorMessage.jsx'
import InsightCard from './components/InsightCard.jsx'
import LoadingIndicator from './components/LoadingIndicator.jsx'
import RecentQueries from './components/RecentQueries.jsx'
import SchemaOverview from './components/SchemaOverview.jsx'
import Sidebar from './components/Sidebar.jsx'
import SqlViewer from './components/SqlViewer.jsx'

const ChartRenderer = lazy(() => import('./components/ChartRenderer.jsx'))

function MetricCard({ icon: Icon, label, value, caption }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="grid size-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><Icon size={17} /></span>
      <p className="mt-3 text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{caption}</p>
    </article>
  )
}

export default function App() {
  const [health, setHealth] = useState(null)
  const [healthError, setHealthError] = useState('')
  const [tables, setTables] = useState([])
  const [schemaLoading, setSchemaLoading] = useState(true)
  const [schemaError, setSchemaError] = useState('')
  const [question, setQuestion] = useState('')
  const [conversationId] = useState(() => window.crypto.randomUUID())
  const [messages, setMessages] = useState([])
  const [analysis, setAnalysis] = useState(null)
  const [analysisError, setAnalysisError] = useState('')
  const [loading, setLoading] = useState(false)
  const [recentQueries, setRecentQueries] = useState([])
  const [resultView, setResultView] = useState('chart')

  useEffect(() => {
    let active = true
    getHealth().then((data) => active && setHealth(data)).catch((error) => active && setHealthError(error.message))
    getSchema().then((data) => active && setTables(data.tables)).catch((error) => active && setSchemaError(error.message)).finally(() => active && setSchemaLoading(false))
    return () => { active = false }
  }, [])

  async function submitQuestion(event, overrideQuestion = '') {
    event?.preventDefault()
    const currentQuestion = (overrideQuestion || question).trim()
    if (!currentQuestion || loading) return

    setMessages((items) => [...items, { role: 'user', text: currentQuestion, time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) }])
    setQuestion('')
    setAnalysis(null)
    setAnalysisError('')
    setLoading(true)
    try {
      const result = await analyzeQuestion(currentQuestion, conversationId)
      setAnalysis(result)
      setMessages((items) => [...items, {
        role: 'assistant',
        text: result.status === 'clarification_needed' ? result.explanation : result.insight,
        time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      }])
      setRecentQueries((items) => [{ question: currentQuestion }, ...items.filter((item) => item.question !== currentQuestion)].slice(0, 6))
      setResultView(result.visualization?.type === 'table' ? 'table' : 'chart')
    } catch (error) {
      setAnalysisError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const databaseConnected = health?.services?.database === 'ok'
  const formattedDate = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date())

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900 md:flex">
      <Sidebar databaseStatus={databaseConnected ? 'connected' : 'pending'} />
      <main className="min-w-0 flex-1" id="overview">
        <header className="flex items-center justify-between border-b border-slate-200/80 bg-white/85 px-5 py-4 backdrop-blur md:px-9">
          <div><p className="text-xs font-medium text-slate-400">Workspace / Analytics</p><h1 className="mt-1 text-lg font-semibold tracking-tight">Analytics assistant</h1></div>
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${health && !healthError ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>
            <span className={`size-1.5 rounded-full ${health && !healthError ? 'bg-emerald-500' : 'bg-amber-500'}`} />{health && !healthError ? 'API connected' : 'Connection pending'}
          </span>
        </header>

        <div className="mx-auto max-w-7xl space-y-6 px-5 py-7 md:px-9 md:py-9">
          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><p className="text-sm font-medium text-indigo-600">{formattedDate}</p><h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Ask a question. Explore the answer.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Generate a safe query, inspect its results, and ask follow-up questions in the same conversation.</p></div>
            <span className="flex items-center gap-2 text-xs text-slate-400"><Activity size={14} /> Read-only analytics</span>
          </section>

          {(healthError || schemaError) && <ErrorMessage message={healthError || schemaError} />}

          <section className="grid gap-4 sm:grid-cols-3" aria-label="Workspace summary">
            <MetricCard label="Database" value={databaseConnected ? 'Connected' : 'Pending'} caption="Restricted PostgreSQL role" icon={Database} />
            <MetricCard label="Analytics tables" value={schemaLoading ? '…' : String(tables.length)} caption="Approved schema objects" icon={Layers3} />
            <MetricCard label="Questions asked" value={String(messages.filter((message) => message.role === 'user').length)} caption="In this conversation" icon={MessageSquareText} />
          </section>

          <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(290px,0.8fr)]">
            <div className="space-y-5">
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" id="question">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h3 className="text-sm font-semibold text-slate-900">Your conversation</h3><p className="mt-1 text-xs text-slate-500">Follow-ups use the last question as context and still pass validation.</p></div><span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-700">{messages.filter((message) => message.role === 'user').length} turns</span></div>
                <div className="max-h-[460px] min-h-36 space-y-4 overflow-y-auto bg-slate-50/60 p-5" aria-live="polite">
                  {!messages.length && <div className="grid min-h-28 place-items-center text-center"><div><p className="text-sm font-medium text-slate-700">Start with a business question</p><div className="mt-3 flex flex-wrap justify-center gap-2">{['Show monthly revenue', 'Compare order counts by status', 'Which products generated the most revenue?'].map((sample) => <button className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:border-indigo-200 hover:text-indigo-700" key={sample} onClick={() => submitQuestion(null, sample)} type="button">{sample} <ArrowRight className="ml-1 inline" size={12} /></button>)}</div></div></div>}
                  {messages.map((message, index) => <ChatMessage key={`${index}-${message.time}`} {...message} />)}
                  {loading && <LoadingIndicator />}
                </div>
                <div className="p-4 md:p-5"><ErrorMessage message={analysisError} onDismiss={() => setAnalysisError('')} /><div className={analysisError ? 'mt-3' : ''}><ChatInput value={question} onChange={setQuestion} onSubmit={submitQuestion} loading={loading} /></div></div>
              </section>

              {analysis?.status === 'success' && <>
                <InsightCard insight={analysis.insight} />
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-semibold text-slate-900">Query results</h3><p className="mt-1 text-xs text-slate-500">{analysis.rows.length} rows returned in {analysis.executionTime} ms{analysis.truncated ? ' · capped at 500' : ''}</p></div><div className="flex rounded-lg bg-slate-100 p-1" role="tablist" aria-label="Result display"><button className={`rounded-md px-3 py-1.5 text-xs font-medium ${resultView === 'chart' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`} onClick={() => setResultView('chart')} role="tab" aria-selected={resultView === 'chart'} type="button">Visualization</button><button className={`rounded-md px-3 py-1.5 text-xs font-medium ${resultView === 'table' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`} onClick={() => setResultView('table')} role="tab" aria-selected={resultView === 'table'} type="button">Table</button></div></div>
                  <div className="mt-5">{resultView === 'chart' ? <Suspense fallback={<div className="grid h-64 place-items-center text-sm text-slate-400">Loading visualization…</div>}><ChartRenderer visualization={analysis.visualization} /></Suspense> : <DataTable columns={analysis.columns} rows={analysis.rows} truncated={analysis.truncated} />}</div>
                  {resultView === 'chart' && analysis.visualization?.type !== 'table' && analysis.rows.length > 1 && <details className="mt-5 border-t border-slate-100 pt-4"><summary className="cursor-pointer text-xs font-semibold text-slate-600">View data table</summary><div className="mt-4"><DataTable columns={analysis.columns} rows={analysis.rows} truncated={analysis.truncated} /></div></details>}
                </section>
                <SqlViewer sql={analysis.sql} />
              </>}
              {analysis?.status === 'clarification_needed' && <InsightCard insight={analysis.explanation} />}
            </div>

            <aside className="space-y-5">
              <SchemaOverview tables={tables} loading={schemaLoading} error={schemaError} />
              <RecentQueries items={recentQueries} onSelect={(value) => setQuestion(value)} />
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="text-sm font-semibold text-slate-900">Execution safeguards</h3><ul className="mt-3 space-y-2 text-xs leading-5 text-slate-500"><li>PostgreSQL SQL is parsed and checked against approved tables.</li><li>Queries execute in read-only transactions.</li><li>Results are limited to 500 rows with a statement timeout.</li></ul></section>
            </aside>
          </section>
        </div>
      </main>
    </div>
  )
}
