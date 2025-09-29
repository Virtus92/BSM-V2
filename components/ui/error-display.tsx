'use client';

import React from 'react';
import { AlertTriangle, CheckCircle, Info, X, RefreshCw, Home, ArrowLeft, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ============================================================================
// EXISTING ERROR DISPLAY (PRESERVED)
// ============================================================================

interface ErrorDisplayProps {
  type?: 'error' | 'success' | 'warning' | 'info';
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

export function ErrorDisplay({
  type = 'error',
  title,
  message,
  onClose,
  className
}: ErrorDisplayProps) {
  const styles = {
    error: {
      container: 'bg-red-500/10 border-red-500/20 text-red-500',
      icon: 'text-red-500',
      IconComponent: AlertTriangle
    },
    success: {
      container: 'bg-green-500/10 border-green-500/20 text-green-500',
      icon: 'text-green-500',
      IconComponent: CheckCircle
    },
    warning: {
      container: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500',
      icon: 'text-yellow-500',
      IconComponent: AlertTriangle
    },
    info: {
      container: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
      icon: 'text-blue-500',
      IconComponent: Info
    }
  };

  const style = styles[type];
  const IconComponent = style.IconComponent;

  return (
    <div className={cn(
      'modern-card border p-4',
      style.container,
      className
    )}>
      <div className="flex items-start gap-3">
        <div className={cn('w-5 h-5 mt-0.5 flex-shrink-0', style.icon)}>
          <IconComponent className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="font-medium mb-1">{title}</h4>
          )}
          <p className="text-sm opacity-90">{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-5 h-5 flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// NEW EXTENDED ERROR COMPONENTS
// ============================================================================

export interface ErrorInfo {
  componentStack: string;
  errorBoundary: string;
}

export interface ErrorPageProps {
  error?: Error;
  errorInfo?: ErrorInfo;
  title?: string;
  description?: string;
  showDetails?: boolean;
  showRetry?: boolean;
  showHome?: boolean;
  showBack?: boolean;
  onRetry?: () => void;
  onHome?: () => void;
  onBack?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function ErrorPage({
  error,
  errorInfo,
  title = 'Etwas ist schiefgelaufen',
  description = 'Es ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es erneut.',
  showDetails = false,
  showRetry = true,
  showHome = false,
  showBack = false,
  onRetry,
  onHome,
  onBack,
  className = '',
  children
}: ErrorPageProps) {
  const [showErrorDetails, setShowErrorDetails] = React.useState(false);

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const handleHome = () => {
    if (onHome) {
      onHome();
    } else {
      window.location.href = '/';
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  return (
    <div className={`flex items-center justify-center min-h-[400px] p-4 ${className}`}>
      <Card className="max-w-2xl w-full mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-red-100 dark:bg-red-900/20 rounded-full w-fit">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl font-semibold text-red-800 dark:text-red-200">
            {title}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Custom Children Content */}
          {children}

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-3">
            {showRetry && (
              <Button onClick={handleRetry} className="min-w-[120px]">
                <RefreshCw className="w-4 h-4 mr-2" />
                Erneut versuchen
              </Button>
            )}

            {showBack && (
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zurück
              </Button>
            )}

            {showHome && (
              <Button variant="outline" onClick={handleHome}>
                <Home className="w-4 h-4 mr-2" />
                Zur Startseite
              </Button>
            )}
          </div>

          {/* Error Details (Development/Debug) */}
          {showDetails && (error || errorInfo) && (
            <div className="mt-6 border-t pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowErrorDetails(!showErrorDetails)}
                className="text-sm text-gray-600 dark:text-gray-400 mb-3"
              >
                <Bug className="w-4 h-4 mr-2" />
                {showErrorDetails ? 'Details ausblenden' : 'Technische Details anzeigen'}
              </Button>

              {showErrorDetails && (
                <div className="space-y-3">
                  {error && (
                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                      <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">
                        Fehlermeldung:
                      </h4>
                      <pre className="text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap overflow-auto">
                        {error.message}
                      </pre>
                    </div>
                  )}

                  {error?.stack && (
                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                      <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">
                        Stack Trace:
                      </h4>
                      <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap overflow-auto max-h-40">
                        {error.stack}
                      </pre>
                    </div>
                  )}

                  {errorInfo?.componentStack && (
                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                      <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">
                        Komponenten Stack:
                      </h4>
                      <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap overflow-auto max-h-40">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// SPECIFIC ERROR COMPONENTS
// ============================================================================

export function NetworkErrorDisplay({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorPage
      title="Verbindungsfehler"
      description="Die Verbindung zum Server ist fehlgeschlagen. Überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut."
      onRetry={onRetry}
      showRetry
    />
  );
}

export function NotFoundDisplay({ onHome, onBack }: { onHome?: () => void; onBack?: () => void }) {
  return (
    <ErrorPage
      title="Seite nicht gefunden"
      description="Die angeforderte Seite konnte nicht gefunden werden. Sie wurde möglicherweise verschoben oder gelöscht."
      onHome={onHome}
      onBack={onBack}
      showHome
      showBack
      showRetry={false}
    />
  );
}

export function UnauthorizedDisplay({ onHome }: { onHome?: () => void }) {
  return (
    <ErrorPage
      title="Zugriff verweigert"
      description="Sie haben keine Berechtigung, diese Seite zu besuchen. Bitte melden Sie sich an oder wenden Sie sich an Ihren Administrator."
      onHome={onHome}
      showHome
      showRetry={false}
    />
  );
}

export function ServerErrorDisplay({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorPage
      title="Serverfehler"
      description="Ein interner Serverfehler ist aufgetreten. Unsere Techniker wurden benachrichtigt. Bitte versuchen Sie es später erneut."
      onRetry={onRetry}
      showRetry
    />
  );
}

export function ValidationErrorDisplay({
  errors,
  onBack
}: {
  errors: string[];
  onBack?: () => void;
}) {
  return (
    <ErrorPage
      title="Eingabefehler"
      description="Ihre Eingabe enthält Fehler. Bitte korrigieren Sie die folgenden Probleme:"
      showRetry={false}
      showBack
      onBack={onBack}
      className="min-h-0"
    >
      <div className="mt-4 space-y-2">
        {errors.map((error, index) => (
          <div key={index} className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ))}
      </div>
    </ErrorPage>
  );
}

export function LoadingErrorDisplay({
  resource = 'Daten',
  onRetry
}: {
  resource?: string;
  onRetry?: () => void;
}) {
  return (
    <ErrorPage
      title={`${resource} konnten nicht geladen werden`}
      description={`Beim Laden der ${resource.toLowerCase()} ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.`}
      onRetry={onRetry}
      showRetry
      className="min-h-0"
    />
  );
}