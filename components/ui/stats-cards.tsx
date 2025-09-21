/**
 * 🎯 Unified Statistics Cards Component
 *
 * Wiederverwendbare Statistik-Karten für konsistente
 * Darstellung von Metriken und KPIs.
 */

import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  iconColor?: string
  trend?: {
    value: number
    label: string
    isPositive?: boolean
  }
  className?: string
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor = 'text-blue-400',
  trend,
  className
}: StatCardProps) {
  const formattedValue = typeof value === 'number' ? value.toLocaleString('de-DE') : value

  return (
    <Card className={cn('modern-card', className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            iconColor.includes('blue') && 'bg-blue-500/20',
            iconColor.includes('green') && 'bg-green-500/20',
            iconColor.includes('yellow') && 'bg-yellow-500/20',
            iconColor.includes('red') && 'bg-red-500/20',
            iconColor.includes('purple') && 'bg-purple-500/20',
            iconColor.includes('orange') && 'bg-orange-500/20',
            iconColor.includes('gray') && 'bg-gray-500/20'
          )}>
            <Icon className={cn('w-5 h-5', iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground truncate">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-foreground">{formattedValue}</p>
              {trend && (
                <span className={cn(
                  'text-xs font-medium',
                  trend.isPositive === true ? 'text-green-500' :
                  trend.isPositive === false ? 'text-red-500' : 'text-muted-foreground'
                )}>
                  {trend.isPositive === true && '+'}
                  {trend.value}% {trend.label}
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground truncate mt-1">{description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface StatsGridProps {
  children: React.ReactNode
  columns?: 2 | 3 | 4 | 5
  className?: string
}

export function StatsGrid({ children, columns = 4, className }: StatsGridProps) {
  const gridClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5'
  }

  return (
    <div className={cn('grid gap-4', gridClasses[columns], className)}>
      {children}
    </div>
  )
}

// Helper für Currency-Formatierung
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '€0'

  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Helper für Percentage-Formatierung
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}