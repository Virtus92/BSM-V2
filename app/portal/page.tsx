import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CustomerPortalDashboard } from '@/components/portal/CustomerPortalDashboard'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Customer {
  id: string;
  company_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  assigned_employee_id: string | null;
  status: string;
  created_at: string;
  user_profiles?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export default async function PortalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    logger.warn('Unauthorized portal access attempt', { component: 'Portal' })
    redirect('/auth/login')
  }

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

  // Load customer data using RLS-enabled client
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select(`
      id,
      company_name,
      contact_person,
      email,
      phone,
      assigned_employee_id,
      status,
      created_at
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (customerError) {
    logger.error('Failed to load customer data', customerError, {
      component: 'Portal',
      userId: user.id
    })
  }

  // Fetch assigned employee profile separately if exists
  if (customer && customer.assigned_employee_id) {
    const { data: employeeProfile } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name')
      .eq('id', customer.assigned_employee_id)
      .maybeSingle()

    if (employeeProfile) {
      (customer as any).user_profiles = employeeProfile
    }
  }

  logger.debug('Portal customer lookup', {
    component: 'Portal',
    userId: user.id,
    metadata: {
      customerFound: !!customer,
      profileType: profile?.user_type
    }
  })

  // If no customer, redirect to setup
  if (!customer) {
    redirect('/customer-setup')
  }

  // Load requests using RLS-enabled client
  const { data: requests } = await supabase
    .from('contact_requests')
    .select('id, created_at, status, subject, message, priority')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Load recent chat messages
  const { data: recentMessages } = await supabase
    .from('customer_chat_messages')
    .select(`
      id,
      message,
      created_at,
      is_from_customer,
      sender_id
    `)
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Fetch sender profiles separately
  if (recentMessages && recentMessages.length > 0) {
    const senderIds = [...new Set(recentMessages.map(m => m.sender_id))]
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, email')
      .in('id', senderIds)

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])
    recentMessages.forEach((msg: any) => {
      msg.user_profiles = profileMap.get(msg.sender_id) || null
    })
  }

  // Get request statistics
  const requestStats = {
    total: requests?.length || 0,
    new: requests?.filter(r => r.status === 'new').length || 0,
    in_progress: requests?.filter(r => r.status === 'in_progress').length || 0,
    completed: requests?.filter(r => r.status === 'completed').length || 0
  }

  return (
    <CustomerPortalDashboard
      customer={customer as Customer}
      requests={requests || []}
      requestStats={requestStats}
      recentMessages={recentMessages || []}
      currentUser={user}
    />
  )
}
