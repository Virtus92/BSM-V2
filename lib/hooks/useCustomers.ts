/**
 * 🎯 Unified Customer Hook
 *
 * Clean, einheitlicher Hook für Customer-Management.
 * Ersetzt die bisherigen CRM-spezifischen Hooks.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Customer,
  CustomerFilters,
  CustomerStats,
  CustomerStatus,
  PriorityLevel
} from '@/lib/shared-types'
import { getStatusColor, getStatusLabel } from '@/lib/shared-types'

interface UseCustomersOptions {
  initialFilters?: CustomerFilters
  autoLoad?: boolean
}

interface UseCustomersReturn {
  // Data
  customers: Customer[]
  filteredCustomers: Customer[]
  stats: CustomerStats

  // State
  loading: boolean
  error: string | null

  // Filters
  filters: CustomerFilters
  searchTerm: string
  statusFilter: string
  priorityFilter: string

  // Actions
  setFilters: (filters: CustomerFilters) => void
  setSearchTerm: (term: string) => void
  setStatusFilter: (status: string) => void
  setPriorityFilter: (priority: string) => void
  refetch: () => Promise<void>

  // Utils
  getStatusColor: (status: string) => string
  getStatusLabel: (status: string) => string
  getPriorityColor: (priority: string) => string
  getPriorityLabel: (priority: string) => string
  formatCustomerName: (customer: Customer) => string
  formatCustomerContact: (customer: Customer) => string
}

export function useCustomers(options: UseCustomersOptions = {}): UseCustomersReturn {
  const { initialFilters = {}, autoLoad = true } = options

  // State
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<CustomerFilters>(initialFilters)

  // Derived filters for backward compatibility
  const searchTerm = filters.search || ''
  const statusFilter = filters.status || 'all'
  const priorityFilter = filters.priority || 'all'

  // Load customers via API (not direct service)
  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Use API route instead of direct service call
      const response = await fetch('/api/customers')
      if (!response.ok) {
        throw new Error('Failed to fetch customers')
      }

      const { customers } = await response.json()
      setCustomers(customers || [])
    } catch (err) {
      console.error('Failed to load customers:', err)
      setError('Fehler beim Laden der Kunden')
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-load on mount and filter changes
  useEffect(() => {
    if (autoLoad) {
      loadCustomers()
    }
  }, [autoLoad, loadCustomers])

  // Filtered customers (for real-time search)
  const filteredCustomers = useMemo(() => {
    let result = customers

    // Apply search filter if not already applied server-side
    if (searchTerm && !filters.search) {
      const term = searchTerm.toLowerCase()
      result = result.filter(customer =>
        customer.contact_person?.toLowerCase().includes(term) ||
        customer.company_name?.toLowerCase().includes(term) ||
        customer.email?.toLowerCase().includes(term)
      )
    }

    return result
  }, [customers, searchTerm, filters.search])

  // Statistics
  const stats = useMemo((): CustomerStats => {
    const data = filteredCustomers
    // Revenue tracking not implemented in current schema
    const totalRevenue = 0

    return {
      total: data.length,
      lead: data.filter(c => c.status === 'prospect').length,
      active: data.filter(c => c.status === 'active').length,
      inactive: data.filter(c => c.status === 'inactive').length,
      archived: data.filter(c => c.status === 'archived').length,
      totalRevenue,
      averageRevenue: 0
    }
  }, [filteredCustomers])

  // Filter actions
  const handleSetFilters = useCallback((newFilters: CustomerFilters) => {
    setFilters(newFilters)
  }, [])

  const handleSetSearchTerm = useCallback((term: string) => {
    setFilters(prev => ({ ...prev, search: term }))
  }, [])

  const handleSetStatusFilter = useCallback((status: string) => {
    setFilters(prev => ({
      ...prev,
      status: (status === 'all' ? undefined : (status as CustomerStatus | 'all'))
    }))
  }, [])

  const handleSetPriorityFilter = useCallback((priority: string) => {
    setFilters(prev => ({
      ...prev,
      priority: (priority === 'all' ? undefined : (priority as PriorityLevel | 'all'))
    }))
  }, [])

  // Utility methods
  const handleGetStatusColor = useCallback((status: string) => {
    return getStatusColor(status, 'customer')
  }, [])

  const handleGetStatusLabel = useCallback((status: string) => {
    return getStatusLabel(status, 'customer')
  }, [])

  const handleGetPriorityColor = useCallback((priority: string) => {
    return getStatusColor(priority, 'priority')
  }, [])

  const handleGetPriorityLabel = useCallback((priority: string) => {
    return getStatusLabel(priority, 'priority')
  }, [])

  const formatCustomerName = useCallback((customer: Customer) => {
    if (customer.company_name && customer.contact_person && customer.contact_person !== customer.company_name) {
      return `${customer.company_name} (${customer.contact_person})`
    }
    return customer.company_name || customer.contact_person || 'Unbekannter Kunde'
  }, [])

  const formatCustomerContact = useCallback((customer: Customer) => {
    const parts = []
    if (customer.email) parts.push(customer.email)
    if (customer.phone) parts.push(customer.phone)
    return parts.join(' | ') || 'Keine Kontaktdaten'
  }, [])

  return {
    // Data
    customers,
    filteredCustomers,
    stats,

    // State
    loading,
    error,

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
    refetch: loadCustomers,

    // Utils
    getStatusColor: handleGetStatusColor,
    getStatusLabel: handleGetStatusLabel,
    getPriorityColor: handleGetPriorityColor,
    getPriorityLabel: handleGetPriorityLabel,
    formatCustomerName,
    formatCustomerContact
  }
}
