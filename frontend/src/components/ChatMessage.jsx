import { Bot, ThumbsDown, ThumbsUp, UserRound } from 'lucide-react'

export default function ChatMessage({ id, role, text, time, feedback, onFeedback }) {
  const user = role === 'user'
  return (
    <article className={`flex items-end gap-2.5 sm:gap-3 ${user ? 'flex-row-reverse' : ''}`}>
      <span className={`grid size-8 shrink-0 place-items-center rounded-xl shadow-sm ${user ? 'bg-surface-raised text-muted' : 'bg-accent-soft text-accent'}`} aria-hidden="true">
        {user ? <UserRound size={15} /> : <Bot size={16} />}
      </span>
      <div className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[82%] ${user ? 'chat-user-bubble rounded-br-md' : 'rounded-bl-md border border-line bg-surface text-ink'}`}>
        <p className="whitespace-pre-wrap text-sm leading-6">{text}</p>
        {time && <p className={`mt-1.5 text-[10px] ${user ? 'chat-user-time' : 'text-subtle'}`}>{time}</p>}
        {!user && id && onFeedback && <div className="mt-2 flex items-center gap-1 border-t border-line pt-2" role="group" aria-label="Rate this answer">
          <span className="mr-1 text-[10px] text-subtle">Helpful?</span>
          <button className={`grid size-7 place-items-center rounded-md transition ${feedback === 'up' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300' : 'text-subtle hover:bg-surface-raised hover:text-ink'}`} onClick={() => onFeedback(id, 'up')} type="button" aria-label="Mark answer helpful" aria-pressed={feedback === 'up'}><ThumbsUp size={13} /></button>
          <button className={`grid size-7 place-items-center rounded-md transition ${feedback === 'down' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300' : 'text-subtle hover:bg-surface-raised hover:text-ink'}`} onClick={() => onFeedback(id, 'down')} type="button" aria-label="Mark answer not helpful" aria-pressed={feedback === 'down'}><ThumbsDown size={13} /></button>
        </div>}
      </div>
    </article>
  )
}
