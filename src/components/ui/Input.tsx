import React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
}

export function Input({
  className,
  label,
  error,
  helperText,
  leftIcon,
  id,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 text-slate-400 pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            'w-full bg-slate-950/80 text-slate-100 placeholder:text-slate-500 border border-slate-700/80 rounded-sm px-3.5 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400',
            leftIcon && 'pl-10',
            error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-rose-400 font-mono">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-slate-400 font-mono">{helperText}</p>
      )}
    </div>
  )
}
