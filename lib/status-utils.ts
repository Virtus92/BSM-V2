import {
  CheckCircle,
  AlertTriangle,
  Clock,
  User,
  Building,
  Mail,
  Phone,
  Star,
  TrendingUp,
  Pause,
  Play,
  StopCircle
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export type RequestStatus = 'new' | 'in_progress' | 'responded' | 'completed' | 'cancelled';
export type CustomerStatus = 'prospect' | 'active' | 'inactive' | 'archived';
export type GeneralStatus = 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled' | 'blocked';

export interface StatusConfig {
  label: string;
  color: string;
  icon: LucideIcon;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  description?: string;
}

// ============================================================================
// REQUEST STATUS UTILITIES
// ============================================================================

export const REQUEST_STATUS_CONFIG: Record<RequestStatus, StatusConfig> = {
  new: {
    label: 'Neu',
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    icon: Mail,
    variant: 'default',
    description: 'Neue unbearbeitete Anfrage'
  },
  in_progress: {
    label: 'In Bearbeitung',
    color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    icon: Play,
    variant: 'outline',
    description: 'Anfrage wird bearbeitet'
  },
  responded: {
    label: 'Beantwortet',
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    icon: CheckCircle,
    variant: 'secondary',
    description: 'Erste Antwort gesendet'
  },
  completed: {
    label: 'Abgeschlossen',
    color: 'bg-green-500/10 text-green-500 border-green-500/20',
    icon: CheckCircle,
    variant: 'outline',
    description: 'Anfrage vollständig bearbeitet'
  },
  cancelled: {
    label: 'Abgebrochen',
    color: 'bg-red-500/10 text-red-500 border-red-500/20',
    icon: StopCircle,
    variant: 'destructive',
    description: 'Anfrage wurde abgebrochen'
  }
};

export const getRequestStatusInfo = (status: RequestStatus): StatusConfig => {
  return REQUEST_STATUS_CONFIG[status] || REQUEST_STATUS_CONFIG.new;
};

export const getRequestStatusList = (): Array<{ value: RequestStatus; label: string }> => {
  return Object.entries(REQUEST_STATUS_CONFIG).map(([value, config]) => ({
    value: value as RequestStatus,
    label: config.label
  }));
};

// ============================================================================
// CUSTOMER STATUS UTILITIES
// ============================================================================

export const CUSTOMER_STATUS_CONFIG: Record<CustomerStatus, StatusConfig> = {
  prospect: {
    label: 'Interessent',
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    icon: User,
    variant: 'default',
    description: 'Potenzieller Kunde'
  },
  active: {
    label: 'Aktiv',
    color: 'bg-green-500/10 text-green-500 border-green-500/20',
    icon: CheckCircle,
    variant: 'outline',
    description: 'Aktiver Kunde'
  },
  inactive: {
    label: 'Inaktiv',
    color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    icon: Pause,
    variant: 'outline',
    description: 'Temporär inaktiver Kunde'
  },
  archived: {
    label: 'Archiviert',
    color: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    icon: StopCircle,
    variant: 'secondary',
    description: 'Archivierter ehemaliger Kunde'
  }
};

export const getCustomerStatusInfo = (status: CustomerStatus): StatusConfig => {
  return CUSTOMER_STATUS_CONFIG[status] || CUSTOMER_STATUS_CONFIG.prospect;
};

export const getCustomerStatusList = (): Array<{ value: CustomerStatus; label: string }> => {
  return Object.entries(CUSTOMER_STATUS_CONFIG).map(([value, config]) => ({
    value: value as CustomerStatus,
    label: config.label
  }));
};

// ============================================================================
// GENERAL STATUS UTILITIES
// ============================================================================

export const GENERAL_STATUS_CONFIG: Record<GeneralStatus, StatusConfig> = {
  active: {
    label: 'Aktiv',
    color: 'bg-green-500/10 text-green-500 border-green-500/20',
    icon: CheckCircle,
    variant: 'outline',
    description: 'Aktiv und verfügbar'
  },
  inactive: {
    label: 'Inaktiv',
    color: 'bg-red-500/10 text-red-500 border-red-500/20',
    icon: StopCircle,
    variant: 'destructive',
    description: 'Inaktiv oder gesperrt'
  },
  pending: {
    label: 'Ausstehend',
    color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    icon: Clock,
    variant: 'outline',
    description: 'Wartet auf Bestätigung'
  },
  completed: {
    label: 'Abgeschlossen',
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    icon: CheckCircle,
    variant: 'default',
    description: 'Erfolgreich abgeschlossen'
  },
  cancelled: {
    label: 'Abgebrochen',
    color: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    icon: StopCircle,
    variant: 'secondary',
    description: 'Vorgang abgebrochen'
  },
  blocked: {
    label: 'Blockiert',
    color: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    icon: AlertTriangle,
    variant: 'destructive',
    description: 'Blockiert oder verhindert'
  }
};

export const getGeneralStatusInfo = (status: GeneralStatus): StatusConfig => {
  return GENERAL_STATUS_CONFIG[status] || GENERAL_STATUS_CONFIG.pending;
};

export const getGeneralStatusList = (): Array<{ value: GeneralStatus; label: string }> => {
  return Object.entries(GENERAL_STATUS_CONFIG).map(([value, config]) => ({
    value: value as GeneralStatus,
    label: config.label
  }));
};

// ============================================================================
// PRIORITY LEVELS (allgemein verwendbar)
// ============================================================================

export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

export const PRIORITY_CONFIG: Record<PriorityLevel, StatusConfig & { urgencyLevel: number }> = {
  low: {
    label: 'Niedrig',
    color: 'bg-green-500/10 text-green-500 border-green-500/20',
    icon: Clock,
    variant: 'outline',
    urgencyLevel: 1,
    description: 'Geringe Priorität'
  },
  medium: {
    label: 'Mittel',
    color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    icon: TrendingUp,
    variant: 'outline',
    urgencyLevel: 2,
    description: 'Normale Priorität'
  },
  high: {
    label: 'Hoch',
    color: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    icon: AlertTriangle,
    variant: 'destructive',
    urgencyLevel: 3,
    description: 'Hohe Priorität'
  },
  critical: {
    label: 'Kritisch',
    color: 'bg-red-600/10 text-red-600 border-red-600/20',
    icon: AlertTriangle,
    variant: 'destructive',
    urgencyLevel: 4,
    description: 'Kritische Priorität'
  }
};

export const getPriorityInfo = (priority: PriorityLevel) => {
  return PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
};

export const getPriorityList = (): Array<{ value: PriorityLevel; label: string }> => {
  return Object.entries(PRIORITY_CONFIG).map(([value, config]) => ({
    value: value as PriorityLevel,
    label: config.label
  }));
};

// ============================================================================
// STATUS TRANSITIONS
// ============================================================================

export const getValidRequestStatusTransitions = (currentStatus: RequestStatus): RequestStatus[] => {
  const transitions: Record<RequestStatus, RequestStatus[]> = {
    new: ['in_progress', 'cancelled'],
    in_progress: ['responded', 'completed', 'cancelled'],
    responded: ['completed', 'in_progress'],
    completed: [], // Endstatus
    cancelled: ['new'] // Reaktivierung möglich
  };

  return transitions[currentStatus] || [];
};

export const getValidCustomerStatusTransitions = (currentStatus: CustomerStatus): CustomerStatus[] => {
  const transitions: Record<CustomerStatus, CustomerStatus[]> = {
    prospect: ['active', 'inactive', 'archived'],
    active: ['inactive', 'archived'],
    inactive: ['active', 'archived'],
    archived: ['active'] // Reaktivierung möglich
  };

  return transitions[currentStatus] || [];
};

// ============================================================================
// STATUS ANALYTICS
// ============================================================================

export const getStatusDistribution = <T extends string>(
  items: Array<{ status: T }>,
  statusConfig: Record<T, StatusConfig>
) => {
  const distribution = items.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {} as Record<T, number>);

  return Object.entries(statusConfig).map(([status, config]) => ({
    status: status as T,
    count: distribution[status as T] || 0,
    label: config.label,
    color: config.color,
    percentage: items.length > 0 ? Math.round(((distribution[status as T] || 0) / items.length) * 100) : 0
  }));
};

