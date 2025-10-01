/**
 * Validation helper functions for API routes
 * Provides easy-to-use validation with Zod schemas
 */

import { NextRequest } from 'next/server';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from './toast-helper';

interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string[]>;
  message?: string;
}

/**
 * Validate request body with Zod schema
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<ValidationResult<T>> {
  try {
    const body = await request.json();
    const data = schema.parse(body);

    return {
      success: true,
      data,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors: Record<string, string[]> = {};

      error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });

      return {
        success: false,
        errors,
        message: 'Validierungsfehler: Bitte überprüfen Sie Ihre Eingaben.',
      };
    }

    if (error instanceof SyntaxError) {
      return {
        success: false,
        message: 'Ungültiges JSON-Format.',
      };
    }

    return {
      success: false,
      message: 'Ein Fehler ist bei der Validierung aufgetreten.',
    };
  }
}

/**
 * Validate query parameters with Zod schema
 */
export function validateQueryParams<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): ValidationResult<T> {
  try {
    const { searchParams } = new URL(request.url);
    const params: Record<string, string> = {};

    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const data = schema.parse(params);

    return {
      success: true,
      data,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors: Record<string, string[]> = {};

      error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });

      return {
        success: false,
        errors,
        message: 'Ungültige Query-Parameter.',
      };
    }

    return {
      success: false,
      message: 'Ein Fehler ist bei der Validierung aufgetreten.',
    };
  }
}

/**
 * Validate route parameters with Zod schema
 */
export function validateRouteParams<T>(
  params: Record<string, string>,
  schema: ZodSchema<T>
): ValidationResult<T> {
  try {
    const data = schema.parse(params);

    return {
      success: true,
      data,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors: Record<string, string[]> = {};

      error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });

      return {
        success: false,
        errors,
        message: 'Ungültige Route-Parameter.',
      };
    }

    return {
      success: false,
      message: 'Ein Fehler ist bei der Validierung aufgetreten.',
    };
  }
}

/**
 * Create a validation error for API responses
 */
export function createValidationError(
  errors: Record<string, string[]>,
  message: string = 'Validierungsfehler'
): ValidationError {
  return new ValidationError(message, errors);
}

/**
 * Format Zod errors for API response
 */
export function formatZodErrors(error: ZodError): {
  message: string;
  errors: Record<string, string[]>;
} {
  const errors: Record<string, string[]> = {};

  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(err.message);
  });

  return {
    message: 'Validierungsfehler: Bitte überprüfen Sie Ihre Eingaben.',
    errors,
  };
}

/**
 * Safe parse with custom error message
 */
export function safeParse<T>(
  schema: ZodSchema<T>,
  data: unknown,
  customMessage?: string
): ValidationResult<T> {
  try {
    const parsed = schema.parse(data);
    return {
      success: true,
      data: parsed,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      const formatted = formatZodErrors(error);
      return {
        success: false,
        errors: formatted.errors,
        message: customMessage || formatted.message,
      };
    }

    return {
      success: false,
      message: customMessage || 'Validierungsfehler',
    };
  }
}

/**
 * Middleware-style validator for API routes
 */
export function withValidation<T>(
  schema: ZodSchema<T>,
  handler: (data: T, request: NextRequest) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    const validation = await validateRequestBody(request, schema);

    if (!validation.success) {
      return Response.json(
        {
          error: validation.message,
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    return handler(validation.data!, request);
  };
}
