import { AlertCircle, RotateCcw, X } from 'lucide-react'

export default function ErrorMessage({ message, onDismiss, onRetry }) {
  if (!message) return null
  return <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-800 shadow-sm dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-200 dark:shadow-none" role="alert"><AlertCircle size={16} className="mt-0.5 shrink-0" /><p className="flex-1 leading-5">{message}</p>{onRetry && <button className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-medium transition hover:bg-rose-100 dark:border-rose-800 dark:hover:bg-rose-900/60" onClick={onRetry} type="button"><RotateCcw size={13} /> Retry</button>}{onDismiss && <button aria-label="Dismiss error" className="rounded-lg p-1 transition hover:bg-rose-100 dark:hover:bg-rose-900/60" onClick={onDismiss} type="button"><X size={14} /></button>}</div>
}
