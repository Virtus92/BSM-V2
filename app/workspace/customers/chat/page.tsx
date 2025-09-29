import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { EmployeeChatManagement } from '@/components/customers/EmployeeChatManagement';

export default async function CustomerChatManagement() {
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

  // Get customers assigned to this employee or all customers if admin
  const customersQuery = admin
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
    .eq('status', 'active')
    .order('company_name');

  if (profile.user_type === 'employee') {
    customersQuery.eq('assigned_employee_id', user.id);
  }

  const { data: customers } = await customersQuery;

  // Get chat statistics
  const { data: chatStats } = await admin
    .from('customer_chat_messages')
    .select(`
      customer_id,
      is_from_customer,
      created_at
    `)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days

  // Get active chat customers (customers with recent messages)
  const activeChatCustomers = customers?.filter(customer =>
    chatStats?.some(stat => stat.customer_id === customer.id)
  ) || [];

  // Get all available employees for assignment (admin only)
  let availableEmployees = [];
  if (profile.user_type === 'admin') {
    const { data: employees } = await admin
      .from('user_profiles')
      .select('id, first_name, last_name, email')
      .eq('user_type', 'employee')
      .eq('is_active', true)
      .order('first_name');

    availableEmployees = employees || [];
  }

  return (
    <EmployeeChatManagement
      customers={customers || []}
      activeChatCustomers={activeChatCustomers}
      chatStats={chatStats || []}
      currentUser={user}
      userProfile={profile}
      availableEmployees={availableEmployees}
    />
  );
}