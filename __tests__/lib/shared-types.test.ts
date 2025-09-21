import { describe, it, expect } from '@jest/globals'
import {
  getStatusConfig,
  getStatusColor,
  getStatusLabel,
  isValidCustomerStatus,
  isValidContactRequestStatus,
  isValidPriority,
} from '@/lib/shared-types'

describe('shared-types helpers', () => {
  it('returns config, label and color for known statuses', () => {
    const cfg = getStatusConfig('active', 'customer')
    expect(cfg.label.toLowerCase()).toContain('aktiv')
    expect(getStatusLabel('active', 'customer')).toBe(cfg.label)
    expect(getStatusColor('active', 'customer')).toBe(cfg.color)
  })

  it('falls back gracefully for unknown status', () => {
    const cfg = getStatusConfig('unknown', 'customer')
    expect(cfg.label).toBe('unknown')
  })

  it('type guards validate enums', () => {
    expect(isValidCustomerStatus('prospect')).toBe(true)
    expect(isValidCustomerStatus('nope')).toBe(false)
    expect(isValidContactRequestStatus('new')).toBe(true)
    expect(isValidContactRequestStatus('x')).toBe(false)
    expect(isValidPriority('high')).toBe(true)
    expect(isValidPriority('zzz')).toBe(false)
  })
})

