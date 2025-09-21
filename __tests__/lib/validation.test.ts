import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import {
  validateEmail,
  validateEmailWithError,
  validatePhone,
  validatePhoneWithError,
  validateUrl,
  validateUrlWithError,
  validateRequired,
  validateLength,
  validateEnum,
  ValidationBuilder,
  sanitizeString,
  sanitizeEmail,
} from '@/lib/utils/validation'

// Silence validation error logs
jest.mock('@/lib/utils/error-handler', () => ({
  logValidationError: jest.fn(),
}))

describe('validation utilities', () => {
  beforeEach(() => jest.clearAllMocks())

  it('validateEmail detects valid and invalid emails', () => {
    expect(validateEmail('user@example.com')).toBe(true)
    expect(validateEmail('invalid-email')).toBe(false)
  })

  it('validateEmailWithError returns helpful messages', () => {
    expect(validateEmailWithError('')).toBe('email is required')
    expect(validateEmailWithError('bad@domain')).toBe('email must be a valid email address')
    expect(validateEmailWithError('good@example.com')).toBeNull()
  })

  it('validatePhone handles international formats', () => {
    expect(validatePhone('+491234567890')).toBe(true)
    expect(validatePhone('0123456789')).toBe(false)
    expect(validatePhoneWithError('abc')).toBe('phone must be a valid phone number')
    expect(validatePhoneWithError('')).toBeNull()
  })

  it('validateUrl validates proper URLs', () => {
    expect(validateUrl('https://example.com')).toBe(true)
    expect(validateUrl('not-a-url')).toBe(false)
    expect(validateUrlWithError('https://ok.local')).toBeNull()
    expect(validateUrlWithError('bad url', 'website')).toBe('website must be a valid URL')
  })

  it('validateRequired and validateLength handle constraints', () => {
    expect(validateRequired('', 'name')).toBe('name is required')
    expect(validateRequired('  ', 'name')).toBe('name is required')
    expect(validateRequired('x', 'name')).toBeNull()

    expect(validateLength('abc', 5, 10, 'field')).toBe('field must be at least 5 characters')
    expect(validateLength('abcdefghijk', 1, 5, 'field')).toBe('field must be no more than 5 characters')
    expect(validateLength('abc', 1, 5, 'field')).toBeNull()
  })

  it('validateEnum enforces allowed values', () => {
    const values = ['a', 'b', 'c'] as const
    expect(validateEnum('a', values)).toBe(true)
    expect(validateEnum('x', values)).toBe(false)
  })

  it('ValidationBuilder composes multiple checks and aggregates errors', () => {
    const builder = new ValidationBuilder()
      .required('', 'name')
      .email('invalid', 'email')
      .phone('abc', 'phone')
      .length('x', 2, 5, 'short')
      .enum('z', ['a', 'b'] as const, 'kind')

    const result = builder.build()
    expect(result.isValid).toBe(false)
    expect(result.errors).toMatchObject({
      name: 'name is required',
      email: 'email must be a valid email address',
      phone: 'phone must be a valid phone number',
      short: 'short must be at least 2 characters',
      kind: 'kind must be one of: a, b',
    })
  })

  it('sanitizeString and sanitizeEmail normalize input', () => {
    expect(sanitizeString(undefined)).toBeNull()
    expect(sanitizeString('   ')).toBeNull()
    expect(sanitizeString('  hello  ')).toBe('hello')

    expect(sanitizeEmail('  USER@Example.com  ')).toBe('user@example.com')
    expect(sanitizeEmail(undefined)).toBeNull()
  })
})

