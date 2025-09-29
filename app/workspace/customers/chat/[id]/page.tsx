import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { EmployeeCustomerChat } from '@/components/customers/EmployeeCustomerChat';

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
    .select(`
      id,
      company_name,
      contact_person,
      email,
      phone,
      status,
      assigned_employee_id,
      created_at,
      user_profiles!customers_assigned_employee_id_fkey(
        id,
        first_name,
        last_name,
        email
      )
    `)
    .eq('id', id)
    .single();

  if (!customer) {
    redirect('/dashboard/customers/chat');
  }

  // Check if employee has access to this customer
  if (profile.user_type === 'employee' && customer.assigned_employee_id !== user.id) {
    redirect('/dashboard/customers/chat');
  }

  // Get chat messages
  const { data: chatMessages } = await admin
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
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: true });

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
    <EmployeeCustomerChat
      customer={customer}
      chatMessages={chatMessages || []}
      customerRequests={customerRequests || []}
      currentUser={user}
      userProfile={profile}
    />
  );
}