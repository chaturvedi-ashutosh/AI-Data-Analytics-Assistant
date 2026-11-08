export default function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return <div className={`empty-state ${className}`.trim()}>
    {Icon && <span className="empty-icon"><Icon size={20} aria-hidden="true" /></span>}
    <h3 className="mt-4 font-display text-base font-semibold text-ink">{title}</h3>
    {description && <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-muted">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
}
