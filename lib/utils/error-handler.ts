/**
 * 🎯 Unified Error Handling System
 *
 * Centralized error handling, logging, and monitoring for clean architecture.
 * Replaces 52+ inconsistent console.error patterns across codebase.
 */

export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATABASE = 'database',
  API = 'api',
  SECURITY = 'security',
  NETWORK = 'network',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system'
}

export interface ErrorContext {
  userId?: string
  sessionId?: string
  requestId?: string
  operation?: string
  metadata?: Record<string, string | number | boolean>
}

export interface ApplicationError {
  id: string
  message: string
  category: ErrorCategory
  severity: ErrorSeverity
  context: ErrorContext
  originalError?: Error
  timestamp: string
  stackTrace?: string
}

class ErrorHandler {
  private isDevelopment = process.env.NODE_ENV === 'development'

  /**
   * Log error with structured format and appropriate level
   */
  log(error: ApplicationError): void {
    const logData = {
      id: error.id,
      message: error.message,
      category: error.category,
      severity: error.severity,
      context: error.context,
      timestamp: error.timestamp,
      ...(this.isDevelopment && { stackTrace: error.stackTrace })
    }

    switch (error.severity) {
      case ErrorSeverity.INFO:
        console.info('📘 [INFO]', logData)
        break
      case ErrorSeverity.WARNING:
        console.warn('⚠️ [WARNING]', logData)
        break
      case ErrorSeverity.ERROR:
        console.error('❌ [ERROR]', logData)
        break
      case ErrorSeverity.CRITICAL:
        console.error('🚨 [CRITICAL]', logData)
        // In production: send to monitoring service
        if (!this.isDevelopment) {
          this.sendToMonitoring(error)
        }
        break
    }
  }

  /**
   * Create structured error from raw error or message
   */
  createError(
    message: string,
    category: ErrorCategory,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    context: ErrorContext = {},
    originalError?: Error
  ): ApplicationError {
    return {
      id: this.generateErrorId(),
      message,
      category,
      severity,
      context,
      originalError,
      timestamp: new Date().toISOString(),
      stackTrace: originalError?.stack || new Error().stack
    }
  }

  /**
   * Handle and log error in one operation
   */
  handle(
    message: string,
    category: ErrorCategory,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    context: ErrorContext = {},
    originalError?: Error
  ): ApplicationError {
    const error = this.createError(message, category, severity, context, originalError)
    this.log(error)
    return error
  }

  /**
   * Handle database errors with consistent formatting
   */
  handleDatabaseError(operation: string, originalError: Error, context: ErrorContext = {}): ApplicationError {
    return this.handle(
      `Database error during ${operation}`,
      ErrorCategory.DATABASE,
      ErrorSeverity.ERROR,
      { ...context, operation },
      originalError
    )
  }

  /**
   * Handle API errors with consistent formatting
   */
  handleApiError(endpoint: string, originalError: Error, context: ErrorContext = {}): ApplicationError {
    return this.handle(
      `API error at ${endpoint}`,
      ErrorCategory.API,
      ErrorSeverity.ERROR,
      { ...context, operation: endpoint },
      originalError
    )
  }

  /**
   * Handle validation errors
   */
  handleValidationError(field: string, message: string, context: ErrorContext = {}): ApplicationError {
    const mergedContext: ErrorContext = {
      ...context,
      metadata: { ...(context.metadata || {}), field }
    }
    return this.handle(
      `Validation error for ${field}: ${message}`,
      ErrorCategory.VALIDATION,
      ErrorSeverity.WARNING,
      mergedContext,
    )
  }

  /**
   * Handle authentication errors
   */
  handleAuthError(message: string, context: ErrorContext = {}): ApplicationError {
    return this.handle(
      message,
      ErrorCategory.AUTHENTICATION,
      ErrorSeverity.ERROR,
      context
    )
  }

  /**
   * Handle security violations
   */
  handleSecurityError(message: string, context: ErrorContext = {}): ApplicationError {
    return this.handle(
      message,
      ErrorCategory.SECURITY,
      ErrorSeverity.CRITICAL,
      context
    )
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private sendToMonitoring(error: ApplicationError): void {
    // TODO: Integrate with monitoring service (Sentry, DataDog, etc.)
    // For now, just ensure it's logged
    console.error('🚨 CRITICAL ERROR - Monitoring Required:', error)
  }
}

// Singleton instance
export const errorHandler = new ErrorHandler()

// Convenience functions for common use cases
export const logError = (message: string, category: ErrorCategory, context?: ErrorContext) =>
  errorHandler.handle(message, category, ErrorSeverity.ERROR, context)

export const logWarning = (message: string, category: ErrorCategory, context?: ErrorContext) =>
  errorHandler.handle(message, category, ErrorSeverity.WARNING, context)

export const logCritical = (message: string, category: ErrorCategory, context?: ErrorContext) =>
  errorHandler.handle(message, category, ErrorSeverity.CRITICAL, context)

// Database error helpers
export const logDatabaseError = (operation: string, error: Error, context?: ErrorContext) =>
  errorHandler.handleDatabaseError(operation, error, context)

// API error helpers
export const logApiError = (endpoint: string, error: Error, context?: ErrorContext) =>
  errorHandler.handleApiError(endpoint, error, context)

// Validation error helpers
export const logValidationError = (field: string, message: string, context?: ErrorContext) =>
  errorHandler.handleValidationError(field, message, context)

// Auth error helpers
export const logAuthError = (message: string, context?: ErrorContext) =>
  errorHandler.handleAuthError(message, context)

// Security error helpers
export const logSecurityError = (message: string, context?: ErrorContext) =>
  errorHandler.handleSecurityError(message, context)
