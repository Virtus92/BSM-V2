import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { CustomerPortalDashboard } from '@/components/portal/CustomerPortalDashboard'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function ensureCustomerRecord(userId: string, email: string | null, fullName?: string | null) {
  const admin = createAdminClient()
  // Check if a customer record exists for this user
  const { data: existing } = await admin
    .from('customers')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (existing?.id) return existing.id

  const companyName = fullName || email || 'Customer'
  const { data: created } = await admin
    .from('customers')
    .insert({
      company_name: companyName,
      contact_person: fullName || null,
      email: email || null,
      status: 'active',
      user_id: userId
    })
    .select('id')
    .single()

  return created?.id || null
}

export default async function PortalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // If the user is admin, go to admin dashboard
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('user_type, first_name, last_name')
    .eq('id', user.id)
    .single()

  if (profile?.user_type === 'admin') {
    redirect('/dashboard')
  }

  if (profile?.user_type === 'employee') {
    redirect('/workspace')
  }

  // Ensure we have a customer record linked to this user
  await ensureCustomerRecord(user.id, user.email ?? null, user.user_metadata?.full_name ?? null)

  // Load customer data with assigned employee
  const admin = createAdminClient()
  const { data: customer } = await admin
    .from('customers')
    .select(`
      id,
      company_name,
      contact_person,
      email,
      phone,
      assigned_employee_id,
      status,
      created_at,
      user_profiles!customers_assigned_employee_id_fkey(
        id,
        first_name,
        last_name,
        email
      )
    `)
    .eq('user_id', user.id)
    .single()

  // Load own requests
  const { data: requests } = await admin
    .from('contact_requests')
    .select('id, created_at, status, subject, message, priority')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Load recent chat messages
  const { data: recentMessages } = await admin
    .from('customer_chat_messages')
    .select(`
      id,
      message,
      created_at,
      is_from_customer,
      sender_id,
      user_profiles!customer_chat_messages_sender_id_fkey(
        first_name,
        last_name,
        email
      )
    `)
    .eq('customer_id', customer?.id || '')
    .order('created_at', { ascending: false })
    .limit(5)

  // Get request statistics
  const requestStats = {
    total: requests?.length || 0,
    new: requests?.filter(r => r.status === 'new').length || 0,
    in_progress: requests?.filter(r => r.status === 'in_progress').length || 0,
    completed: requests?.filter(r => r.status === 'completed').length || 0
  }

  if (!customer) {
    redirect('/customer-setup')
  }

  return (
    <CustomerPortalDashboard
      customer={customer}
      requests={requests || []}
      requestStats={requestStats}
      recentMessages={recentMessages || []}
      currentUser={user}
    />
  )
}
