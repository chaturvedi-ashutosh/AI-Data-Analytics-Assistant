export default function Skeleton({ className = '', rounded = 'rounded-lg', ...props }) {
  return <span className={`skeleton ${rounded} ${className}`.trim()} aria-hidden="true" {...props} />
}

export function SkeletonCard() {
  return <div className="surface-card space-y-3 p-5" aria-hidden="true"><Skeleton className="h-4 w-2/5" /><Skeleton className="h-3 w-4/5" /><Skeleton className="mt-5 h-28 w-full" rounded="rounded-xl" /></div>
}
