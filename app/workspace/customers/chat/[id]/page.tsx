import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { EmployeeCustomerChatMultiChannel } from '@/components/customers/EmployeeCustomerChatMultiChannel';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EmployeeCustomerChatPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login');
  }

  // Check if user is employee or admin
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('user_type, first_name, last_name')
    .eq('id', user.id)
    .single();

  if (!profile || !['employee', 'admin'].includes(profile.user_type)) {
    redirect('/dashboard');
  }

  const admin = createAdminClient();

  // Get customer data
  const { data: customer } = await admin
    .from('customers')
    .select('id, company_name, contact_person, email, phone, status, assigned_employee_id, created_at')
    .eq('id', id)
    .single();

  // Fetch assigned employee profile separately
  if (customer?.assigned_employee_id) {
    const { data: employeeProfile } = await admin
      .from('user_profiles')
      .select('id, first_name, last_name')
      .eq('id', customer.assigned_employee_id)
      .single();
    (customer as any).user_profiles = employeeProfile;
  }

  if (!customer) {
    redirect('/workspace/customers/chat');
  }

  // Check if employee has access to this customer (admins can see all)
  if (profile.user_type === 'employee' && customer.assigned_employee_id !== user.id) {
    redirect('/workspace/customers/chat');
  }

  // Note: Chat messages are now fetched by the component based on active channel

  // Get customer's requests for context
  const { data: customerRequests } = await admin
    .from('contact_requests')
    .select(`
      id,
      subject,
      status,
      priority,
      created_at,
      message
    `)
    .eq('converted_to_customer_id', customer.id)
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <EmployeeCustomerChatMultiChannel
      customer={customer}
      chatMessages={[]} // Component fetches messages by channel
      customerRequests={customerRequests || []}
      currentUser={user}
      userProfile={profile}
    />
  );
}
