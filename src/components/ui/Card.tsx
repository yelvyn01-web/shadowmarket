import React from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glowOnHover?: boolean
  withCornerAccents?: boolean
}

export function Card({
  className,
  glowOnHover = true,
  withCornerAccents = false,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'relative bg-slate-900/80 backdrop-blur-md border border-slate-800/90 rounded-sm p-5 transition-all duration-300',
        glowOnHover && 'hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(0,240,255,0.12)]',
        className
      )}
      {...props}
    >
      {withCornerAccents && (
        <>
          <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyan-400" />
          <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-cyan-400" />
          <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-cyan-400" />
          <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyan-400" />
        </>
      )}
      {children}
    </div>
  )
}
