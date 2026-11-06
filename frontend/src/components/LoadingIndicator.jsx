import { LoaderCircle } from 'lucide-react'

export default function LoadingIndicator() {
  return <div className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 text-sm text-indigo-800" role="status"><LoaderCircle className="animate-spin" size={16} /> Generating, validating, and running the read-only analysis…</div>
}
