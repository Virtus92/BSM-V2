/**
 * 🎯 Utility Formatters
 *
 * Gemeinsame Formatierungsfunktionen für konsistente Darstellung.
 */

// Currency formatting
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '€0'

  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Date formatting
export function formatDate(date: string | null | undefined): string {
  if (!date) return '-'

  return new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(date))
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return '-'

  return new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

// Percentage formatting
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}