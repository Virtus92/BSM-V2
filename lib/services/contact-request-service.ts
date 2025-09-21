/**
 * 🎯 Contact Request Service Layer
 *
 * Einheitliche Business Logic für Contact Request-Operationen.
 * Verwendet von Anfragenverwaltung und CRM-Integration.
 */

// Removed direct Supabase client imports - using API routes instead
import {
  ContactRequest,
  ContactRequestInsert,
  ContactRequestWithRelations,
  ContactRequestFilters,
  ContactRequestStats,
  ContactRequestStatus,
  CustomerStatus,
  Customer,
  ApiResponse,
  PriorityLevel,
  getStatusColor,
  getStatusLabel,
  isValidContactRequestStatus,
  isValidPriority
} from '@/lib/shared-types'
import { logActivity } from './activity'

export class ContactRequestService {
  // Using API routes instead of direct Supabase client access

  // === Read Operations ===

  async getContactRequests(filters?: ContactRequestFilters): Promise<ContactRequestWithRelations[]> {
    // Build query parameters
    const params = new URLSearchParams()
    if (filters?.status && filters.status !== 'all') {
      params.append('status', filters.status)
    }

    const url = params.toString() ? `/api/contact?${params.toString()}` : '/api/contact'
    const response = await fetch(url)

    if (!response.ok) {
      let message = `HTTP ${response.status}`
      try {
        const err = await response.json()
        if (err?.error) message = err.error
      } catch {}
      throw new Error(message)
    }

    const { requests } = (await response.json()) as { requests: ContactRequestWithRelations[] }
    let result: ContactRequestWithRelations[] = requests || []

    // Apply additional filters client-side
    if (filters?.priority && filters.priority !== 'all') {
      result = result.filter((r) => r.priority === filters.priority)
    }
    if (filters?.source) {
      result = result.filter((r) => r.source === filters.source)
    }
    if (filters?.assignedTo) {
      result = result.filter((r) => r.assigned_to === filters.assignedTo)
    }
    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase()
      result = result.filter((request) =>
        request.name?.toLowerCase().includes(searchTerm) ||
        request.email?.toLowerCase().includes(searchTerm) ||
        request.company?.toLowerCase().includes(searchTerm) ||
        request.subject?.toLowerCase().includes(searchTerm) ||
        request.message?.toLowerCase().includes(searchTerm)
      )
    }

