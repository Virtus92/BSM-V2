/**
 * Production-ready structured logging system
 * Replaces console.log statements with proper logging levels
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  requestId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isTest = process.env.NODE_ENV === 'test';

  private log(level: LogLevel, message: string, context?: LogContext) {
    // In test environment, suppress all logs
    if (this.isTest) return;

    // In production, only log warnings and errors
    if (!this.isDevelopment && (level === 'debug' || level === 'info')) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
    };

    // In development, use colored console output
    if (this.isDevelopment) {
      const colors = {
        debug: '\x1b[36m', // Cyan
        info: '\x1b[32m', // Green
        warn: '\x1b[33m', // Yellow
        error: '\x1b[31m', // Red
      };
      const reset = '\x1b[0m';

      console[level === 'debug' ? 'log' : level](
        `${colors[level]}[${level.toUpperCase()}]${reset} ${timestamp} - ${message}`,
        context ? JSON.stringify(context, null, 2) : ''
      );
    } else {
      // In production, use structured JSON logging (for log aggregation tools)
      console[level === 'debug' ? 'log' : level](JSON.stringify(logEntry));
    }
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
    };
    this.log('error', message, errorContext);
  }
}

// Singleton instance
export const logger = new Logger();

// Convenience functions for common patterns
export const logApiCall = (endpoint: string, method: string, userId?: string) => {
  logger.info(`API call: ${method} ${endpoint}`, {
    component: 'API',
    action: method,
    userId,
    metadata: { endpoint }
  });
};

export const logApiError = (endpoint: string, error: Error, context?: LogContext) => {
  logger.error(`API error: ${endpoint}`, error, {
    component: 'API',
    ...context,
    metadata: { endpoint, ...context?.metadata }
  });
};

export const logDatabaseQuery = (table: string, operation: string, userId?: string) => {
  logger.debug(`Database query: ${operation} on ${table}`, {
    component: 'Database',
    action: operation,
    userId,
    metadata: { table }
  });
};

export const logAuthEvent = (event: string, userId?: string, success: boolean = true) => {
  logger.info(`Auth event: ${event}`, {
    component: 'Auth',
    action: event,
    userId,
    metadata: { success }
  });
};
