import { AlertCircle, X } from 'lucide-react'

export default function ErrorMessage({ message, onDismiss }) {
  if (!message) return null
  return <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert"><AlertCircle size={16} className="mt-0.5 shrink-0" /><p className="flex-1 leading-5">{message}</p>{onDismiss && <button aria-label="Dismiss error" className="rounded p-1 hover:bg-rose-100" onClick={onDismiss} type="button"><X size={14} /></button>}</div>
}
