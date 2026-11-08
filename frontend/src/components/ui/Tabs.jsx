export default function Tabs({ items, value, onChange, label = 'View options', idPrefix = 'view', className = '' }) {
  function handleKeyDown(event, index) {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const nextIndex = event.key === 'Home' ? 0
      : event.key === 'End' ? items.length - 1
        : (index + (event.key === 'ArrowRight' ? 1 : items.length - 1)) % items.length
    const item = items[nextIndex]
    onChange(item.value)
    requestAnimationFrame(() => document.getElementById(`${idPrefix}-tab-${item.value}`)?.focus())
  }

  return (
    <div className={`tabs-list ${className}`.trim()} role="tablist" aria-label={label}>
      {items.map((item, index) => {
        const selected = item.value === value
        const Icon = item.icon
        return <button
          className={`tabs-trigger ${selected ? 'tabs-trigger-active' : ''}`}
          id={`${idPrefix}-tab-${item.value}`}
          key={item.value}
          onClick={() => onChange(item.value)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          role="tab"
          type="button"
          aria-selected={selected}
          aria-controls={`${idPrefix}-panel-${item.value}`}
          tabIndex={selected ? 0 : -1}
        >{Icon && <Icon size={14} aria-hidden="true" />}{item.label}</button>
      })}
    </div>
  )
}
