/**
 * 🎯 Unified Contact Request Hook
 *
 * Clean, einheitlicher Hook für Contact Request-Management.
 * Ersetzt die bisherigen Anfragenverwaltung-spezifischen Implementierungen.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  ContactRequest,
  ContactRequestWithRelations,
  ContactRequestFilters,
  ContactRequestStats,
  ContactRequestStatus,
  CustomerStatus,
  Customer,
  PriorityLevel
} from '@/lib/shared-types'
import { contactRequestService } from '@/lib/services/contact-request-service'

interface UseContactRequestsOptions {
  initialFilters?: ContactRequestFilters
  autoLoad?: boolean
}

interface UseContactRequestsReturn {
  // Data
  requests: ContactRequestWithRelations[]
  filteredRequests: ContactRequestWithRelations[]
  stats: ContactRequestStats

  // State
  loading: boolean
  error: string | null
  converting: string | null

  // Filters
  filters: ContactRequestFilters
  searchTerm: string
  statusFilter: string
  priorityFilter: string

  // Actions
  setFilters: (filters: ContactRequestFilters) => void
  setSearchTerm: (term: string) => void
  setStatusFilter: (status: string) => void
  setPriorityFilter: (priority: string) => void
  refetch: () => Promise<void>

  // Operations
  updateStatus: (requestId: string, status: ContactRequestStatus, note?: string) => Promise<boolean>
  updatePriority: (requestId: string, priority: PriorityLevel) => Promise<boolean>
  convertToCustomer: (requestId: string, customData?: Partial<{ name: string; company: string; phone: string; status: CustomerStatus; notes: string }>) => Promise<{ success: boolean; customer?: Customer; action?: 'created' | 'linked' }>
  addNote: (requestId: string, content: string) => Promise<boolean>

  // Utils
  getStatusColor: (status: string) => string
  getStatusLabel: (status: string) => string
  getPriorityColor: (priority: string) => string
  getPriorityLabel: (priority: string) => string
  formatPreview: (request: ContactRequest) => string
  formatDate: (dateString: string) => string
  isConvertible: (request: ContactRequest) => boolean
  canAdvanceStatus: (request: ContactRequest) => boolean
  getNextStatus: (status: ContactRequestStatus) => ContactRequestStatus | null
}

export function useContactRequests(options: UseContactRequestsOptions = {}): UseContactRequestsReturn {
  const { initialFilters = {}, autoLoad = true } = options

  // State
  const [requests, setRequests] = useState<ContactRequestWithRelations[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [converting, setConverting] = useState<string | null>(null)
  const [filters, setFilters] = useState<ContactRequestFilters>(initialFilters)

  // Derived filters for backward compatibility
  const searchTerm = filters.search || ''
  const statusFilter = filters.status || 'all'
  const priorityFilter = filters.priority || 'all'

  // Load contact requests
  const loadRequests = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await contactRequestService.getContactRequests(filters)
      setRequests(data)
    } catch {
      console.error('Failed to load contact requests')
      setError('Fehler beim Laden der Anfragen')
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Auto-load on mount and filter changes
  useEffect(() => {
    if (autoLoad) {
      loadRequests()
    }
  }, [autoLoad, loadRequests])

  // Filtered requests (for real-time search)
  const filteredRequests = useMemo(() => {
    let result = requests

    // Apply search filter if not already applied server-side
    if (searchTerm && !filters.search) {
      const term = searchTerm.toLowerCase()
      result = result.filter(request =>
        request.name?.toLowerCase().includes(term) ||
        request.email?.toLowerCase().includes(term) ||
        request.company?.toLowerCase().includes(term) ||
        request.subject?.toLowerCase().includes(term) ||
        request.message?.toLowerCase().includes(term)
      )
    }

    return result
  }, [requests, searchTerm, filters.search])

  // Statistics
  const stats = useMemo((): ContactRequestStats => {
    const data = filteredRequests
    const converted = data.filter(r => r.status === 'converted').length
    const total = data.length

    return {
      total,
      new: data.filter(r => r.status === 'new').length,
      inProgress: data.filter(r => r.status === 'in_progress').length,
      responded: data.filter(r => r.status === 'responded').length,
      converted,
      conversionRate: total > 0 ? (converted / total) * 100 : 0
    }
  }, [filteredRequests])

  // Filter actions
  const handleSetFilters = useCallback((newFilters: ContactRequestFilters) => {
    setFilters(newFilters)
  }, [])

  const handleSetSearchTerm = useCallback((term: string) => {
    setFilters(prev => ({ ...prev, search: term }))
  }, [])

  const handleSetStatusFilter = useCallback((status: string) => {
    setFilters(prev => ({
      ...prev,
      status: status === 'all' ? undefined : status as ContactRequestStatus
    }))
  }, [])

  const handleSetPriorityFilter = useCallback((priority: string) => {
    setFilters(prev => ({
      ...prev,
      priority: priority === 'all' ? undefined : (priority as PriorityLevel | 'all')
    }))
  }, [])

  // Operations
  const updateStatus = useCallback(async (
    requestId: string,
    status: ContactRequestStatus,
    note?: string
  ): Promise<boolean> => {
    try {
      const result = await contactRequestService.updateContactRequestStatus(requestId, status, note)
      if (result.success) {
        await loadRequests() // Refresh data
        return true
      } else {
        setError(result.error || 'Failed to update status')
        return false
      }
    } catch (err) {
      console.error('Failed to update status:', err)
      setError('Fehler beim Aktualisieren des Status')
      return false
    }
  }, [loadRequests])

  const updatePriority = useCallback(async (
    requestId: string,
    priority: PriorityLevel
  ): Promise<boolean> => {
    try {
      const result = await contactRequestService.updateContactRequestPriority(requestId, priority)
      if (result.success) {
        await loadRequests()
        return true
      } else {
        setError(result.error || 'Failed to update priority')
        return false
      }
    } catch (err) {
      console.error('Failed to update priority:', err)
      setError('Fehler beim Aktualisieren der Priorität')
      return false
    }
  }, [loadRequests])

  const convertToCustomer = useCallback(async (
    requestId: string,
    customData?: Partial<{ name: string; company: string; phone: string; status: CustomerStatus; notes: string }>
  ): Promise<{ success: boolean; customer?: Customer; action?: 'created' | 'linked' }> => {
    try {
      setConverting(requestId)
      const result = await contactRequestService.convertToCustomer(requestId, customData)

      if (result.success && result.data) {
        await loadRequests() // Refresh data
        return {
          success: true,
          customer: result.data.customer,
          action: result.data.action
        }
      } else {
        setError(result.error || 'Failed to convert to customer')
        return { success: false }
      }
    } catch (err) {
      console.error('Failed to convert to customer:', err)
      setError('Fehler bei der Konvertierung')
      return { success: false }
    } finally {
      setConverting(null)
    }
  }, [loadRequests])

  const addNote = useCallback(async (
    requestId: string,
    content: string
  ): Promise<boolean> => {
    try {
      const result = await contactRequestService.addNote(requestId, content)
      if (result.success) {
        await loadRequests() // Refresh data
        return true
      } else {
        setError(result.error || 'Failed to add note')
        return false
      }
    } catch (err) {
      console.error('Failed to add note:', err)
      setError('Fehler beim Hinzufügen der Notiz')
      return false
    }
  }, [loadRequests])

  // Utility methods
  const getStatusColor = useCallback((status: string) => {
    return contactRequestService.getStatusColor(status)
  }, [])

  const getStatusLabel = useCallback((status: string) => {
    return contactRequestService.getStatusLabel(status)
  }, [])

  const getPriorityColor = useCallback((priority: string) => {
    return contactRequestService.getPriorityColor(priority)
  }, [])

  const getPriorityLabel = useCallback((priority: string) => {
    return contactRequestService.getPriorityLabel(priority)
  }, [])

  const formatPreview = useCallback((request: ContactRequest) => {
    return contactRequestService.formatContactRequestPreview(request)
  }, [])

  const formatDate = useCallback((dateString: string) => {
    return contactRequestService.formatContactRequestDate(dateString)
  }, [])

  const isConvertible = useCallback((request: ContactRequest) => {
    return contactRequestService.isConvertible(request)
  }, [])

  const canAdvanceStatus = useCallback((request: ContactRequest) => {
    return contactRequestService.canAdvanceStatus(request)
  }, [])

  const getNextStatus = useCallback((status: ContactRequestStatus) => {
    return contactRequestService.getNextStatus(status)
  }, [])

  return {
    // Data
    requests,
    filteredRequests,
    stats,

    // State
    loading,
    error,
    converting,

    // Filters
    filters,
    searchTerm,
    statusFilter,
    priorityFilter,

    // Actions
    setFilters: handleSetFilters,
    setSearchTerm: handleSetSearchTerm,
    setStatusFilter: handleSetStatusFilter,
    setPriorityFilter: handleSetPriorityFilter,
    refetch: loadRequests,

    // Operations
    updateStatus,
    updatePriority,
    convertToCustomer,
    addNote,

    // Utils
    getStatusColor,
    getStatusLabel,
    getPriorityColor,
    getPriorityLabel,
    formatPreview,
    formatDate,
    isConvertible,
    canAdvanceStatus,
    getNextStatus
  }
}
