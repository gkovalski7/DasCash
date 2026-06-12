export default function Chip({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-app font-bold transition-all focus-visible:ring-2 focus-visible:ring-brand-green-600 focus-visible:outline-none ${
        active
          ? 'bg-brand-green-600 text-white shadow-sm'
          : 'bg-white text-brand-green-700 border border-brand-green-600/25 hover:border-brand-green-600'
      }`}
    >
      {label}
    </button>
  )
}
