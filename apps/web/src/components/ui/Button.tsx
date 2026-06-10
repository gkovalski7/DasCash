import React from 'react'

type ButtonSize    = 'sm' | 'md' | 'lg'
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'lime'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

export const Button: React.FC<ButtonProps> = ({
  className = '',
  variant = 'primary',
  size = 'md',
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-semibold transition-all duration-200 ' +
    'focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg font-body'

  const sizes: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  }

  const variants: Record<ButtonVariant, string> = {
    primary:
      'bg-brand-blue-600 text-white hover:bg-brand-blue-700 ' +
      'focus:ring-brand-blue-600 shadow-sm hover:shadow-md',
    secondary:
      'bg-white text-brand-navy-900 border border-slate-200 ' +
      'hover:bg-slate-50 focus:ring-brand-blue-600 shadow-sm',
    ghost:
      'bg-transparent text-brand-blue-600 hover:bg-brand-blue-50 ' +
      'focus:ring-brand-blue-600',
    outline:
      'bg-transparent text-brand-navy-900 border border-brand-navy-900 ' +
      'hover:bg-brand-navy-900 hover:text-white focus:ring-brand-navy-900',
    lime:
      'bg-brand-lime-400 text-brand-navy-900 hover:bg-brand-lime-300 ' +
      'focus:ring-brand-lime-400 font-bold shadow-sm hover:shadow-md',
  }

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    />
  )
}
