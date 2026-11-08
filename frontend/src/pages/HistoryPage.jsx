import { useMemo, useState } from 'react'
import { Clock3, MessageSquareText, Pin, Play, Search, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageFrame from '../components/layout/PageFrame.jsx'
import { Button, Card, EmptyState, Input } from '../components/ui/index.js'
import { loadQueryHistory, savePendingNavigation, saveQueryHistory } from '../lib/storage.js'

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState(loadQueryHistory)
  const [search, setSearch] = useState('')
  const [showPinned, setShowPinned] = useState(false)
  const [error, setError] = useState('')
  const normalizedSearch = search.trim().toLocaleLowerCase()
  const filtered = useMemo(() => items.filter((item) => {
    const matchesSearch = !normalizedSearch || item.question.toLocaleLowerCase().includes(normalizedSearch)
    return matchesSearch && (!showPinned || item.pinned)
  }), [items, normalizedSearch, showPinned])

  function updateHistory(next) {
    if (!saveQueryHistory(next)) {
      setError('Could not update saved history in this browser.')
      return
    }
    setItems(next)
    setError('')
  }

  function runQuestion(question) {
    if (!savePendingNavigation({ type: 'question', value: question })) {
      setError('Could not open this question in the workspace. Check that browser session storage is available.')
      return
    }
    navigate('/')
  }

  function clearHistory() {
    if (!window.confirm('Clear all saved query history from this browser?')) return
    updateHistory([])
  }

  return (
    <PageFrame title="Query history" description="Search, pin, and rerun questions saved in this browser.">
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-line p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
          <div className="w-full max-w-xl">
            <Input label="Search questions" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your questions" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant={showPinned ? 'primary' : 'secondary'} size="sm" aria-pressed={showPinned} onClick={() => setShowPinned((value) => !value)}><Pin size={13} aria-hidden="true" />{showPinned ? 'Pinned only' : 'All questions'}</Button>
            <Button variant="ghost" size="sm" disabled={!items.length} onClick={clearHistory}><Trash2 size={13} aria-hidden="true" />Clear history</Button>
          </div>
        </div>

        {error && <p className="mx-4 mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-200 sm:mx-5" role="alert">{error}</p>}
        {!items.length ? (
          <EmptyState className="min-h-64" icon={Clock3} title="Your history is empty" description="Questions you ask in Workspace are saved on this device so you can find and rerun them later." action={<Button onClick={() => navigate('/')}><MessageSquareText size={15} aria-hidden="true" />Go to workspace</Button>} />
        ) : filtered.length ? (
          <ul className="divide-y divide-line" aria-label="Saved query history">
            {filtered.map((item) => (
              <li className="flex flex-col gap-3 p-4 transition-colors hover:bg-surface-raised/60 sm:flex-row sm:items-center sm:justify-between sm:px-5" key={item.id}>
                <div className="min-w-0">
                  <p className="break-words text-sm font-medium leading-6 text-ink">{item.question}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-subtle">
                    <time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>
                    {item.pinned && <span className="inline-flex items-center gap-1 text-accent"><Pin size={11} className="fill-current" aria-hidden="true" />Pinned</span>}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button variant="secondary" size="sm" aria-pressed={Boolean(item.pinned)} aria-label={item.pinned ? `Unpin question: ${item.question}` : `Pin question: ${item.question}`} onClick={() => updateHistory(items.map((entry) => entry.id === item.id ? { ...entry, pinned: !entry.pinned } : entry))}>
                    <Pin size={13} aria-hidden="true" className={item.pinned ? 'fill-current' : ''} />{item.pinned ? 'Unpin' : 'Pin'}
                  </Button>
                  <Button size="sm" onClick={() => runQuestion(item.question)}><Play size={13} aria-hidden="true" />Run</Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState className="min-h-64" icon={Search} title={showPinned ? 'No pinned questions' : 'No matching questions'} description={showPinned ? 'Pin a saved question to keep it easy to find.' : 'Try a different search phrase.'} />
        )}
        <footer className="border-t border-line px-4 py-3 text-[11px] text-subtle sm:px-5">{items.length} saved {items.length === 1 ? 'question' : 'questions'} · Stored only in this browser</footer>
      </Card>
    </PageFrame>
  )
}
