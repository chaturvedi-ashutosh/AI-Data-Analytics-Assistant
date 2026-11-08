import { useEffect, useRef, useState } from 'react'
import { Activity, ArrowRight, MessageSquareText, Plus, Sparkles } from 'lucide-react'
import { analyzeQuestion, getSchema } from '../services/analyticsApi.js'
import ChatInput from '../components/ChatInput.jsx'
import ChatMessage from '../components/ui/ChatMessage.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import LoadingIndicator from '../components/LoadingIndicator.jsx'
import RecentQueries from '../components/RecentQueries.jsx'
import ResultsPanel from '../components/ResultsPanel.jsx'
import { consumePendingNavigation, loadDashboardPins, loadQueryHistory, saveDashboardPins, saveQueryHistory } from '../lib/storage.js'

const FEEDBACK_STORAGE_KEY = 'asklytics-answer-feedback'

function createId() {
  return window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function readFeedback() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(FEEDBACK_STORAGE_KEY) || '{}')
    return saved && typeof saved === 'object' && !Array.isArray(saved)
      ? Object.fromEntries(Object.entries(saved).filter(([, value]) => value === 'up' || value === 'down'))
      : {}
  } catch {
    return {}
  }
}

const starterQuestionTemplates = [
  { title: 'Monthly revenue', question: 'Show monthly revenue', detail: 'Track sales over time', tables: ['orders', 'order_items'] },
  { title: 'Top products', question: 'Which products generated the most revenue?', detail: 'Rank products by sales', tables: ['products', 'order_items'] },
  { title: 'Order status', question: 'Compare order counts by status', detail: 'Compare order volumes', tables: ['orders'] },
  { title: 'Orders by region', question: 'Which regions had the most orders?', detail: 'Compare customer regions', tables: ['orders', 'customers', 'regions'] },
]

