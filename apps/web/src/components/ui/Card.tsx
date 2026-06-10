import React from 'react'

type CardVariant = 'default' | 'elevated' | 'flat' | 'dark'

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant
}

export const Card: React.FC<CardProps> = ({
  className = '',
  variant = 'default',
  ...props
}) => {
  const base = 'rounded-2xl'

  const variants: Record<CardVariant, string> = {
    default:  'bg-white border border-gray-100 shadow-sm p-6',
    elevated: 'bg-white shadow-lg p-6',
    flat:     'bg-brand-sky-50 p-6',
    dark:     'bg-white/5 border border-white/10 p-6 text-white',
  }

  return (
    <div className={`${base} ${variants[variant]} ${className}`} {...props} />
  )
}
