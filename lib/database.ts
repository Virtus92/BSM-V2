import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createClientClient } from '@/lib/supabase/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { Database } from './database.types'

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Contact Request operations
export async function getContactRequests() {
  // Use server client with RLS to enforce visibility
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('contact_requests')
    .select(`
      *,
      converted_customer:customers(id, contact_person, email, company_name)
    `)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching contact requests:', error)
    return []
  }

  return data || []
}

export async function getContactRequestById(id: string) {
  // Use server client (RLS-enforced) to prevent leakage across employees
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('contact_requests')
    .select(`
      *,
      converted_customer:customers(id, contact_person, email, company_name),
      notes:contact_request_notes(
        id,
        content,
        is_internal,
        created_at,
        created_by
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching contact request:', error)
    return null
  }

  return data
}

// Customer operations
export async function getCustomers() {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching customers:', error)
    return []
  }

  return data || []
}

export async function getCustomerById(id: string) {
  // Use admin client to bypass RLS for server-side operations
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching customer:', error)
    return null
  }

  return data
}

export async function createCustomer(customer: InsertTables<'customers'>) {
  const supabase = createClientClient()

  const { data, error } = await supabase
    .from('customers')
    .insert(customer)
    .select()
    .single()

  if (error) {
    console.error('Error creating customer:', error)
    throw error
  }

  return data
}

export async function updateCustomer(id: string, updates: UpdateTables<'customers'>) {
  const supabase = createClientClient()

  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating customer:', error)
    throw error
  }

  return data
}

export async function deleteCustomer(id: string) {
  const supabase = createClientClient()

  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting customer:', error)
    throw error
  }
}

// User Profile operations
export async function getUserProfile(userId: string) {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data
}

export async function createUserProfile(profile: InsertTables<'user_profiles'>) {
  const supabase = createClientClient()

  const { data, error } = await supabase
    .from('user_profiles')
    .insert(profile)
    .select()
    .single()

  if (error) {
    console.error('Error creating user profile:', error)
    throw error
  }

  return data
}

export async function updateUserProfile(id: string, updates: UpdateTables<'user_profiles'>) {
  const supabase = createClientClient()

  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating user profile:', error)
    throw error
  }

  return data
}

// Contact Request Notes operations
export async function createContactRequestNote(note: InsertTables<'contact_request_notes'>) {
  const supabase = createClientClient()

  const { data, error } = await supabase
    .from('contact_request_notes')
    .insert(note)
    .select()
    .single()

  if (error) {
    console.error('Error creating contact request note:', error)
    throw error
  }

  return data
}

// Utility functions
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '€0,00'

  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

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

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    // Customer statuses
    active: 'bg-green-500/10 text-green-500 border-green-500/20',
    inactive: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    lead: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    archived: 'bg-red-500/10 text-red-500 border-red-500/20',

    // Contact request statuses
    new: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    in_progress: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    converted: 'bg-green-500/10 text-green-500 border-green-500/20',
    closed: 'bg-gray-500/10 text-gray-500 border-gray-500/20',

    // Priority levels
    low: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    critical: 'bg-red-500/10 text-red-500 border-red-500/20'
  }

  return statusColors[status] || 'bg-gray-500/10 text-gray-500 border-gray-500/20'
}

export function getStatusLabel(status: string, type: 'customer' | 'contact_request' | 'priority'): string {
  const statusLabels: Record<string, Record<string, string>> = {
    customer: {
      active: 'Aktiv',
      inactive: 'Inaktiv',
      lead: 'Lead',
      archived: 'Archiviert'
    },
    contact_request: {
      new: 'Neu',
      in_progress: 'In Bearbeitung',
      converted: 'Konvertiert',
      closed: 'Geschlossen'
    },
    priority: {
      low: 'Niedrig',
      medium: 'Mittel',
      high: 'Hoch',
      critical: 'Kritisch'
    }
  }

  return statusLabels[type]?.[status] || status
}
