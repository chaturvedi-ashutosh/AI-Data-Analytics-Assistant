import { cloneElement, isValidElement, useId } from 'react'

export default function Tooltip({ content, children, side = 'top' }) {
  const id = useId()
  if (!isValidElement(children)) throw new Error('Tooltip expects one focusable React element child.')
  const descriptionIds = [children.props['aria-describedby'], id].filter(Boolean).join(' ')
  const child = cloneElement(children, { 'aria-describedby': descriptionIds })
  return <span className={`tooltip-wrap tooltip-${side}`}>{child}<span className="tooltip-content" id={id} role="tooltip">{content}</span></span>
}
