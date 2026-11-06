import { ArrowUp, Sparkles } from 'lucide-react'

export default function ChatInput({ value, onChange, onSubmit, loading }) {
  return (
    <form className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-100/70" onSubmit={onSubmit}>
      <label className="sr-only" htmlFor="analytics-question">Ask a follow-up analytics question</label>
      <textarea
        className="min-h-20 w-full resize-y border-0 bg-transparent px-2 py-2 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400 focus:ring-0"
        id="analytics-question"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Ask a question or follow up on this analysis…"
        value={value}
        disabled={loading}
      />
      <div className="flex items-center justify-between border-t border-slate-100 px-2 pt-3">
        <span className="flex items-center gap-1.5 text-xs text-slate-400"><Sparkles size={14} className="text-indigo-500" /> Follow-ups keep the current conversation context</span>
        <button className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={!value.trim() || loading} type="submit">
          {loading ? 'Analyzing…' : 'Ask'} <ArrowUp size={15} />
        </button>
      </div>
    </form>
  )
}
