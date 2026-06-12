import type { ReactNode } from 'react'

export default function ScreenHeader({
  variant = 'navy', eyebrow, title, children,
}: {
  variant?: 'navy' | 'green'
  eyebrow?: ReactNode
  title: ReactNode
  children?: ReactNode
}) {
  const bg = variant === 'green' ? 'bg-brand-green-600' : 'bg-brand-navy-900'
  return (
    <header className={`${bg} text-white px-4 pt-5 pb-4 rounded-b-3xl`}>
      {eyebrow && <p className="text-xs text-white/75 font-app mb-0.5">{eyebrow}</p>}
      <h1 className="text-xl font-app font-extrabold leading-tight">{title}</h1>
      {children}
    </header>
  )
}
