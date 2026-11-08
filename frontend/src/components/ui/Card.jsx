export function Card({ as: Element = 'section', className = '', ...props }) {
  return <Element className={`surface-card ${className}`.trim()} {...props} />
}

export default Card

export function CardHeader({ className = '', ...props }) {
  return <header className={`card-header ${className}`.trim()} {...props} />
}

export function CardTitle({ className = '', as: Element = 'h2', ...props }) {
  return <Element className={`font-display text-base font-semibold tracking-tight text-ink ${className}`.trim()} {...props} />
}

export function CardDescription({ className = '', ...props }) {
  return <p className={`mt-1 text-sm leading-6 text-muted ${className}`.trim()} {...props} />
}

export function CardContent({ className = '', ...props }) {
  return <div className={`card-content ${className}`.trim()} {...props} />
}

export function CardFooter({ className = '', ...props }) {
  return <footer className={`card-footer ${className}`.trim()} {...props} />
}