export default function WorkspacePage() {
  const [tables, setTables] = useState([])
  const [schemaLoading, setSchemaLoading] = useState(true)
  const [schemaError, setSchemaError] = useState('')
  const [question, setQuestion] = useState('')
  const [conversationId, setConversationId] = useState(createId)
  const [messages, setMessages] = useState([])
  const [analysis, setAnalysis] = useState(null)
  const [analysisError, setAnalysisError] = useState('')
  const [loading, setLoading] = useState(false)
  const [recentQueries, setRecentQueries] = useState(loadQueryHistory)
  const [dashboardPins, setDashboardPins] = useState(loadDashboardPins)
  const [pinError, setPinError] = useState('')
  const [answerFeedback, setAnswerFeedback] = useState(readFeedback)
  const [lastQuestion, setLastQuestion] = useState('')
  const [resultTab, setResultTab] = useState('chart')
  const requestController = useRef(null)
  const threadEndRef = useRef(null)

  useEffect(() => {
    let active = true
    getSchema()
      .then((data) => { if (active) setTables(data.tables || []) })
      .catch((error) => { if (active) setSchemaError(error.message) })
      .finally(() => { if (active) setSchemaLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    saveQueryHistory(recentQueries)
  }, [recentQueries])

  useEffect(() => {
    const pending = consumePendingNavigation()
    if (pending?.type === 'question' && typeof pending.value === 'string') {
      submitQuestion(null, pending.value)
    } else if (pending?.type === 'insert' && typeof pending.value === 'string') {
      setQuestion(pending.value)
    }
  }, [])

  useEffect(() => {
    try { window.localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(answerFeedback)) } catch { /* Keep feedback available for this session. */ }
  }, [answerFeedback])

  useEffect(() => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    threadEndRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'end' })
  }, [messages, loading])

  function resetChat() {
    requestController.current?.abort()
    requestController.current = null
    setConversationId(createId())
    setMessages([])
    setQuestion('')
    setAnalysis(null)
    setAnalysisError('')
    setLastQuestion('')
    setResultTab('chart')
    setLoading(false)
  }

  useEffect(() => {
    function handleNewChat() { resetChat() }
    function handleShortcuts(event) {
      const modifier = event.ctrlKey || event.metaKey
      if (modifier && !event.shiftKey && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        window.dispatchEvent(new Event('asklytics:new-chat'))
      } else if (event.key === '/' && !modifier && !event.altKey && !event.shiftKey) {
        const target = event.target
        const isEditing = target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
        if (!isEditing) {
          event.preventDefault()
          document.getElementById('analytics-question')?.focus()
        }
      } else if (event.key === 'Escape' && requestController.current) {
        cancelRequest()
      }
    }
    window.addEventListener('asklytics:new-chat', handleNewChat)
    window.addEventListener('keydown', handleShortcuts)
    return () => {
      window.removeEventListener('asklytics:new-chat', handleNewChat)
      window.removeEventListener('keydown', handleShortcuts)
    }
  }, [])

  function addToHistory(questionText, turnConversationId) {
    setRecentQueries((items) => {
      const previous = items.find((item) => item.question === questionText)
      const entry = {
        id: previous?.id || createId(), question: questionText,
        pinned: previous?.pinned || false, createdAt: new Date().toISOString(), conversationId: turnConversationId,
      }
      const next = [entry, ...items.filter((item) => item.question !== questionText)]
      const pinned = next.filter((item) => item.pinned)
      return [...pinned, ...next.filter((item) => !item.pinned).slice(0, Math.max(0, 100 - pinned.length))]
    })
  }

  function togglePinnedAnalysis() {
    if (analysis?.status !== 'success') return
    const existing = dashboardPins.find((item) => item.question === analysis.question && item.sql === analysis.sql)
    if (!existing && dashboardPins.length >= 20) {
      setPinError('The dashboard can hold up to 20 saved results. Remove one before pinning another.')
      return
    }
    const next = existing
      ? dashboardPins.filter((item) => item.id !== existing.id)
      : [{
          id: createId(), question: analysis.question || lastQuestion, sql: analysis.sql,
          columns: analysis.columns || [], columnMetadata: analysis.columnMetadata || [],
          rows: analysis.rows || [], insight: analysis.insight || '', visualization: analysis.visualization || null,
          truncated: Boolean(analysis.truncated), executionTime: analysis.executionTime, pinnedAt: new Date().toISOString(),
        }, ...dashboardPins]
    if (!saveDashboardPins(next)) {
      setPinError('The result could not be saved in this browser. Free some local storage space and try again.')
      return
    }
    setDashboardPins(next)
    setPinError('')
  }

  function cancelRequest() {
    if (!requestController.current) return
    requestController.current.abort()
    requestController.current = null
    setLoading(false)
    setAnalysisError('Request cancelled. You can retry this question. Work already started by the backend may continue.')
  }

  async function submitQuestion(event, overrideQuestion = '', { retry = false } = {}) {
    event?.preventDefault()
    const currentQuestion = (overrideQuestion || question).trim()
    if (!currentQuestion || loading) return

    if (!retry) setMessages((items) => [...items, {
      id: createId(), role: 'user', text: currentQuestion,
      time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    }])
    setLastQuestion(currentQuestion)
    addToHistory(currentQuestion, conversationId)
    setQuestion('')
    setAnalysis(null)
    setAnalysisError('')
    setPinError('')
    const controller = new AbortController()
    requestController.current = controller
    setLoading(true)
    try {
      const result = await analyzeQuestion(currentQuestion, conversationId, { signal: controller.signal })
      if (requestController.current !== controller) return
      setAnalysis(result)
      setMessages((items) => [...items, {
        id: createId(), role: 'assistant',
        text: result.status === 'clarification_needed' ? result.explanation : (result.insight || 'Your analysis is ready.'),
        time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      }])
      setResultTab(result.visualization?.type === 'table' ? 'table' : 'chart')
    } catch (error) {
      if (requestController.current !== controller) return
      if (error.payload?.status === 'rejected') {
        const friendlyMessage = 'I could not safely answer that question with the available data. Try a specific table, metric, or time period.'
        setAnalysis({ status: 'rejected', message: friendlyMessage })
        setMessages((items) => [...items, {
          id: createId(), role: 'assistant', text: friendlyMessage,
          time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        }])
      } else {
        setAnalysisError(error.message || 'Something went wrong. Please try again.')
      }
    } finally {
      if (requestController.current === controller) {
        requestController.current = null
        setLoading(false)
      }
    }
  }

  function toggleAnswerFeedback(answerId, rating) {
    setAnswerFeedback((current) => {
      const next = { ...current }
      if (next[answerId] === rating) delete next[answerId]
      else next[answerId] = rating
      return next
    })
  }

  const questionCount = messages.filter((message) => message.role === 'user').length
  const availableTables = new Set(tables.map((table) => table.name))
  const starterQuestions = starterQuestionTemplates.filter(({ tables: requiredTables }) => requiredTables.every((table) => availableTables.has(table)))
  const formattedDate = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date())

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 md:px-9 md:py-8">
      <section className="surface-card flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-end sm:p-7">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-semibold text-accent"><Activity size={14} aria-hidden="true" /> {formattedDate}</p>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Your data, in plain language.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Ask a business question, inspect the validated SQL, and explore the answer in a chart or table.</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-accent-line bg-accent-soft px-3 py-2 text-xs font-semibold text-accent"><span className="size-2 rounded-full bg-current" /> Read-only analytics</span>
      </section>

      {schemaError && <ErrorMessage message={`Schema could not be loaded: ${schemaError}`} />}

      <section className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="surface-card flex min-w-0 flex-col overflow-hidden" aria-label="Ask your data">
          <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-5">
            <div className="flex items-center gap-3">
              <span className="empty-icon !m-0"><Sparkles size={18} aria-hidden="true" /></span>
              <div><h3 className="text-sm font-semibold text-ink">Ask your data</h3><p className="mt-1 text-xs text-muted">Ask a question or choose an example.</p></div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden rounded-full border border-line px-2.5 py-1.5 text-[11px] font-medium text-muted sm:inline-flex">{questionCount} asked</span>
              <button className="icon-button !h-9 !w-9" onClick={resetChat} type="button" aria-label="Start a new chat" title="New chat"><Plus size={16} aria-hidden="true" /></button>
            </div>
          </header>
          <div className="max-h-[60dvh] min-h-56 space-y-4 overflow-y-auto bg-canvas/70 p-4 sm:max-h-[560px] sm:p-5 xl:max-h-none xl:min-h-0 xl:flex-1" role="log" aria-label="Conversation" aria-relevant="additions" aria-live="polite">
            {!messages.length && <div className="grid min-h-48 place-items-center text-center">
              <div className="max-w-xl">
                <span className="empty-icon"><MessageSquareText size={20} aria-hidden="true" /></span>
                <p className="mt-4 text-base font-semibold text-ink">What would you like to understand?</p>
                <p className="mt-1 text-xs leading-5 text-muted">Ask about revenue, orders, customers, or products. Queries are checked before execution.</p>
                <p className="mt-5 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-subtle">Try an example</p>
                {schemaLoading ? <p className="mt-2 text-xs text-muted" role="status">Loading examples from your schema...</p> : starterQuestions.length ? (
                  <div className="mt-2 grid gap-2 text-left sm:grid-cols-2">
                    {starterQuestions.map(({ title, question: example, detail }) => <button className="group flex min-h-16 items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3 py-2.5 text-left transition hover:border-accent hover:bg-accent-soft" key={title} onClick={() => submitQuestion(null, example)} type="button"><span><span className="block text-xs font-semibold text-ink">{title}</span><span className="mt-1 block text-[11px] text-muted">{detail}</span></span><ArrowRight className="text-subtle group-hover:text-accent" size={14} aria-hidden="true" /></button>)}
                  </div>
                ) : <p className="mt-2 rounded-lg border border-dashed border-line px-3 py-2 text-xs text-muted" role="status">{schemaError ? 'Examples are unavailable because the schema could not be loaded.' : 'No matching example tables were found.'}</p>}
              </div>
            </div>}
            {messages.map((message, index) => <ChatMessage key={message.id || `${index}-${message.time}`} {...message} feedback={answerFeedback[message.id]} onFeedback={toggleAnswerFeedback} />)}
            {loading && <LoadingIndicator />}
            <div ref={threadEndRef} aria-hidden="true" />
          </div>
          <div className="border-t border-line bg-surface p-4 sm:p-5">
            <ErrorMessage message={analysisError} onDismiss={() => setAnalysisError('')} onRetry={lastQuestion ? () => submitQuestion(null, lastQuestion, { retry: true }) : undefined} />
            <div className={analysisError ? 'mt-3' : ''}><ChatInput value={question} onChange={setQuestion} onSubmit={submitQuestion} onCancel={cancelRequest} loading={loading} placeholder={analysis?.status === 'clarification_needed' ? 'Answer the clarification above...' : undefined} /></div>
          </div>
        </section>

        <div className="space-y-5">
          <ResultsPanel
            analysis={analysis}
            activeTab={resultTab}
            onTabChange={setResultTab}
            onFollowUp={setQuestion}
            onPinResult={togglePinnedAnalysis}
            isPinned={Boolean(analysis && dashboardPins.some((item) => item.question === analysis.question && item.sql === analysis.sql))}
            pinError={pinError}
          />
          <aside aria-label="Workspace history">
            <RecentQueries items={recentQueries} onRun={(value) => submitQuestion(null, value)} onTogglePin={(id) => setRecentQueries((items) => items.map((item) => item.id === id ? { ...item, pinned: !item.pinned } : item))} onClear={() => setRecentQueries([])} />
          </aside>
        </div>
      </section>
    </div>
  )
}
