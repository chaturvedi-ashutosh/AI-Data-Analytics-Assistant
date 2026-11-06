import { useState } from 'react'
import { Check, ChevronDown, ChevronUp, Copy, Code2 } from 'lucide-react'

export default function SqlViewer({ sql }) {
  const [open, setOpen] = useState(true)
  const [copied, setCopied] = useState(false)
  if (!sql) return null

  async function copySql() {
    try {
      await navigator.clipboard.writeText(sql)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch { setCopied(false) }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <button className="flex items-center gap-2 text-xs font-semibold text-slate-200" onClick={() => setOpen(!open)} type="button"><Code2 size={14} /> SQL inspection {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>
        <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-slate-300 hover:bg-white/10" onClick={copySql} type="button">{copied ? <Check size={13} /> : <Copy size={13} />}{copied ? 'Copied' : 'Copy SQL'}</button>
      </div>
      {open && <pre className="max-h-72 overflow-auto p-4 text-xs leading-6 text-emerald-100"><code>{sql}</code></pre>}
    </section>
  )
}
