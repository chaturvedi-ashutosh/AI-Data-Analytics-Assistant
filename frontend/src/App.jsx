import { useEffect, useState } from 'react'
import { Activity, ArrowDownRight, ArrowUpRight, Clock3, Database, Layers3 } from 'lucide-react'
import { analyzeQuestion, getHealth, getSchema } from './services/analyticsApi.js'
import QuestionComposer from './components/QuestionComposer.jsx'
import SchemaOverview from './components/SchemaOverview.jsx'
import Sidebar from './components/Sidebar.jsx'

function StatusBadge({ connected }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
      connected ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
    }`}>
      <span className={`size-1.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
      {connected ? 'API connected' : 'Connection pending'}
    </span>
  )
}

function MetricCard({ label, value, caption, icon: Icon, trend }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
      <div className="flex items-start justify-between">
        <span className="grid size-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
          <Icon size={17} />
        </span>
        {trend && <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">{trend}</span>}
      </div>
      <p className="mt-4 text-xs font-medium text-slate-500">{label}</p>
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
  const [submittedQuestion, setSubmittedQuestion] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [analysisError, setAnalysisError] = useState('')
  const [analysisLoading, setAnalysisLoading] = useState(false)

  useEffect(() => {
    let active = true

    getHealth()
      .then((data) => active && setHealth(data))
      .catch((error) => active && setHealthError(error.message))

    getSchema()
      .then((data) => active && setTables(data.tables))
      .catch((error) => active && setSchemaError(error.message))
      .finally(() => active && setSchemaLoading(false))

    return () => {
      active = false
    }
  }, [])

  const databaseConnected = health?.services?.database === 'ok'
  const formattedDate = new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date())

  async function handleSubmit(event) {
    event.preventDefault()
    const normalizedQuestion = question.trim()
    if (!normalizedQuestion || analysisLoading) return
    setSubmittedQuestion(normalizedQuestion)
    setAnalysis(null)
    setAnalysisError('')
    setAnalysisLoading(true)
    try {
      setAnalysis(await analyzeQuestion(normalizedQuestion))
    } catch (error) {
      setAnalysisError(error.message)
    } finally {
      setAnalysisLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900 md:flex">
      <Sidebar databaseStatus={databaseConnected ? 'connected' : 'pending'} />

      <main className="min-w-0 flex-1" id="overview">
        <header className="flex items-center justify-between border-b border-slate-200/80 bg-white/80 px-5 py-4 backdrop-blur md:px-9">
          <div>
            <p className="text-xs font-medium text-slate-400">Workspace / Overview</p>
            <h1 className="mt-1 text-lg font-semibold tracking-tight">Analytics overview</h1>
          </div>
          <StatusBadge connected={Boolean(health && !healthError)} />
        </header>

        <div className="mx-auto max-w-7xl space-y-7 px-5 py-7 md:px-9 md:py-9">
          <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-medium text-indigo-600">{formattedDate}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Good morning</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Explore your business data with a question. Connect the database to see your schema and get started.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock3 size={14} /> Live workspace
            </div>
          </section>

          {healthError && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
              API status unavailable: {healthError}. Start the backend with <code>npm run dev:backend</code>.
            </div>
          )}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Analytics metrics">
            <MetricCard label="Total revenue" value="—" caption="Awaiting connected data" icon={Activity} trend={<><ArrowUpRight size={13} /> —</>} />
            <MetricCard label="Orders" value="—" caption="No query run yet" icon={Layers3} trend={<><ArrowDownRight size={13} /> —</>} />
            <MetricCard label="Customers" value="—" caption="No query run yet" icon={Database} />
            <MetricCard label="Data tables" value={schemaLoading ? '…' : String(tables.length)} caption="Discovered from PostgreSQL" icon={Layers3} />
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.9fr)]">
            <div className="space-y-5">
              <section className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-white p-5 md:p-6" id="question">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-slate-900">Ask your data</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Use a plain-language question to explore your business metrics.</p>
                </div>
                <QuestionComposer value={question} onChange={setQuestion} onSubmit={handleSubmit} loading={analysisLoading} />
                {analysisLoading && <p className="mt-3 text-sm text-indigo-700" role="status">Generating SQL with the configured local model…</p>}
                {analysisError && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">{analysisError}</p>}
                {analysis && (
                  <div className="mt-3 space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4">
                    <p className="text-xs font-medium text-indigo-900">{analysis.status === 'clarification_needed' ? 'Clarification needed' : 'Query complete'} · “{submittedQuestion}”</p>
                    <p className="text-sm leading-6 text-slate-700">{analysis.explanation}</p>
                    {analysis.sql && <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs leading-5 text-emerald-100"><code>{analysis.sql}</code></pre>}
                    {analysis.status === 'success' && <p className="text-[11px] text-slate-500">Executed using a read-only database role in {analysis.executionTime} ms.</p>}
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40 md:p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Results workspace</h3>
                    <p className="mt-1 text-xs text-slate-500">Query results and visualizations will appear here.</p>
                  </div>
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">{analysis?.status === 'success' ? `${analysis.rows.length}${analysis.truncated ? '+' : ''} rows` : 'No query yet'}</span>
                </div>
                {analysis?.status === 'success' ? (
                  analysis.rows.length ? (
                    <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
                      <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500"><tr>{analysis.columns.map((column) => <th className="px-4 py-3 font-semibold" key={column}>{column}</th>)}</tr></thead>
                        <tbody className="divide-y divide-slate-100 bg-white">{analysis.rows.map((row, index) => <tr key={index}>{analysis.columns.map((column) => <td className="max-w-64 px-4 py-3 text-slate-700" key={column}>{row[column] == null ? '—' : String(row[column])}</td>)}</tr>)}</tbody>
                      </table>
                      {analysis.truncated && <p className="border-t border-slate-100 px-4 py-2 text-[11px] text-slate-500">Showing the first 500 rows.</p>}
                    </div>
                  ) : <div className="mt-5 grid min-h-40 place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-6 text-center text-sm text-slate-500">The query returned no rows.</div>
                ) : <div className="mt-5 grid min-h-52 place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-6 text-center">
                  <div>
                    <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-white text-indigo-500 shadow-sm">
                      <Activity size={20} />
                    </span>
                    <p className="mt-3 text-sm font-medium text-slate-700">Your analysis will show up here</p>
                    <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
                      Generated SQL appears above. Query execution and visualizations are not enabled yet.
                    </p>
                  </div>
                </div>}
              </section>
            </div>

            <div className="space-y-5">
              <SchemaOverview tables={tables} loading={schemaLoading} error={schemaError} />
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
                <h3 className="text-sm font-semibold text-slate-900">Connection status</h3>
                <p className="mt-1 text-xs text-slate-500">Backend and PostgreSQL availability</p>
                <div className="mt-4 space-y-3">
                  {[
                    ['Express API', health?.services?.api === 'ok'],
                    ['PostgreSQL', health?.services?.database === 'ok'],
                  ].map(([label, connected]) => (
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5" key={label}>
                      <span className="text-xs font-medium text-slate-700">{label}</span>
                      <span className={`text-[11px] font-semibold ${connected ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {health ? (connected ? 'Connected' : 'Unavailable') : 'Checking…'}
                      </span>
                    </div>
                  ))}
                </div>
                {(healthError || health?.message) && (
                  <p className="mt-3 text-xs leading-5 text-slate-400">{healthError || health.message}</p>
                )}
              </section>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
