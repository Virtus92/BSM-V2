import { describe, it, expect } from '@jest/globals'
import { formatCurrency, formatDate, formatDateTime, formatPercentage } from '@/lib/utils/formatters'

// Helper to normalize NBSP across environments
const normalize = (s: string) => s.replace(/\u00A0/g, ' ')

describe('formatters', () => {
  it('formatCurrency handles nullish amounts', () => {
    expect(formatCurrency(undefined)).toBe('€0')
    expect(formatCurrency(null)).toBe('€0')
  })

  it('formatCurrency formats numbers in de-DE with EUR', () => {
    expect(normalize(formatCurrency(0))).toBe('0 €')
    expect(normalize(formatCurrency(1000))).toBe('1.000 €')
  })

  it('formatDate returns dash for falsy values', () => {
    expect(formatDate('')).toBe('-')
    expect(formatDate(undefined)).toBe('-')
    expect(formatDate(null)).toBe('-')
  })

  it('formatDate returns localized date string', () => {
    const out = formatDate('2023-01-02T10:20:30Z')
    expect(out).toMatch(/^\d{2}\.\d{2}\.\d{4}$/)
  })

  it('formatDateTime returns localized date-time string', () => {
    const out = formatDateTime('2023-01-02T10:20:30Z')
    expect(out).toMatch(/^\d{2}\.\d{2}\.\d{4},?\s\d{2}:\d{2}$/)
  })

  it('formatPercentage formats with default and custom decimals', () => {
    expect(formatPercentage(12.345)).toBe('12.3%')
    expect(formatPercentage(12.345, 2)).toBe('12.35%')
  })
})

