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
    .select('id, company_name, contact_person, email, phone, status, assigned_employee_id, created_at')
    .order('company_name');

  if (profile.user_type === 'employee') {
    customersQuery.eq('assigned_employee_id', user.id);
  }

  const { data: customers, error: customersError } = await customersQuery;

  // Fetch employee profiles separately for assigned employees
  if (customers && customers.length > 0) {
    const employeeIds = [...new Set(customers.map(c => c.assigned_employee_id).filter(Boolean))] as string[];
    if (employeeIds.length > 0) {
      const { data: profiles, error: profilesError } = await admin
        .from('user_profiles')
        .select('id, first_name, last_name')
        .in('id', employeeIds);

      console.log('ChatManagement[employeeProfiles]:', {
        employeeIdsCount: employeeIds.length,
        employeeIds,
        profilesFound: profiles?.length || 0,
        profiles,
        error: profilesError?.message || 'none'
      });

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      customers.forEach((customer: any) => {
        if (customer.assigned_employee_id) {
          customer.user_profiles = profileMap.get(customer.assigned_employee_id) || null;
        }
      });
    }
  }

  console.log('ChatManagement[customers]:', {
    userType: profile.user_type,
    userId: user.id,
    customerCount: customers?.length || 0,
    error: customersError?.message || 'none'
  });

  // Get chat statistics - only for customers visible to this user
  let chatStatsQuery = admin
    .from('customer_chat_messages')
    .select('customer_id, is_from_customer, created_at')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  // For employees, only get stats for their assigned customers
  if (profile.user_type === 'employee' && customers && customers.length > 0) {
    const customerIds = customers.map(c => c.id);
    chatStatsQuery = chatStatsQuery.in('customer_id', customerIds);
  }

  const { data: chatStats, error: chatStatsError } = await chatStatsQuery;

  console.log('ChatManagement[chatStats]:', {
    statsCount: chatStats?.length || 0,
    error: chatStatsError?.message || 'none'
  });

  // Get active chat customers (customers with recent messages)
  const activeChatCustomers = customers?.filter(customer =>
    chatStats?.some(stat => stat.customer_id === customer.id)
  ) || [];

  // Get all available employees for assignment (admin only)
  let availableEmployees = [];
  if (profile.user_type === 'admin') {
    const { data: employees } = await admin
      .from('user_profiles')
      .select('id, first_name, last_name')
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
