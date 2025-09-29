'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorPage, type ErrorInfo as ErrorInfoType } from '@/components/ui/error-display';
import { createClient } from '@/lib/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorBoundaryState>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  isolate?: boolean; // Isoliert Fehler in diesem Boundary
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

// ============================================================================
// ERROR BOUNDARY CLASS COMPONENT
// ============================================================================

export class ErrorBoundary extends Component<Props, ErrorBoundaryState> {
  private retryTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Update state with error info
    this.setState({
      errorInfo
    });

    // Log to Supabase in production
    this.logErrorToSupabase(error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private async logErrorToSupabase(error: Error, errorInfo: ErrorInfo) {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from('error_logs').insert({
        error_id: this.state.errorId,
        user_id: user?.id || null,
        error_message: error.message,
        error_stack: error.stack,
        component_stack: errorInfo.componentStack,
        error_boundary: errorInfo.errorBoundary || 'ErrorBoundary',
        user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
        url: typeof window !== 'undefined' ? window.location.href : null,
        timestamp: new Date().toISOString(),
        severity: this.determineSeverity(error),
        environment: process.env.NODE_ENV || 'unknown'
      });
    } catch (logError) {
      // Fallback to console if Supabase logging fails
      console.error('Failed to log error to Supabase:', logError);
      console.error('Original error:', error, errorInfo);
    }
  }

  private determineSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    // Critical errors that break core functionality
    if (
      message.includes('network') ||
      message.includes('failed to fetch') ||
      message.includes('supabase') ||
      message.includes('auth')
    ) {
      return 'critical';
    }

    // High priority UI/UX breaking errors
    if (
      message.includes('render') ||
      message.includes('component') ||
      stack.includes('react')
    ) {
      return 'high';
    }

    // Medium priority functionality errors
    if (
      message.includes('validation') ||
      message.includes('form') ||
      message.includes('input')
    ) {
      return 'medium';
    }

    // Default to low for unknown errors
    return 'low';
  }

  private handleRetry = () => {
    // Clear the error state to retry rendering
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });

    // Optional: Add a small delay to prevent immediate re-error
    this.retryTimeoutId = window.setTimeout(() => {
      // Force a re-render by updating a non-functional state
      this.forceUpdate();
    }, 100);
  };

  private handleHome = () => {
    // Clear error state and navigate to home
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });

    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback component
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent {...this.state} />;
      }

      // Default error UI
      const errorInfo: ErrorInfoType = {
        componentStack: this.state.errorInfo?.componentStack || '',
        errorBoundary: this.state.errorInfo?.errorBoundary || 'ErrorBoundary'
      };

      return (
        <ErrorPage
          error={this.state.error || undefined}
          errorInfo={errorInfo}
          title="Unerwarteter Fehler"
          description="Es ist ein unerwarteter Fehler in der Anwendung aufgetreten. Sie können versuchen, die Seite zu aktualisieren oder zur Startseite zurückzukehren."
          showDetails={process.env.NODE_ENV === 'development' || this.props.showDetails}
          showRetry={true}
          showHome={true}
          onRetry={this.handleRetry}
          onHome={this.handleHome}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// FUNCTIONAL ERROR BOUNDARY HOOK
// ============================================================================

interface UseErrorBoundaryReturn {
  resetErrorBoundary: () => void;
  captureError: (error: Error) => void;
}

export function useErrorBoundary(): UseErrorBoundaryReturn {
  const [, setError] = React.useState<Error | null>(null);

  const resetErrorBoundary = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(() => {
      throw error;
    });
  }, []);

  return { resetErrorBoundary, captureError };
}

// ============================================================================
// SPECIALIZED ERROR BOUNDARIES
// ============================================================================

export function TaskErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Task Error:', error, errorInfo);
      }}
      fallback={({ error }) => (
        <ErrorPage
          error={error || undefined}
          title="Fehler beim Laden der Aufgaben"
          description="Die Aufgaben konnten nicht geladen werden. Bitte versuchen Sie es erneut."
          showRetry
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

export function UserErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('User Error:', error, errorInfo);
      }}
      fallback={({ error }) => (
        <ErrorPage
          error={error || undefined}
          title="Fehler beim Laden der Benutzerdaten"
          description="Die Benutzerdaten konnten nicht geladen werden. Bitte versuchen Sie es erneut."
          showRetry
          showHome
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

export function FormErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      isolate
      onError={(error, errorInfo) => {
        console.error('Form Error:', error, errorInfo);
      }}
      fallback={({ error }) => (
        <ErrorPage
          error={error || undefined}
          title="Formular-Fehler"
          description="Bei der Verarbeitung des Formulars ist ein Fehler aufgetreten."
          showRetry
          showBack
          className="min-h-0"
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

export function APIErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('API Error:', error, errorInfo);
      }}
      fallback={({ error }) => (
        <ErrorPage
          error={error || undefined}
          title="Verbindungsfehler"
          description="Die Verbindung zum Server ist fehlgeschlagen. Bitte überprüfen Sie Ihre Internetverbindung."
          showRetry
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

// ============================================================================
// ERROR BOUNDARY PROVIDER
// ============================================================================

const ErrorBoundaryContext = React.createContext<{
  reportError: (error: Error, context?: string) => void;
} | null>(null);

export function ErrorBoundaryProvider({ children }: { children: ReactNode }) {
  const reportError = React.useCallback((error: Error, context?: string) => {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`Error reported from ${context || 'unknown context'}:`, error);
    }

    // Could also send to error reporting service here
    // e.g., Sentry, LogRocket, etc.
  }, []);

  return (
    <ErrorBoundaryContext.Provider value={{ reportError }}>
      <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
        {children}
      </ErrorBoundary>
    </ErrorBoundaryContext.Provider>
  );
}

export function useErrorReporting() {
  const context = React.useContext(ErrorBoundaryContext);
  if (!context) {
    throw new Error('useErrorReporting must be used within ErrorBoundaryProvider');
  }
  return context;
}