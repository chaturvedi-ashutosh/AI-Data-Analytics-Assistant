const labels = {
  online: 'Online',
  offline: 'Offline',
  checking: 'Checking',
  unknown: 'Unknown',
  'not-reported': 'Not reported',
}

export default function StatusPill({ status = 'unknown', label, className = '', ...props }) {
  const safeStatus = labels[status] ? status : 'unknown'
  return <span className={`status-pill status-pill-${safeStatus} ${className}`.trim()} {...props}><span className="health-dot" aria-hidden="true" />{label || labels[safeStatus]}</span>
}
