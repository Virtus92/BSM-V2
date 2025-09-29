'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

// Import unified utilities
import {
  getStatusInfo as getTaskStatusInfo,
  getPriorityInfo
} from '@/lib/task-utils';

import {
  getRequestStatusInfo,
  getCustomerStatusInfo,
  getGeneralStatusInfo
} from '@/lib/status-utils';

import {
  getUserRoleInfo
} from '@/lib/user-utils';

// ============================================================================
// TYPES
// ============================================================================

export interface StatusBadgeProps {
  status: string;
  type?: 'task' | 'priority' | 'request' | 'customer' | 'user' | 'role' | 'general';
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  size?: 'sm' | 'default' | 'lg';
  showIcon?: boolean;
  className?: string;
  customConfig?: {
    label: string;
    color: string;
    icon?: LucideIcon;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
}

// ============================================================================
// LEGACY STATUS CONFIGURATIONS (PRESERVED FOR BACKWARDS COMPATIBILITY)
// ============================================================================

export interface StatusConfig {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className: string;
}

// Legacy configurations - maintained for backwards compatibility
export const taskStatusMap: Record<string, StatusConfig> = {
  todo: {
    label: 'Offen',
    variant: 'outline',
    className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
  },
  pending: {
    label: 'Ausstehend',
    variant: 'outline',
    className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
  },
  in_progress: {
    label: 'In Bearbeitung',
    variant: 'secondary',
    className: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
  },
  review: {
    label: 'Review',
    variant: 'outline',
    className: 'bg-purple-500/10 text-purple-500 border-purple-500/20'
  },
  completed: {
    label: 'Abgeschlossen',
    variant: 'default',
    className: 'bg-green-500/10 text-green-500 border-green-500/20'
  },
  done: {
    label: 'Fertig',
    variant: 'default',
    className: 'bg-green-500/10 text-green-500 border-green-500/20'
  },
  cancelled: {
    label: 'Abgebrochen',
    variant: 'destructive',
    className: 'bg-red-500/10 text-red-500 border-red-500/20'
  },
  blocked: {
    label: 'Blockiert',
    variant: 'destructive',
    className: 'bg-orange-500/10 text-orange-500 border-orange-500/20'
  }
};

export const priorityStatusMap: Record<string, StatusConfig> = {
  low: {
    label: 'Niedrig',
    variant: 'outline',
    className: 'bg-green-500/10 text-green-500 border-green-500/20'
  },
  medium: {
    label: 'Mittel',
    variant: 'outline',
    className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
  },
  high: {
    label: 'Hoch',
    variant: 'default',
    className: 'bg-orange-500/10 text-orange-500 border-orange-500/20'
  },
  urgent: {
    label: 'Dringend',
    variant: 'destructive',
    className: 'bg-red-600/10 text-red-600 border-red-600/20'
  }
};

export const requestStatusMap: Record<string, StatusConfig> = {
  new: {
    label: 'Neu',
    variant: 'outline',
    className: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
  },
  pending: {
    label: 'Ausstehend',
    variant: 'outline',
    className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
  },
  in_progress: {
    label: 'In Bearbeitung',
    variant: 'secondary',
    className: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
  },
  responded: {
    label: 'Beantwortet',
    variant: 'default',
    className: 'bg-green-500/10 text-green-500 border-green-500/20'
  },
  completed: {
    label: 'Erledigt',
    variant: 'default',
    className: 'bg-green-500/10 text-green-500 border-green-500/20'
  },
  closed: {
    label: 'Geschlossen',
    variant: 'outline',
    className: 'bg-gray-500/10 text-gray-500 border-gray-500/20'
  }
};

export const userTypeMap: Record<string, StatusConfig> = {
  admin: {
    label: 'Administrator',
    variant: 'destructive',
    className: 'bg-red-500/10 text-red-500 border-red-500/20'
  },
  employee: {
    label: 'Mitarbeiter',
    variant: 'default',
    className: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
  },
  customer: {
    label: 'Kunde',
    variant: 'secondary',
    className: 'bg-green-500/10 text-green-500 border-green-500/20'
  }
};

// ============================================================================
// ENHANCED STATUS BADGE COMPONENT
// ============================================================================

export function StatusBadge({
  status,
  type = 'general',
  variant,
  size = 'default',
  showIcon = true,
  className,
  customConfig
}: StatusBadgeProps) {
  // Use custom config if provided
  if (customConfig) {
    const Icon = customConfig.icon;
    return (
      <Badge
        variant={variant || customConfig.variant || 'outline'}
        className={cn(
          customConfig.color,
          size === 'sm' && 'text-xs h-5 px-2',
          size === 'lg' && 'text-sm h-7 px-3',
          className
        )}
      >
        {showIcon && Icon && <Icon className={cn(
          'mr-1 flex-shrink-0',
          size === 'sm' && 'w-3 h-3',
          size === 'default' && 'w-3 h-3',
          size === 'lg' && 'w-4 h-4'
        )} />}
        {customConfig.label}
      </Badge>
    );
  }

  // Get status configuration based on type using new unified utilities
  let config;
  try {
    switch (type) {
      case 'task':
        config = getTaskStatusInfo(status as any);
        break;
      case 'priority':
        config = getPriorityInfo(status as any);
        break;
      case 'request':
        config = getRequestStatusInfo(status as any);
        break;
      case 'customer':
        config = getCustomerStatusInfo(status as any);
        break;
      case 'user':
        config = getGeneralStatusInfo(status as any);
        break;
      case 'role':
        config = getUserRoleInfo(status);
        break;
      case 'general':
      default:
        config = getGeneralStatusInfo(status as any);
        break;
    }
  } catch (error) {
    // Fallback for unknown status
    config = {
      label: status,
      color: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
      variant: 'outline' as const
    };
  }

  const Icon = 'icon' in config ? config.icon : null;
  const finalVariant = variant || config.variant || 'outline';

  return (
    <Badge
      variant={finalVariant}
      className={cn(
        config.color || config.className, // Support both new and legacy formats
        size === 'sm' && 'text-xs h-5 px-2',
        size === 'lg' && 'text-sm h-7 px-3',
        className
      )}
    >
      {showIcon && Icon && <Icon className={cn(
        'mr-1 flex-shrink-0',
        size === 'sm' && 'w-3 h-3',
        size === 'default' && 'w-3 h-3',
        size === 'lg' && 'w-4 h-4'
      )} />}
      {config.label}
    </Badge>
  );
}

// ============================================================================
// LEGACY COMPATIBILITY - PRESERVED EXISTING API
// ============================================================================

interface LegacyStatusBadgeProps {
  status: string;
  type: 'task' | 'priority' | 'request' | 'user';
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

export function LegacyStatusBadge({
  status,
  type,
  className = '',
  size = 'default'
}: LegacyStatusBadgeProps) {
  const getStatusMap = () => {
    switch (type) {
      case 'task':
        return taskStatusMap;
      case 'priority':
        return priorityStatusMap;
      case 'request':
        return requestStatusMap;
      case 'user':
        return userTypeMap;
      default:
        return taskStatusMap;
    }
  };

  const statusMap = getStatusMap();
  const config = statusMap[status] || statusMap.pending || {
    label: status,
    variant: 'outline' as const,
    className: 'bg-gray-500/10 text-gray-500 border-gray-500/20'
  };

  const sizeClasses = {
    sm: 'text-xs',
    default: 'text-sm',
    lg: 'text-base'
  };

  return (
    <Badge
      variant={config.variant}
      className={cn(
        config.className,
        sizeClasses[size],
        className
      )}
    >
      {config.label}
    </Badge>
  );
}

// ============================================================================
// SPECIALIZED STATUS BADGES
// ============================================================================

export function TaskStatusBadge({
  status,
  size = 'default',
  showIcon = true,
  className
}: Omit<StatusBadgeProps, 'type'>) {
  return (
    <StatusBadge
      status={status}
      type="task"
      size={size}
      showIcon={showIcon}
      className={className}
    />
  );
}

export function PriorityBadge({
  status,
  size = 'default',
  showIcon = true,
  className
}: Omit<StatusBadgeProps, 'type'>) {
  return (
    <StatusBadge
      status={status}
      type="priority"
      size={size}
      showIcon={showIcon}
      className={className}
    />
  );
}

export function RequestStatusBadge({
  status,
  size = 'default',
  showIcon = true,
  className
}: Omit<StatusBadgeProps, 'type'>) {
  return (
    <StatusBadge
      status={status}
      type="request"
      size={size}
      showIcon={showIcon}
      className={className}
    />
  );
}

export function CustomerStatusBadge({
  status,
  size = 'default',
  showIcon = true,
  className
}: Omit<StatusBadgeProps, 'type'>) {
  return (
    <StatusBadge
      status={status}
      type="customer"
      size={size}
      showIcon={showIcon}
      className={className}
    />
  );
}

export function UserTypeBadge({
  status,
  size = 'default',
  showIcon = true,
  className
}: Omit<StatusBadgeProps, 'type'>) {
  return (
    <StatusBadge
      status={status}
      type="role"
      size={size}
      showIcon={showIcon}
      className={className}
    />
  );
}

export function UserStatusBadge({
  status,
  size = 'default',
  showIcon = true,
  className
}: Omit<StatusBadgeProps, 'type'>) {
  return (
    <StatusBadge
      status={status}
      type="user"
      size={size}
      showIcon={showIcon}
      className={className}
    />
  );
}

// ============================================================================
// COMBINED STATUS AND PRIORITY COMPONENT
// ============================================================================

export interface StatusPriorityBadgeProps {
  status: string;
  priority?: string;
  type?: 'task' | 'request' | 'customer' | 'user' | 'general';
  size?: 'sm' | 'default' | 'lg';
  showIcons?: boolean;
  className?: string;
  layout?: 'horizontal' | 'vertical';
}

export function StatusPriorityBadge({
  status,
  priority,
  type = 'general',
  size = 'default',
  showIcons = true,
  className,
  layout = 'horizontal'
}: StatusPriorityBadgeProps) {
  const containerClass = cn(
    'flex gap-2',
    layout === 'vertical' && 'flex-col',
    className
  );

  return (
    <div className={containerClass}>
      <StatusBadge
        status={status}
        type={type}
        size={size}
        showIcon={showIcons}
      />
      {priority && (
        <PriorityBadge
          status={priority}
          size={size}
          showIcon={showIcons}
        />
      )}
    </div>
  );
}