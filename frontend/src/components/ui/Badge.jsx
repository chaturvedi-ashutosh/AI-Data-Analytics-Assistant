const tones = {
  neutral: 'badge-neutral',
  accent: 'badge-accent',
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
}

export default function Badge({ tone = 'neutral', className = '', ...props }) {
  return <span className={`badge ${tones[tone] || tones.neutral} ${className}`.trim()} {...props} />
}
