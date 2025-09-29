import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { CustomerChatView } from '@/components/portal/CustomerChatView';

export default async function CustomerChatPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login');
  }

  // Check if user is customer
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('user_type, first_name, last_name')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/auth/login');
  }

  if (profile.user_type !== 'customer') {
    // Redirect non-customers to their appropriate area
    if (profile.user_type === 'employee') {
      redirect('/workspace');
    } else if (profile.user_type === 'admin') {
      redirect('/workspace'); // Admins can use workspace too
    } else {
      redirect('/auth/login');
    }
  }

  // Get customer data with assigned employee
  const admin = createAdminClient();
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
    .single();

  if (!customer) {
    redirect('/auth/login?error=no_customer_account');
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

  // Get available employees for assignment
  const { data: availableEmployees } = await admin
    .from('user_profiles')
    .select('id, first_name, last_name, email')
    .eq('user_type', 'employee')
    .eq('is_active', true)
    .order('first_name');

  return (
    <CustomerChatView
      customer={customer}
      chatMessages={chatMessages || []}
      availableEmployees={availableEmployees || []}
      currentUser={user}
    />
  );
}