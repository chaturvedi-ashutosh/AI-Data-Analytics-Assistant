export default function PageFrame({ eyebrow = 'Asklytics', title, description, children }) {
  return (
    <div className="page-frame">
      <div className="mb-7 max-w-3xl">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">{eyebrow}</p>
        <h2 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h2>
        {description && <p className="mt-2 text-sm leading-6 text-muted">{description}</p>}
      </div>
      {children}
    </div>
  )
}
