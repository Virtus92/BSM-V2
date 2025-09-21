import { describe, it, expect } from '@jest/globals'
import { cn, hasEnvVars } from '@/lib/utils'

describe('utils.ts', () => {
  it('cn merges class names and resolves Tailwind conflicts', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
    expect(cn('text-left', 'md:text-left', 'md:text-center')).toBe('text-left md:text-center')
    expect(cn('hover:bg-red-500', 'hover:bg-blue-500')).toBe('hover:bg-blue-500')
  })

  it('hasEnvVars reflects configured environment variables', () => {
    expect(Boolean(hasEnvVars)).toBe(true)
  })
})

