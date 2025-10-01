/**
 * Toast notification helper
 * Provides consistent error and success messaging across the app
 */

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Handle API errors and display appropriate toast messages
 */
export async function handleApiError(error: unknown): Promise<ToastOptions> {
  if (error instanceof ApiError) {
    return {
      title: 'Fehler',
      description: error.message,
      variant: 'destructive'
    };
  }

  if (error instanceof ValidationError) {
    const errorMessages = error.errors
      ? Object.values(error.errors).flat().join(', ')
      : error.message;

    return {
      title: 'Validierungsfehler',
      description: errorMessages,
      variant: 'destructive'
    };
  }

  if (error instanceof Error) {
    return {
      title: 'Fehler',
      description: error.message,
      variant: 'destructive'
    };
  }

  return {
    title: 'Unbekannter Fehler',
    description: 'Ein unerwarteter Fehler ist aufgetreten.',
    variant: 'destructive'
  };
}

/**
 * Handle API response and throw appropriate errors
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      const error = await response.json();

      if (error.errors) {
        throw new ValidationError(error.message || 'Validierungsfehler', error.errors);
      }

      throw new ApiError(
        error.message || error.error || 'API-Anfrage fehlgeschlagen',
        response.status,
        error.details
      );
    }

    throw new ApiError(
      `API-Anfrage fehlgeschlagen: ${response.statusText}`,
      response.status
    );
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }

  return response.text() as Promise<T>;
}

/**
 * Common toast messages for success operations
 */
export const successMessages = {
  created: (entity: string) => ({
    title: 'Erfolgreich erstellt',
    description: `${entity} wurde erfolgreich erstellt.`,
    variant: 'default' as const
  }),
  updated: (entity: string) => ({
    title: 'Erfolgreich aktualisiert',
    description: `${entity} wurde erfolgreich aktualisiert.`,
    variant: 'default' as const
  }),
  deleted: (entity: string) => ({
    title: 'Erfolgreich gelöscht',
    description: `${entity} wurde erfolgreich gelöscht.`,
    variant: 'default' as const
  }),
  saved: () => ({
    title: 'Erfolgreich gespeichert',
    description: 'Änderungen wurden gespeichert.',
    variant: 'default' as const
  })
};

/**
 * Fetch with error handling
 */
export async function fetchWithErrorHandling<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, options);
    return await handleApiResponse<T>(response);
  } catch (error) {
    // Re-throw to be handled by the calling code
    throw error;
  }
}
