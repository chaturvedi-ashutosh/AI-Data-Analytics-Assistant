import { useEffect } from 'react'
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'
import IconButton from './IconButton.jsx'

const icons = { success: CheckCircle2, info: Info, error: TriangleAlert }

export default function Toast({ message, tone = 'info', onDismiss, duration = 5000 }) {
  useEffect(() => {
    if (!message || !duration || !onDismiss) return undefined
    const timer = window.setTimeout(onDismiss, duration)
    return () => window.clearTimeout(timer)
  }, [message, duration, onDismiss])
  if (!message) return null
  const Icon = icons[tone] || icons.info
  return <div className={`toast toast-${tone}`} role={tone === 'error' ? 'alert' : 'status'} aria-live={tone === 'error' ? 'assertive' : 'polite'}><Icon size={17} aria-hidden="true" /><p>{message}</p>{onDismiss && <IconButton label="Dismiss notification" onClick={onDismiss}><X size={15} aria-hidden="true" /></IconButton>}</div>
}
