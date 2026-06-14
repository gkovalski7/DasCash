type Props = {
  title: string
  currentAmount: string
  targetAmount: string
  percent: number
}

function formatARS(value: string): string {
  const n = parseFloat(value) || 0
  return n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// Diseñado para fondos oscuros (PagoExitoso, contenedor oscuro en detalle de causa)
export default function GoalProgress({ title, currentAmount, targetAmount, percent }: Props) {
  const safePercent = Number.isFinite(percent) ? percent : 0
  const clamped = Math.max(0, Math.min(safePercent, 100))
  const done = clamped >= 100
  return (
    <div className="bg-white/10 border border-white/15 rounded-2xl px-5 py-4 text-left">
      <p className="text-sm font-bold text-white mb-2">{title}</p>
      <div
        className="h-2.5 w-full rounded-full bg-white/15 overflow-hidden"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={title}
      >
        <div
          data-testid="goal-bar-fill"
          className="h-full rounded-full bg-brand-lime-400 transition-all duration-700"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-white/70">
          ${formatARS(currentAmount)} / ${formatARS(targetAmount)}
        </span>
        <span className="text-xs font-bold text-brand-lime-300">{clamped}%</span>
      </div>
      {done && (
        <p className="text-xs font-bold text-brand-lime-300 mt-2">¡Meta cumplida! 🎉</p>
      )}
    </div>
  )
}
