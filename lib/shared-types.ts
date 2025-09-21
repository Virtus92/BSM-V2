/**
 * 🎯 Unified Type System for BSM-V2
 *
 * Zentrale Definition aller Typen und Enums für konsistente
 * Verwendung zwischen CRM und Anfragenverwaltung.
 *
 * ⚠️ WICHTIG: Diese Datei ist die Single Source of Truth!
 */

import { Database, Tables, TablesInsert, TablesUpdate } from './database.types'

// === Core Entity Types ===
export type Customer = Tables<'customers'>
export type ContactRequest = Tables<'contact_requests'>
export type ContactRequestNote = Tables<'contact_request_notes'>
export type UserProfile = Tables<'user_profiles'>
export type CustomerNote = Tables<'customer_notes'>

// === N8N Workflow Types ===
export type WorkflowRegistry = Tables<'workflow_registry'>
export type WorkflowExecution = Tables<'workflow_executions'>
export type CustomerAutomationSettings = Tables<'customer_automation_settings'>
export type WorkflowTemplate = Tables<'workflow_templates'>

// === Insert/Update Types ===
export type CustomerInsert = TablesInsert<'customers'>
export type CustomerUpdate = TablesUpdate<'customers'>
export type ContactRequestInsert = TablesInsert<'contact_requests'>
export type ContactRequestUpdate = TablesUpdate<'contact_requests'>

// === Enum Types (Database Single Source of Truth) ===
export type CustomerStatus = Database['public']['Enums']['customer_status'] // "prospect" | "active" | "inactive" | "archived"
export type PriorityLevel = Database['public']['Enums']['priority_level']   // "low" | "medium" | "high" | "critical"
// user_type is not a DB enum; model as union
export type UserType = 'admin' | 'customer'

// === Contact Request Status (Not in DB Enum - String Based) ===
export type ContactRequestStatus = 'new' | 'in_progress' | 'responded' | 'converted' | 'archived'

// === Extended Types with Relations ===
export interface CustomerWithStats extends Customer {
  _stats?: {
    projectCount: number
    totalRevenue: number
    lastActivity: string | null
  }
}

export interface ContactRequestWithRelations extends ContactRequest {
  converted_customer?: Pick<Customer, 'id' | 'email' | 'company_name' | 'contact_person'> | null
  assigned_user?: Pick<UserProfile, 'id' | 'first_name' | 'last_name'> | null
  notes?: ContactRequestNote[]
}

// === Status Configuration ===
export const STATUS_CONFIG = {
  customer: {
    prospect: {
      label: 'Lead',
      color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      description: 'Potentieller Kunde'
    },
    active: {
      label: 'Aktiv',
      color: 'bg-green-500/10 text-green-500 border-green-500/20',
      description: 'Aktiver Kunde'
    },
    inactive: {
      label: 'Inaktiv',
      color: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
      description: 'Inaktiver Kunde'
    },
    archived: {
      label: 'Archiviert',
      color: 'bg-red-500/10 text-red-500 border-red-500/20',
      description: 'Archivierter Kunde'
    }
  },
  contact_request: {
    new: {
      label: 'Neu',
      color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      description: 'Neue Anfrage'
    },
    in_progress: {
      label: 'In Bearbeitung',
      color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      description: 'Wird bearbeitet'
    },
    responded: {
      label: 'Beantwortet',
      color: 'bg-green-500/10 text-green-500 border-green-500/20',
      description: 'Antwort gesendet'
    },
    converted: {
      label: 'Konvertiert',
      color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      description: 'Zu Kunde konvertiert'
    },
    archived: {
      label: 'Archiviert',
      color: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
      description: 'Archivierte Anfrage'
    }
  },
  priority: {
    low: {
      label: 'Niedrig',
      color: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
      description: 'Niedrige Priorität'
    },
    medium: {
      label: 'Mittel',
      color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      description: 'Normale Priorität'
    },
    high: {
      label: 'Hoch',
      color: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      description: 'Hohe Priorität'
    },
    critical: {
      label: 'Kritisch',
      color: 'bg-red-500/10 text-red-500 border-red-500/20',
      description: 'Kritische Priorität'
    }
  },
  quote: {
    draft: {
      label: 'Entwurf',
      color: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
      description: 'Angebot in Vorbereitung'
    },
    sent: {
      label: 'Versendet',
      color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      description: 'Angebot versendet'
    },
    accepted: {
      label: 'Angenommen',
      color: 'bg-green-500/10 text-green-500 border-green-500/20',
      description: 'Angebot angenommen'
    },
    rejected: {
      label: 'Abgelehnt',
      color: 'bg-red-500/10 text-red-500 border-red-500/20',
      description: 'Angebot abgelehnt'
    },
    expired: {
      label: 'Abgelaufen',
      color: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      description: 'Angebot abgelaufen'
    }
  },
  contract: {
    draft: {
      label: 'Entwurf',
      color: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
      description: 'Vertrag in Vorbereitung'
    },
    active: {
      label: 'Aktiv',
      color: 'bg-green-500/10 text-green-500 border-green-500/20',
      description: 'Aktiver Vertrag'
    },
    expired: {
      label: 'Abgelaufen',
      color: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      description: 'Vertrag abgelaufen'
    },
    terminated: {
      label: 'Gekündigt',
      color: 'bg-red-500/10 text-red-500 border-red-500/20',
      description: 'Vertrag gekündigt'
    }
  },
  project: {
    planning: {
      label: 'Planung',
      color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      description: 'Projekt in Planung'
    },
    active: {
      label: 'Aktiv',
      color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      description: 'Aktives Projekt'
    },
    on_hold: {
      label: 'Pausiert',
      color: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      description: 'Projekt pausiert'
    },
    completed: {
      label: 'Abgeschlossen',
      color: 'bg-green-500/10 text-green-500 border-green-500/20',
      description: 'Projekt abgeschlossen'
    },
    cancelled: {
      label: 'Abgebrochen',
      color: 'bg-red-500/10 text-red-500 border-red-500/20',
      description: 'Projekt abgebrochen'
    }
  }
} as const

