import { LoaderCircle } from 'lucide-react'

const variants = {
  primary: 'button-primary',
  secondary: 'button-secondary',
  ghost: 'button-ghost',
  danger: 'button-danger',
}

export default function Button({ variant = 'primary', size = 'md', loading = false, disabled, className = '', children, type = 'button', ...props }) {
  const sizeClass = size === 'sm' ? 'button-sm' : size === 'lg' ? 'button-lg' : ''
  return (
    <button className={`button ${variants[variant] || variants.primary} ${sizeClass} ${className}`.trim()} type={type} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading && <LoaderCircle className="animate-spin" size={15} aria-hidden="true" />}
      {children}
    </button>
  )
}
