export default function ProgressBar({ pct, className = '' }: { pct: number; className?: string }) {
  const width = Math.max(0, Math.min(100, pct))
  return (
    <div className={`h-2 rounded-full bg-black/10 overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-brand-green-600 to-brand-lime-400 transition-all"
        style={{ width: `${width}%` }}
      />
    </div>
  )
}
