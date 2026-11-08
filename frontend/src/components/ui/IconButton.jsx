export default function IconButton({ label, className = '', children, type = 'button', ...props }) {
  if (!label) throw new Error('IconButton requires an accessible label.')
  return <button className={`icon-button ${className}`.trim()} type={type} aria-label={label} title={props.title || label} {...props}>{children}</button>
}