export const getHighPriorityItems = <T extends { priority: PriorityLevel }>(
  items: T[],
  threshold: PriorityLevel = 'high'
): T[] => {
  const minUrgency = getPriorityInfo(threshold).urgencyLevel;
  return items.filter(item => getPriorityInfo(item.priority).urgencyLevel >= minUrgency);
};

// ============================================================================
// STATUS FORMATTING
// ============================================================================

export const formatStatusForDisplay = (status: string, type: 'request' | 'customer' | 'general' = 'general'): string => {
  let config: StatusConfig;

  switch (type) {
    case 'request':
      config = getRequestStatusInfo(status as RequestStatus);
      break;
    case 'customer':
      config = getCustomerStatusInfo(status as CustomerStatus);
      break;
    default:
      config = getGeneralStatusInfo(status as GeneralStatus);
  }

  return config.label;
};

export const getStatusColorClass = (status: string, type: 'request' | 'customer' | 'general' = 'general'): string => {
  let config: StatusConfig;

  switch (type) {
    case 'request':
      config = getRequestStatusInfo(status as RequestStatus);
      break;
    case 'customer':
      config = getCustomerStatusInfo(status as CustomerStatus);
      break;
    default:
      config = getGeneralStatusInfo(status as GeneralStatus);
  }

  return config.color;
};

// ============================================================================
// STATUS VALIDATION
// ============================================================================

export const isValidStatus = (status: string, type: 'request' | 'customer' | 'general'): boolean => {
  switch (type) {
    case 'request':
      return status in REQUEST_STATUS_CONFIG;
    case 'customer':
      return status in CUSTOMER_STATUS_CONFIG;
    case 'general':
      return status in GENERAL_STATUS_CONFIG;
    default:
      return false;
  }
};

export const isValidPriority = (priority: string): boolean => {
  return priority in PRIORITY_CONFIG;
};