    return result
  }

  async getContactRequestById(id: string): Promise<ContactRequestWithRelations | null> {
    try {
      const response = await fetch(`/api/contact/${id}`)

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`HTTP ${response.status}`)
      }

      const { request } = await response.json()
      return request
    } catch (error) {
      console.error('ContactRequestService.getContactRequestById error:', error)
      return null
    }
  }

  async getContactRequestStats(filters?: ContactRequestFilters): Promise<ContactRequestStats> {
    try {
      const requests = await this.getContactRequests(filters)

      const converted = requests.filter(r => r.status === 'converted').length
      const total = requests.length

      const stats: ContactRequestStats = {
        total,
        new: requests.filter(r => r.status === 'new').length,
        inProgress: requests.filter(r => r.status === 'in_progress').length,
        responded: requests.filter(r => r.status === 'responded').length,
        converted,
        conversionRate: total > 0 ? (converted / total) * 100 : 0
      }

      return stats
    } catch {
      console.error('ContactRequestService.getContactRequestStats error')
      return {
        total: 0,
        new: 0,
        inProgress: 0,
        responded: 0,
        converted: 0,
        conversionRate: 0
      }
    }
  }

  // === Write Operations ===

  async createContactRequest(requestData: Partial<ContactRequestInsert>): Promise<ApiResponse<{ id: string }>> {
    try {
      // Validate required fields
      if (!requestData.name || !requestData.email || !requestData.subject || !requestData.message) {
        return {
          success: false,
          error: 'Name, email, subject, and message are required'
        }
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(requestData.email)) {
        return {
          success: false,
          error: 'Invalid email format'
        }
      }

      // Validate status and priority
      if (requestData.status && !isValidContactRequestStatus(requestData.status)) {
        return {
          success: false,
          error: 'Invalid contact request status'
        }
      }
      if (requestData.priority && !isValidPriority(requestData.priority)) {
        return {
          success: false,
          error: 'Invalid priority level'
        }
      }

      // Set defaults
      const insertData: ContactRequestInsert = {
        name: requestData.name.trim(),
        email: requestData.email.toLowerCase().trim(),
        company: requestData.company?.trim() || null,
        phone: requestData.phone?.trim() || null,
        subject: requestData.subject.trim(),
        message: requestData.message.trim(),
        source: requestData.source || 'website',
        status: requestData.status || 'new',
        priority: requestData.priority || 'medium',
        ...requestData
      }

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(insertData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        return {
          success: false,
          error: errorData.error || 'Failed to create contact request'
        }
      }

      const responseData = await response.json()
      return {
        success: true,
        data: { id: responseData.id },
        message: 'Contact request created successfully'
      }
    } catch (error) {
      console.error('ContactRequestService.createContactRequest error:', error)
      return {
        success: false,
        error: 'Internal server error'
      }
    }
  }

  async updateContactRequestStatus(
    id: string,
    status: ContactRequestStatus,
    note?: string
  ): Promise<ApiResponse<ContactRequest>> {
    try {
      if (!isValidContactRequestStatus(status)) {
        return {
          success: false,
          error: 'Invalid status'
        }
      }

      const response = await fetch(`/api/contact/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status,
          note: note || undefined
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        return {
          success: false,
          error: errorData.error || 'Failed to update contact request'
        }
      }

      const { request: data } = await response.json()

      // Log activity
      try {
        await logActivity({
          entityType: 'contact_request',
          entityId: data.id,
          action: 'update',
          description: `Status geändert zu: ${this.getStatusLabel(status)}`
        })
      } catch (logError) {
        console.warn('Failed to log activity:', logError)
      }

      return {
        success: true,
        data,
        message: 'Contact request updated successfully'
      }
    } catch (error) {
      console.error('ContactRequestService.updateContactRequestStatus error:', error)
      return {
        success: false,
        error: 'Internal server error'
      }
    }
  }

  async updateContactRequestPriority(
    id: string,
    priority: PriorityLevel
  ): Promise<ApiResponse<ContactRequest>> {
    try {
      if (!isValidPriority(priority)) {
        return { success: false, error: 'Invalid priority' }
      }

      const response = await fetch(`/api/contact/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return { success: false, error: errorData.error || 'Failed to update priority' }
      }

      const { request } = await response.json()
      return { success: true, data: request }
    } catch {
      return { success: false, error: 'Internal server error' }
    }
  }

  async convertToCustomer(
    requestId: string,
    customCustomerData?: Partial<{ name: string; company: string; phone: string; status: CustomerStatus; notes: string }>
  ): Promise<ApiResponse<{ customer: Customer; action: 'created' | 'linked' }>> {
    try {
      // Get the contact request
      const request = await this.getContactRequestById(requestId)
      if (!request) {
        return {
          success: false,
          error: 'Contact request not found'
        }
      }

      // Check if already converted
      if (request.converted_to_customer_id) {
        return {
          success: false,
          error: 'Contact request already converted'
        }
      }

      // Convert via server API to avoid using admin client on the client
      const convertResponse = await fetch(`/api/contact/${requestId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customCustomerData?.name,
          company: customCustomerData?.company,
          phone: customCustomerData?.phone,
          status: customCustomerData?.status,
          notes: customCustomerData?.notes
        })
      })

      if (!convertResponse.ok) {
        const err = await convertResponse.json().catch(() => ({}))
        console.error('Error converting contact request:', err)
        return {
          success: false,
          error: err?.error || 'Failed to convert to customer'
        }
      }

      const convertData = await convertResponse.json()
      return {
        success: true,
        data: { customer: convertData.customer, action: convertData.action },
        message: convertData.message || 'Contact request converted to customer successfully'
      }
    } catch {
      console.error('ContactRequestService.convertToCustomer error')
      return {
        success: false,
        error: 'Internal server error'
      }
    }
  }

  async addNote(requestId: string, content: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`/api/contact/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          note: content
        })
      })

      if (!response.ok) {
        console.error('Error adding note to contact request')
        return {
          success: false,
          error: 'Failed to add note'
        }
      }

      return {
        success: true,
        message: 'Note added successfully'
      }
    } catch {
      console.error('ContactRequestService.addNote error')
      return {
        success: false,
        error: 'Internal server error'
      }
    }
  }

  // === Utility Methods ===

  getStatusColor(status: string): string {
    return getStatusColor(status, 'contact_request')
  }

  getStatusLabel(status: string): string {
    return getStatusLabel(status, 'contact_request')
  }

  getPriorityColor(priority: string): string {
    return getStatusColor(priority, 'priority')
  }

  getPriorityLabel(priority: string): string {
    return getStatusLabel(priority, 'priority')
  }

  formatContactRequestPreview(request: ContactRequest): string {
    const maxLength = 100
    if (request.message.length <= maxLength) {
      return request.message
    }
    return request.message.substring(0, maxLength) + '...'
  }

  formatContactRequestDate(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) {
      return 'Heute'
    } else if (diffInDays === 1) {
      return 'Gestern'
    } else if (diffInDays < 7) {
      return `Vor ${diffInDays} Tagen`
    } else {
      return new Intl.DateTimeFormat('de-DE').format(date)
    }
  }

  isConvertible(request: ContactRequest): boolean {
    return !request.converted_to_customer_id && request.status !== 'converted'
  }

  getNextStatus(currentStatus: ContactRequestStatus): ContactRequestStatus | null {
    const statusFlow: Record<ContactRequestStatus, ContactRequestStatus | null> = {
      new: 'in_progress',
      in_progress: 'responded',
      responded: 'converted',
      converted: null,
      archived: null
    }
    return statusFlow[currentStatus]
  }

  canAdvanceStatus(request: ContactRequest): boolean {
    return this.getNextStatus(request.status as ContactRequestStatus) !== null
  }
}

// Singleton instance
export const contactRequestService = new ContactRequestService()