// === API Response Types ===
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  pagination?: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

// === Filter Types ===
export interface CustomerFilters {
  search?: string
  status?: CustomerStatus | 'all'
  priority?: PriorityLevel | 'all'
  industry?: string
  assignedTo?: string
}

export interface ContactRequestFilters {
  search?: string
  status?: ContactRequestStatus | 'all'
  priority?: PriorityLevel | 'all'
  source?: string
  assignedTo?: string
}

// === Statistics Types ===
export interface CustomerStats {
  total: number
  lead: number
  active: number
  inactive: number
  archived: number
  totalRevenue: number
  averageRevenue: number
}

export interface ContactRequestStats {
  total: number
  new: number
  inProgress: number
  responded: number
  converted: number
  conversionRate: number
}

// === Form Data Types ===
export interface CustomerFormData {
  name: string
  email: string
  company: string
  phone: string
  website: string
  street: string
  city: string
  postal_code: string
  country: string
  industry: string
  status: CustomerStatus
  notes: string
  tags: string[]
}

export interface ContactRequestFormData {
  name: string
  email: string
  company?: string
  phone?: string
  subject: string
  message: string
  source: string
  priority: PriorityLevel
}

// === Activity System Types ===
export type ActivityType =
  | 'customer_created' | 'customer_updated' | 'customer_deleted'
  | 'request_received' | 'request_updated' | 'request_converted' | 'request_responded'
  | 'workflow_executed' | 'workflow_failed'
  | 'user_login' | 'user_logout'
  | 'system_event'

export interface Activity {
  id: string
  created_at: string
  type: ActivityType
  description: string
  user_id: string | null
  user_name?: string
  entity_type?: 'customer' | 'contact_request' | 'workflow' | 'user' | 'system'
  entity_id?: string
  metadata?: Record<string, unknown>
  ip_address?: string | null
  user_agent?: string | null
}

export interface ActivityInsert {
  id?: string
  created_at?: string
  type: ActivityType
  description: string
  user_id?: string | null
  entity_type?: 'customer' | 'contact_request' | 'workflow' | 'user' | 'system'
  entity_id?: string
  metadata?: Record<string, unknown>
  ip_address?: string | null
  user_agent?: string | null
}

export interface ActivityFilters {
  type?: ActivityType | 'all'
  entity_type?: 'customer' | 'contact_request' | 'workflow' | 'user' | 'system' | 'all'
  entity_id?: string
  user_id?: string
  dateFrom?: string
  dateTo?: string
}

// === Utility Functions ===
export type StatusDomain = 'customer' | 'contact_request' | 'priority' | 'quote' | 'contract' | 'project'

type StatusConfig = { label: string; color: string; description: string }
type StatusConfigMap = Record<string, StatusConfig>
type StatusConfigDomains = Record<StatusDomain, StatusConfigMap>

export function getStatusConfig(status: string, type: StatusDomain) {
  const domains = STATUS_CONFIG as StatusConfigDomains
  const domainConfig = domains[type] || {}
  return domainConfig[status] || {
    label: status,
    color: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    description: 'Unbekannter Status'
  }
}

export function getStatusColor(status: string, type: StatusDomain): string {
  return getStatusConfig(status, type).color
}

export function getStatusLabel(status: string, type: StatusDomain): string {
  return getStatusConfig(status, type).label
}

// === Validation Schemas (Runtime Type Checking) ===
export const CUSTOMER_STATUS_VALUES: CustomerStatus[] = ['prospect', 'active', 'inactive', 'archived']
export const CONTACT_REQUEST_STATUS_VALUES: ContactRequestStatus[] = ['new', 'in_progress', 'responded', 'converted', 'archived']
export const PRIORITY_VALUES: PriorityLevel[] = ['low', 'medium', 'high', 'critical']

export function isValidCustomerStatus(status: string): status is CustomerStatus {
  return CUSTOMER_STATUS_VALUES.includes(status as CustomerStatus)
}

export function isValidContactRequestStatus(status: string): status is ContactRequestStatus {
  return CONTACT_REQUEST_STATUS_VALUES.includes(status as ContactRequestStatus)
}

export function isValidPriority(priority: string): priority is PriorityLevel {
  return PRIORITY_VALUES.includes(priority as PriorityLevel)
}
