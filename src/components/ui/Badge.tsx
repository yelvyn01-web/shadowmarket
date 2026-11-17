import React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'purple' | 'slate' | 'outline'
  size?: 'sm' | 'md'
  showDot?: boolean
}

export function Badge({
  className,
  variant = 'cyan',
  size = 'md',
  showDot = false,
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    cyan: 'bg-cyan-950/70 text-cyan-300 border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.15)]',
    emerald: 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(5,255,161,0.15)]',
    amber: 'bg-amber-950/70 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(255,184,0,0.15)]',
    rose: 'bg-rose-950/70 text-rose-300 border-rose-500/40 shadow-[0_0_10px_rgba(255,0,85,0.15)]',
    purple: 'bg-purple-950/70 text-purple-300 border-purple-500/40 shadow-[0_0_10px_rgba(157,78,221,0.15)]',
    slate: 'bg-slate-900/90 text-slate-300 border-slate-700/60',
    outline: 'bg-transparent text-slate-300 border-slate-600',
  }

  const dotColors = {
    cyan: 'bg-cyan-400 shadow-[0_0_6px_#00f0ff]',
    emerald: 'bg-emerald-400 shadow-[0_0_6px_#05ffa1]',
    amber: 'bg-amber-400 shadow-[0_0_6px_#ffb800]',
    rose: 'bg-rose-400 shadow-[0_0_6px_#ff0055]',
    purple: 'bg-purple-400 shadow-[0_0_6px_#9d4edd]',
    slate: 'bg-slate-400',
    outline: 'bg-slate-400',
  }

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 tracking-wider',
    md: 'text-xs px-2.5 py-1 tracking-wider',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono font-medium uppercase rounded-sm border transition-all duration-200 select-none',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {showDot && (
        <span
          className={cn('inline-block w-1.5 h-1.5 rounded-full animate-pulse', dotColors[variant])}
        />
      )}
      {children}
    </span>
  )
}
