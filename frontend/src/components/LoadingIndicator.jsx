import { LoaderCircle } from 'lucide-react'

export default function LoadingIndicator() {
  return <div className="flex items-center gap-3 rounded-2xl border border-accent-line bg-accent-soft px-4 py-3 text-sm text-accent shadow-sm" role="status" aria-live="polite" aria-atomic="true"><span className="grid size-8 place-items-center rounded-xl bg-surface text-accent"><LoaderCircle className="animate-spin" size={16} aria-hidden="true" /></span> Working on your analysis...</div>
}
