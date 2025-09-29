import { NextResponse } from 'next/server';

// Standard API response types
export interface ApiSuccess<T = any> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    timestamp: string;
    version?: string;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    field?: string;
  };
  meta?: {
    timestamp: string;
    version?: string;
  };
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError;

// Standard error codes
export const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  INVALID_EMAIL: 'INVALID_EMAIL',

  // Resource
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',

  // Database
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

// HTTP status code mapping
const statusCodeMap: Record<string, number> = {
  [ErrorCodes.UNAUTHORIZED]: 401,
  [ErrorCodes.FORBIDDEN]: 403,
  [ErrorCodes.TOKEN_EXPIRED]: 401,
  [ErrorCodes.INVALID_CREDENTIALS]: 401,
  [ErrorCodes.VALIDATION_ERROR]: 400,
  [ErrorCodes.MISSING_REQUIRED_FIELD]: 400,
  [ErrorCodes.INVALID_FORMAT]: 400,
  [ErrorCodes.INVALID_EMAIL]: 400,
  [ErrorCodes.NOT_FOUND]: 404,
  [ErrorCodes.ALREADY_EXISTS]: 409,
  [ErrorCodes.RESOURCE_CONFLICT]: 409,
  [ErrorCodes.DATABASE_ERROR]: 500,
  [ErrorCodes.CONNECTION_ERROR]: 503,
  [ErrorCodes.INTERNAL_ERROR]: 500,
  [ErrorCodes.SERVICE_UNAVAILABLE]: 503,
  [ErrorCodes.RATE_LIMIT_EXCEEDED]: 429,
};

// Response builder functions
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  meta?: ApiSuccess<T>['meta']
): NextResponse<ApiSuccess<T>> {
  const response: ApiSuccess<T> = {
    success: true,
    data,
    message,
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0',
      ...meta,
    },
  };

  return NextResponse.json(response);
}

export function createErrorResponse(
  code: keyof typeof ErrorCodes,
  message: string,
  details?: any,
  field?: string
): NextResponse<ApiError> {
  const statusCode = statusCodeMap[code] || 500;

  const response: ApiError = {
    success: false,
    error: {
      code,
      message,
      details,
      field,
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0',
    },
  };

  return NextResponse.json(response, { status: statusCode });
}

// Convenience functions for common responses
export const ApiResponses = {
  success: <T>(data: T, message?: string) => createSuccessResponse(data, message),

  error: (code: keyof typeof ErrorCodes, message: string, details?: any) =>
    createErrorResponse(code, message, details),

  unauthorized: (message = 'Authentication required') =>
    createErrorResponse('UNAUTHORIZED', message),

  forbidden: (message = 'Access denied') =>
    createErrorResponse('FORBIDDEN', message),

  notFound: (resource = 'Resource', message?: string) =>
    createErrorResponse('NOT_FOUND', message || `${resource} not found`),

  validationError: (message: string, field?: string, details?: any) =>
    createErrorResponse('VALIDATION_ERROR', message, details, field),

  missingField: (fieldName: string) =>
    createErrorResponse('MISSING_REQUIRED_FIELD', `Missing required field: ${fieldName}`, undefined, fieldName),

  invalidEmail: (email?: string) =>
    createErrorResponse('INVALID_EMAIL', 'Invalid email format', { email }),

  alreadyExists: (resource = 'Resource', message?: string) =>
    createErrorResponse('ALREADY_EXISTS', message || `${resource} already exists`),

  databaseError: (message = 'Database operation failed', details?: any) =>
    createErrorResponse('DATABASE_ERROR', message, details),

  internalError: (message = 'Internal server error', details?: any) =>
    createErrorResponse('INTERNAL_ERROR', message, details),
};

// Pagination helper
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
) {
  const totalPages = Math.ceil(total / limit);

  return {
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

// Response type guards
export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiSuccess<T> {
  return response.success === true;
}

export function isApiError(response: ApiResponse): response is ApiError {
  return response.success === false;
}

// Validation helpers
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): string | null {
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      return field;
    }
  }
  return null;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Error handling wrapper
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<NextResponse<ApiResponse<R>>>
) {
  return async (...args: T): Promise<NextResponse<ApiResponse<R>>> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('API Error:', error);
      return ApiResponses.internalError(
        'An unexpected error occurred',
        process.env.NODE_ENV === 'development' ? error : undefined
      );
    }
  };
}