import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowRightLeft, Database, KeyRound, Link2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ErrorMessage from '../components/ErrorMessage.jsx'
import PageFrame from '../components/layout/PageFrame.jsx'
import SchemaOverview from '../components/SchemaOverview.jsx'
import { Button, Card, EmptyState, SkeletonCard } from '../components/ui/index.js'
import { getSchema } from '../services/analyticsApi.js'
import { savePendingNavigation } from '../lib/storage.js'

export default function SchemaPage() {
  const navigate = useNavigate()
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [navigationError, setNavigationError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getSchema()
      setTables(Array.isArray(data.tables) ? data.tables : [])
    } catch (requestError) {
      setError(requestError.message || 'Could not load the schema.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const relationships = useMemo(() => tables.flatMap((table) => (table.foreignKeys || []).map((key) => ({
    id: `${table.name}.${key.column}-${key.referencedTable}.${key.referencedColumn}`,
    from: `${table.name}.${key.column}`,
    to: `${key.referencedTable}.${key.referencedColumn}`,
    name: key.name,
  }))), [tables])

  function insertName(value) {
    if (!savePendingNavigation({ type: 'insert', value })) {
      setNavigationError('Could not pass the selected schema name to Workspace. Check that browser session storage is available.')
      return
    }
    navigate('/')
  }

  return (
    <PageFrame title="Schema explorer" description="Browse available tables, columns, keys, and relationships. Select a name to use it in a Workspace question.">
      {navigationError && <div className="mb-4"><ErrorMessage message={navigationError} onDismiss={() => setNavigationError('')} /></div>}
      {error && <div className="mb-5"><ErrorMessage message={`Could not load the database schema: ${error}`} onRetry={load} /></div>}
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(300px,0.7fr)]">
        <div className="min-w-0">
          {loading ? <div className="grid gap-4 sm:grid-cols-2"><SkeletonCard /><SkeletonCard /></div> : !error && (
            <SchemaOverview tables={tables} loading={false} onInsert={insertName} />
          )}
        </div>
        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <span className="empty-icon !m-0"><ArrowRightLeft size={18} aria-hidden="true" /></span>
              <div><h3 className="font-display text-base font-semibold text-ink">Relationships</h3><p className="mt-1 text-xs text-muted">Foreign-key joins reported by PostgreSQL.</p></div>
            </div>
            {loading ? <p className="mt-5 text-sm text-muted" role="status">Loading relationships...</p> : relationships.length ? (
              <ul className="mt-4 divide-y divide-line" aria-label="Database foreign-key relationships">
                {relationships.map((relationship) => <li className="flex min-w-0 items-center gap-2 py-3 first:pt-0 last:pb-0" key={relationship.id}>
                  <Link2 size={14} className="shrink-0 text-accent" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-ink" title={`${relationship.from} → ${relationship.to}`}>{relationship.from}</span>
                  <span className="shrink-0 text-subtle" aria-hidden="true">→</span>
                  <span className="min-w-0 flex-1 truncate text-right font-mono text-[11px] text-ink" title={relationship.to}>{relationship.to}</span>
                </li>)}
              </ul>
            ) : error ? <p className="mt-4 text-sm text-muted">Relationships are unavailable until the schema loads.</p> : <EmptyState icon={Link2} title="No relationships found" description="The API did not return any foreign-key relationships for the available tables." />}
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3"><span className="empty-icon !m-0"><KeyRound size={18} aria-hidden="true" /></span><div><h3 className="font-display text-base font-semibold text-ink">Schema details</h3><p className="mt-1 text-xs text-muted">Retrieved from the existing schema API.</p></div></div>
            <p className="mt-4 text-sm leading-6 text-muted">Table and column names, data types, primary keys, and foreign-key links reflect the analytics schema currently exposed by the backend.</p>
            {!loading && !error && <Button variant="secondary" size="sm" className="mt-4" onClick={load}><Database size={13} aria-hidden="true" />Refresh schema</Button>}
          </Card>
        </div>
      </div>
    </PageFrame>
  )
}
