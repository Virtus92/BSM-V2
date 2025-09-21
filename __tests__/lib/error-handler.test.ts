import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import {
  errorHandler,
  ErrorCategory,
  ErrorSeverity,
  logWarning,
  logCritical,
} from '@/lib/utils/error-handler'

describe('error-handler', () => {
  const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {})
  const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('createError returns structured error object', () => {
    const err = errorHandler.createError('Test', ErrorCategory.SYSTEM, ErrorSeverity.ERROR, { operation: 'op' })
    expect(err.message).toBe('Test')
    expect(err.category).toBe(ErrorCategory.SYSTEM)
    expect(err.severity).toBe(ErrorSeverity.ERROR)
    expect(err.context.operation).toBe('op')
    expect(err.id).toMatch(/^err_\d+_/)
  })

  it('logWarning logs with WARNING severity', () => {
    logWarning('Something odd', ErrorCategory.API)
    expect(warnSpy).toHaveBeenCalled()
  })

  it('logCritical triggers critical logging', () => {
    logCritical('Bad things', ErrorCategory.SECURITY)
    // Critical paths use console.error at least once
    expect(errorSpy).toHaveBeenCalled()
  })
})

