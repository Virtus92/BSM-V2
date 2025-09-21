/**
 * 🎯 Centralized Validation Utilities
 *
 * Replaces 5+ duplicate inline validation patterns with clean, reusable utilities.
 * Single source of truth for all validation logic.
 */

import { logValidationError } from './error-handler'

// === Email Validation ===
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const validateEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email)
}

export const validateEmailWithError = (email: string, fieldName = 'email'): string | null => {
  if (!email) {
    return `${fieldName} is required`
  }
  if (!validateEmail(email)) {
    logValidationError(fieldName, 'Invalid email format', { metadata: { value: email } })
    return `${fieldName} must be a valid email address`
  }
  return null
}

// === Phone Validation ===
const PHONE_REGEX = /^[\+]?[1-9][\d]{0,15}$/

export const validatePhone = (phone: string): boolean => {
  return PHONE_REGEX.test(phone.replace(/[\s\-\(\)]/g, ''))
}

export const validatePhoneWithError = (phone: string, fieldName = 'phone'): string | null => {
  if (!phone) return null // Phone is optional
  if (!validatePhone(phone)) {
    logValidationError(fieldName, 'Invalid phone format', { metadata: { value: phone } })
    return `${fieldName} must be a valid phone number`
  }
  return null
}

// === URL Validation ===
export const validateUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export const validateUrlWithError = (url: string, fieldName = 'url'): string | null => {
  if (!url) return null // URL is optional
  if (!validateUrl(url)) {
    logValidationError(fieldName, 'Invalid URL format', { metadata: { value: url } })
    return `${fieldName} must be a valid URL`
  }
  return null
}

// === String Validation ===
export const validateRequired = (value: string | null | undefined, fieldName: string): string | null => {
  if (!value || value.trim().length === 0) {
    logValidationError(fieldName, 'Required field is empty')
    return `${fieldName} is required`
  }
  return null
}

export const validateLength = (
  value: string,
  min: number,
  max: number,
  fieldName: string
): string | null => {
  if (value.length < min) {
    logValidationError(fieldName, `Too short (${value.length} < ${min})`, { metadata: { value, min, max } })
    return `${fieldName} must be at least ${min} characters`
  }
  if (value.length > max) {
    logValidationError(fieldName, `Too long (${value.length} > ${max})`, { metadata: { value, min, max } })
    return `${fieldName} must be no more than ${max} characters`
  }
  return null
}

// === Enum Validation ===
export const validateEnum = <T extends string>(
  value: string,
  validValues: readonly T[],
): value is T => {
  return validValues.includes(value as T)
}

export const validateEnumWithError = <T extends string>(
  value: string,
  validValues: readonly T[],
  fieldName: string
): string | null => {
  if (!validateEnum(value, validValues)) {
    logValidationError(fieldName, 'Invalid enum value', { metadata: { value, validValues: validValues.join(', ') } })
    return `${fieldName} must be one of: ${validValues.join(', ')}`
  }
  return null
}

// === Composite Validators ===
export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export class ValidationBuilder {
  private errors: Record<string, string> = {}

  required(value: string | null | undefined, fieldName: string): this {
    const error = validateRequired(value, fieldName)
    if (error) this.errors[fieldName] = error
    return this
  }

  email(value: string, fieldName = 'email'): this {
    if (value) { // Only validate if provided
      const error = validateEmailWithError(value, fieldName)
      if (error) this.errors[fieldName] = error
    }
    return this
  }

  phone(value: string, fieldName = 'phone'): this {
    if (value) { // Only validate if provided
      const error = validatePhoneWithError(value, fieldName)
      if (error) this.errors[fieldName] = error
    }
    return this
  }

  url(value: string, fieldName = 'url'): this {
    if (value) { // Only validate if provided
      const error = validateUrlWithError(value, fieldName)
      if (error) this.errors[fieldName] = error
    }
    return this
  }

  length(value: string, min: number, max: number, fieldName: string): this {
    if (value) { // Only validate if provided
      const error = validateLength(value, min, max, fieldName)
      if (error) this.errors[fieldName] = error
    }
    return this
  }

  enum<T extends string>(value: string, validValues: readonly T[], fieldName: string): this {
    if (value) { // Only validate if provided
      const error = validateEnumWithError(value, validValues, fieldName)
      if (error) this.errors[fieldName] = error
    }
    return this
  }

  custom(value: unknown, validator: (value: unknown) => string | null, fieldName: string): this {
    if (value !== null && value !== undefined) {
      const error = validator(value)
      if (error) this.errors[fieldName] = error
    }
    return this
  }

  build(): ValidationResult {
    return {
      isValid: Object.keys(this.errors).length === 0,
      errors: this.errors
    }
  }
}

// === Utility Functions ===
export const createValidator = () => new ValidationBuilder()

export const sanitizeString = (value: string | null | undefined): string | null => {
  if (!value) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export const sanitizeEmail = (email: string | null | undefined): string | null => {
  const sanitized = sanitizeString(email)
  return sanitized ? sanitized.toLowerCase() : null
}
