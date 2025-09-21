/**
 * 🎯 Unified Status Badge Component
 *
 * Wiederverwendbare Status-Badge-Komponente für konsistente
 * Darstellung von Status, Priorität und anderen Labels.
 */

import { Badge, BadgeProps } from '@/components/ui/badge'
import { getStatusConfig } from '@/lib/shared-types'
import { cn } from '@/lib/utils'

interface StatusBadgeProps extends Omit<BadgeProps, 'children'> {
  status: string
  type: 'customer' | 'contact_request' | 'priority'
  showDescription?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function StatusBadge({
  status,
  type,
  showDescription = false,
  size = 'md',
  className,
  ...props
}: StatusBadgeProps) {
  const config = getStatusConfig(status, type)

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  }

  return (
    <Badge
      className={cn(
        config.color,
        sizeClasses[size],
        'font-medium border whitespace-nowrap',
        className
      )}
      title={showDescription ? config.description : undefined}
      {...props}
    >
      {config.label}
    </Badge>
  )
}

// Spezielle Varianten für bessere DX
export function CustomerStatusBadge({ status, ...props }: Omit<StatusBadgeProps, 'type'>) {
  return <StatusBadge status={status} type="customer" {...props} />
}

export function ContactRequestStatusBadge({ status, ...props }: Omit<StatusBadgeProps, 'type'>) {
  return <StatusBadge status={status} type="contact_request" {...props} />
}

interface PriorityBadgeProps extends Omit<StatusBadgeProps, 'status' | 'type'> {
  priority: string
}

export function PriorityBadge({ priority, ...props }: PriorityBadgeProps) {
  return <StatusBadge status={priority} type="priority" {...props} />
}
