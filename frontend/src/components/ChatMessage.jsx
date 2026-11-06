import { Bot, UserRound } from 'lucide-react'

export default function ChatMessage({ role, text, time }) {
  const user = role === 'user'
  return (
    <article className={`flex gap-3 ${user ? 'flex-row-reverse' : ''}`}>
      <span className={`grid size-8 shrink-0 place-items-center rounded-xl ${user ? 'bg-slate-200 text-slate-600' : 'bg-indigo-600 text-white'}`}>
        {user ? <UserRound size={15} /> : <Bot size={16} />}
      </span>
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${user ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>
        <p className="whitespace-pre-wrap text-sm leading-6">{text}</p>
        {time && <p className={`mt-1 text-[10px] ${user ? 'text-indigo-200' : 'text-slate-400'}`}>{time}</p>}
      </div>
    </article>
  )
}
