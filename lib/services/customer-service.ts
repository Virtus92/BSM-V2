/**
 * 🎯 Customer Service Layer
 *
 * Einheitliche Business Logic für Customer-Operationen.
 * Verwendet von CRM und Anfragenverwaltung.
 */

import { createClient } from '@/lib/supabase/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { logApiError } from '@/lib/utils/error-handler'
import {
  Customer,
  CustomerInsert,
  CustomerUpdate,
  CustomerFilters,
  CustomerStats,
  ApiResponse,
  getStatusColor,
  getStatusLabel,
  isValidCustomerStatus
} from '@/lib/shared-types'
import { logActivity } from './activity'

export class CustomerService {
  private supabase = createClient()
  private adminClient = createAdminClient()

  // === Read Operations ===

  async getCustomers(filters?: CustomerFilters): Promise<Customer[]> {
    try {
      // Use API route instead of direct DB access
      const response = await fetch('/api/customers');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const { customers } = await response.json();
      let result = customers || [];

      // Apply filters client-side
      if (filters?.status && filters.status !== 'all') {
        result = result.filter((c: Customer) => c.status === filters.status);
      }
      // Customer priority not part of current schema
      if (filters?.industry) {
        result = result.filter((c: Customer) => c.industry === filters.industry);
      }
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        result = result.filter((c: Customer) =>
          c.contact_person?.toLowerCase().includes(searchTerm) ||
          c.company_name?.toLowerCase().includes(searchTerm) ||
          c.email?.toLowerCase().includes(searchTerm)
        );
      }

      return result;
    } catch {
      return [];
    }
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    try {
      const { data, error } = await this.supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        return null
      }

      return data
    } catch {
      return null
    }
  }

  async getCustomerByEmail(email: string): Promise<Customer | null> {
    try {
      const { data, error } = await this.supabase
        .from('customers')
        .select('*')
        .eq('email', email)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      }

      return data || null
    } catch {
      return null
    }
  }

  async getCustomerStats(filters?: CustomerFilters): Promise<CustomerStats> {
    try {
      const customers = await this.getCustomers(filters)

      const stats: CustomerStats = {
        total: customers.length,
        lead: customers.filter(c => c.status === 'prospect').length,
        active: customers.filter(c => c.status === 'active').length,
        inactive: customers.filter(c => c.status === 'inactive').length,
        archived: customers.filter(c => c.status === 'archived').length,
        totalRevenue: 0,
        averageRevenue: 0
      }

      return stats
    } catch {
      return {
        total: 0,
        lead: 0,
        active: 0,
        inactive: 0,
        archived: 0,
        totalRevenue: 0,
        averageRevenue: 0
      }
    }
  }

  // === Write Operations ===

  async createCustomer(customerData: Partial<CustomerInsert>): Promise<ApiResponse<Customer>> {
    try {
      // Validate required fields
      if (!customerData.company_name && !customerData.contact_person) {
        return {
          success: false,
          error: 'Name or company is required'
        }
      }

      // Validate status
      if (customerData.status && !isValidCustomerStatus(customerData.status)) {
        return {
          success: false,
          error: 'Invalid customer status'
        }
      }

      // Set defaults
      const insertData: CustomerInsert = {
        company_name: customerData.company_name || customerData.contact_person || '',
        contact_person: customerData.contact_person || null,
        email: customerData.email || null,
        phone: customerData.phone || null,
        website: customerData.website || null,
        address_line1: customerData.address_line1 || null,
        city: customerData.city || null,
        postal_code: customerData.postal_code || null,
        country: customerData.country || null,
        industry: customerData.industry || null,
        status: (customerData.status ?? 'prospect'),
        // notes removed - now handled via customer_notes table
        tags: customerData.tags || null,
      }

      const { data, error } = await this.adminClient
        .from('customers')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('Error creating customer:', error)
        return {
          success: false,
          error: 'Failed to create customer'
        }
      }

      // Log activity
      try {
        await logActivity({
          entityType: 'customer',
          entityId: data.id,
          action: 'create',
          description: `Kunde erstellt: ${data.contact_person || data.company_name}`
        })
      } catch (logError) {
        const err = logError instanceof Error ? logError : new Error(String(logError))
        logApiError('log activity', err, { operation: 'customer_activity', metadata: { customerId: data?.id } })
      }

      return {
        success: true,
        data,
        message: 'Customer created successfully'
      }
    } catch (error) {
      console.error('CustomerService.createCustomer error:', error)
      return {
        success: false,
        error: 'Internal server error'
      }
    }
  }

  async updateCustomer(id: string, updates: Partial<CustomerUpdate>): Promise<ApiResponse<Customer>> {
    try {
      // Validate status if provided
      if (updates.status && !isValidCustomerStatus(updates.status)) {
        return {
          success: false,
          error: 'Invalid customer status'
        }
      }

      const { data, error } = await this.adminClient
        .from('customers')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating customer:', error)
        return {
          success: false,
          error: 'Failed to update customer'
        }
      }

      // Log activity
      try {
        await logActivity({
          entityType: 'customer',
          entityId: data.id,
          action: 'update',
          description: `Kunde aktualisiert: ${data.contact_person || data.company_name}`
        })
      } catch (logError) {
        const err = logError instanceof Error ? logError : new Error(String(logError))
        logApiError('log activity', err, { operation: 'customer_activity', metadata: { customerId: data?.id } })
      }

      return {
        success: true,
        data,
        message: 'Customer updated successfully'
      }
    } catch (error) {
      console.error('CustomerService.updateCustomer error:', error)
      return {
        success: false,
        error: 'Internal server error'
      }
    }
  }

  async deleteCustomer(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await this.adminClient
        .from('customers')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting customer:', error)
        return {
          success: false,
          error: 'Failed to delete customer'
        }
      }

      // Log activity
      try {
        await logActivity({
          entityType: 'customer',
          entityId: id,
          action: 'delete',
          description: 'Kunde gelöscht'
        })
      } catch (logError) {
        const err = logError instanceof Error ? logError : new Error(String(logError))
        logApiError('log activity', err, { operation: 'customer_activity', metadata: { customerId: id } })
      }

      return {
        success: true,
        message: 'Customer deleted successfully'
      }
    } catch (error) {
      console.error('CustomerService.deleteCustomer error:', error)
      return {
        success: false,
        error: 'Internal server error'
      }
    }
  }

  // === Utility Methods ===

  getStatusColor(status: string): string {
    return getStatusColor(status, 'customer')
  }

  getStatusLabel(status: string): string {
    return getStatusLabel(status, 'customer')
  }

  formatCustomerName(customer: Customer): string {
    if (customer.company_name && customer.contact_person && customer.contact_person !== customer.company_name) {
      return `${customer.company_name} (${customer.contact_person})`
    }
    return customer.company_name || customer.contact_person || 'Unbekannter Kunde'
  }

  formatCustomerContact(customer: Customer): string {
    const parts = []
    if (customer.email) parts.push(customer.email)
    if (customer.phone) parts.push(customer.phone)
    return parts.join(' | ') || 'Keine Kontaktdaten'
  }

  formatCustomerAddress(customer: Customer): string {
    const parts = []
    if (customer.address_line1) parts.push(customer.address_line1)
    if (customer.postal_code) parts.push(customer.postal_code)
    if (customer.city) parts.push(customer.city)
    if (customer.country) parts.push(customer.country)
    return parts.join(', ') || 'Keine Adresse'
  }
}

// Singleton instance
export const customerService = new CustomerService()
