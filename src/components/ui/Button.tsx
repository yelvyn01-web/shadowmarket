import React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'emerald' | 'ghost' | 'outline' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const variantStyles = {
    primary:
      'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold border border-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:shadow-[0_0_25px_rgba(0,240,255,0.5)] active:scale-[0.98]',
    secondary:
      'bg-slate-900/90 hover:bg-slate-800 text-slate-100 font-semibold border border-slate-700/80 hover:border-cyan-500/50 hover:shadow-[0_0_12px_rgba(0,240,255,0.15)] active:scale-[0.98]',
    emerald:
      'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold border border-emerald-300 shadow-[0_0_15px_rgba(5,255,161,0.3)] hover:shadow-[0_0_25px_rgba(5,255,161,0.5)] active:scale-[0.98]',
    ghost:
      'bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-cyan-300 border border-transparent',
    outline:
      'bg-transparent hover:bg-cyan-950/30 text-cyan-300 font-semibold border border-cyan-500/50 hover:border-cyan-400 active:scale-[0.98]',
    destructive:
      'bg-rose-600 hover:bg-rose-500 text-white font-bold border border-rose-400 shadow-[0_0_15px_rgba(255,0,85,0.3)] active:scale-[0.98]',
  }

  const sizeStyles = {
    sm: 'h-9 px-3 text-xs tracking-wider',
    md: 'h-11 px-5 text-sm tracking-wide',
    lg: 'h-12 px-7 text-base tracking-wide',
  }

  return (
    <button
      className={cn(
        'relative inline-flex items-center justify-center gap-2 rounded-sm font-sans uppercase tracking-wider transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  )
}
