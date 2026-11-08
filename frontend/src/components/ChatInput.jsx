import { ArrowUp, Ban } from 'lucide-react'

export default function ChatInput({ value, onChange, onSubmit, onCancel, loading, placeholder }) {
  return (
    <form className="rounded-2xl border border-line bg-surface p-3 shadow-panel transition focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10" onSubmit={onSubmit}>
      <label className="sr-only" htmlFor="analytics-question">Ask a follow-up analytics question</label>
      <textarea
        className="min-h-24 w-full resize-y border-0 bg-transparent px-2.5 py-2.5 text-sm leading-6 text-ink outline-none placeholder:text-subtle focus:ring-0"
        id="analytics-question"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault()
            onSubmit(event)
          }
        }}
        placeholder={placeholder || 'For example, how did monthly revenue change this year?'}
        value={value}
        disabled={loading}
      />
      <div className="flex justify-end border-t border-line px-2 pt-3">
        {loading
          ? <button className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/50" onClick={onCancel} type="button"><Ban size={14} aria-hidden="true" /> Cancel</button>
          : <button className="button button-primary inline-flex gap-2 px-4 py-2.5 text-xs" disabled={!value.trim()} type="submit">Ask <ArrowUp size={15} aria-hidden="true" /></button>}
      </div>
    </form>
  )
}
