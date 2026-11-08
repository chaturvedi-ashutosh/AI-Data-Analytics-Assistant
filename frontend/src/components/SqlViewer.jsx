import { useState } from 'react'
import { Check, ChevronDown, ChevronUp, Copy, Code2 } from 'lucide-react'

const keywords = new Set('ALL AND AS ASC BETWEEN BY CASE CAST DESC DISTINCT ELSE END EXCEPT EXISTS FALSE FILTER FOR FROM FULL GROUP HAVING IN INNER INTERSECT IS JOIN LEFT LIKE LIMIT NOT NULL OFFSET ON OR ORDER OUTER OVER PARTITION RIGHT SELECT THEN TRUE UNION WHEN WHERE WITH'.split(' '))
const tokenPattern = /--[^\n]*|\/\*[\s\S]*?\*\/|'(?:''|[^'])*'|"(?:""|[^"])*"|\b[A-Za-z_][A-Za-z0-9_$]*\b|\b\d+(?:\.\d+)?\b/g

function highlightedTokens(sql) {
  const tokens = []
  let cursor = 0
  for (const match of sql.matchAll(tokenPattern)) {
    const [value] = match
    const index = match.index
    if (index > cursor) tokens.push({ text: sql.slice(cursor, index), className: '' })
    let className = ''
    if (value.startsWith('--') || value.startsWith('/*')) className = 'sql-comment italic'
    else if (value.startsWith("'") || value.startsWith('"')) className = 'sql-string'
    else if (/^\d/.test(value)) className = 'sql-number'
    else if (keywords.has(value.toUpperCase())) className = 'sql-keyword font-semibold'
    else if (/\s*\(/.test(sql.slice(index + value.length, index + value.length + 2))) className = 'sql-function'
    tokens.push({ text: value, className })
    cursor = index + value.length
  }
  if (cursor < sql.length) tokens.push({ text: sql.slice(cursor), className: '' })
  return tokens
}

export default function SqlViewer({ sql }) {
  const [open, setOpen] = useState(true)
  const [copied, setCopied] = useState(false)
  if (!sql) return null
  const tokens = highlightedTokens(sql)

  async function copySql() {
    try {
      await navigator.clipboard.writeText(sql)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch { setCopied(false) }
  }

  return (
    <section className="sql-block overflow-hidden rounded-2xl border shadow-panel">
      <div className="sql-header flex items-center justify-between border-b px-4 py-3">
        <button className="flex items-center gap-2 text-xs font-semibold text-white" aria-expanded={open} onClick={() => setOpen(!open)} type="button"><Code2 size={14} className="text-[#eabfcb]" /> SQL inspection {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>
        <button className="sql-action flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] text-white transition" onClick={copySql} type="button">{copied ? <Check size={13} /> : <Copy size={13} />}{copied ? 'Copied' : 'Copy SQL'}</button>
      </div>
      {open && <pre className="sql-content max-h-80 overflow-auto p-5 font-mono text-xs leading-6"><code>{tokens.map((token, index) => <span className={token.className} key={`${index}-${token.text}`}>{token.text}</span>)}</code></pre>}
    </section>
  )
}
