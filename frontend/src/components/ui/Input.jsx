import { useId } from 'react'

export default function Input({ label, hint, error, id, className = '', as = 'input', ...props }) {
  const generatedId = useId()
  const inputId = id || generatedId
  const hintId = hint ? `${inputId}-hint` : undefined
  const errorId = error ? `${inputId}-error` : undefined
  const Element = as
  return (
    <div className="field-group">
      {label && <label className="field-label" htmlFor={inputId}>{label}</label>}
      <Element
        className={`field-control ${error ? 'field-control-error' : ''} ${className}`.trim()}
        id={inputId}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        {...props}
      />
      {hint && <p className="field-hint" id={hintId}>{hint}</p>}
      {error && <p className="field-error" id={errorId} role="alert">{error}</p>}
    </div>
  )
}
