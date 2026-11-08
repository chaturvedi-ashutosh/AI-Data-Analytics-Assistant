import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import IconButton from './IconButton.jsx'

export default function Modal({ open, onClose, title, description, children, side = false, className = '' }) {
  const dialogRef = useRef(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return undefined
    if (open && !dialog.open) {
      const previousFocus = document.activeElement
      dialog.showModal()
      dialog.querySelector('[autofocus], button, input, select, textarea, a[href]')?.focus()
      return () => {
        if (dialog.open) dialog.close()
        previousFocus?.focus?.()
      }
    }
    if (!open && dialog.open) dialog.close()
    return undefined
  }, [open])

  function trapFocus(event) {
    if (event.key !== 'Tab') return
    const dialog = dialogRef.current
    const focusable = [...dialog.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]')]
    if (!focusable.length) { event.preventDefault(); dialog.focus(); return }
    if (event.shiftKey && document.activeElement === focusable[0]) {
      event.preventDefault(); focusable.at(-1).focus()
    } else if (!event.shiftKey && document.activeElement === focusable.at(-1)) {
      event.preventDefault(); focusable[0].focus()
    }
  }

  return createPortal(
    <dialog
      className={`app-dialog ${side ? 'app-drawer' : ''} ${className}`.trim()}
      ref={dialogRef}
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      tabIndex={-1}
      onClose={onClose}
      onKeyDown={trapFocus}
      onMouseDown={(event) => { if (event.target === dialogRef.current) dialogRef.current.close() }}
    >
      <header className="dialog-header">
        <div><h2 className="font-display text-base font-semibold text-ink" id={titleId}>{title}</h2>{description && <p className="mt-1 text-xs text-muted" id={descriptionId}>{description}</p>}</div>
        <IconButton label="Close dialog" onClick={() => dialogRef.current?.close()}><X size={17} aria-hidden="true" /></IconButton>
      </header>
      <div className="dialog-content">{children}</div>
    </dialog>,
    document.body,
  )
}
