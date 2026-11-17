import { describe, it, expect } from 'vitest'
import { formatPriceTHB, cn } from './utils'

describe('Application Utilities', () => {
  it('formats THB price with Thai currency symbol and thousands separator', () => {
    expect(formatPriceTHB(1290)).toBe('฿1,290')
    expect(formatPriceTHB(0)).toBe('฿0')
    expect(formatPriceTHB(15500.5)).toBe('฿15,501') // Math.round to 0 decimals for THB display
  })

  it('merges Tailwind CSS classes cleanly without collisions', () => {
    const merged = cn('px-4 py-2 text-white', 'px-6 text-cyan-400')
    expect(merged).toContain('px-6')
    expect(merged).not.toContain('px-4')
    expect(merged).toContain('text-cyan-400')
    expect(merged).not.toContain('text-white')
  })
})
