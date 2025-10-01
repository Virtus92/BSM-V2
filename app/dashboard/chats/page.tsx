import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { AdminChatDashboard } from '@/components/admin/AdminChatDashboard';

export default async function AdminChatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('user_type')
    .eq('id', user.id)
    .single();

  if (!profile || profile.user_type !== 'admin') {
    redirect('/dashboard');
  }

  const admin = createAdminClient();

  // Fetch all chat channels
  const { data: channels } = await admin
    .from('chat_channels')
    .select(`
      id,
      customer_id,
      employee_id,
      channel_type,
      channel_status,
      created_at,
      closed_at,
      source_type,
      source_id
    `)
    .eq('channel_status', 'active')
    .order('created_at', { ascending: false });

  // Fetch customer and employee info separately
  if (channels && channels.length > 0) {
    const customerIds = [...new Set(channels.map((ch: any) => ch.customer_id).filter(Boolean))];
    const employeeIds = [...new Set(channels.map((ch: any) => ch.employee_id).filter(Boolean))];

    console.log('[AdminChatsPage] Found channel IDs:', channels.map(ch => ch.id));
    console.log('[AdminChatsPage] Customer IDs to fetch:', customerIds);
    console.log('[AdminChatsPage] Employee IDs to fetch:', employeeIds);

    // Get customers
    const { data: customers, error: customersError } = await admin
      .from('customers')
      .select('id, company_name, contact_person, email')
      .in('id', customerIds);

    if (customersError) {
      console.error('[AdminChatsPage] Error fetching customers:', customersError);
    } else {
      console.log('[AdminChatsPage] Fetched customers:', customers?.length || 0);
    }

    // Get employees
    const { data: employees, error: employeesError } = await admin
      .from('user_profiles')
      .select('id, first_name, last_name, email')
      .in('id', employeeIds);

    if (employeesError) {
      console.error('[AdminChatsPage] Error fetching employees:', employeesError);
    } else {
      console.log('[AdminChatsPage] Fetched employees:', employees?.length || 0, employees);
    }

    // Get message counts per channel
    const { data: messageCounts } = await admin
      .from('customer_chat_messages')
      .select('channel_id')
      .in('channel_id', channels.map((ch: any) => ch.id));

    const messageCountMap = new Map<string, number>();
    messageCounts?.forEach((msg: any) => {
      const count = messageCountMap.get(msg.channel_id) || 0;
      messageCountMap.set(msg.channel_id, count + 1);
    });

    // Attach related data
    const customerMap = new Map(customers?.map(c => [c.id, c]) || []);
    const employeeMap = new Map(employees?.map(e => [e.id, e]) || []);

    console.log('[AdminChatsPage] Customer map size:', customerMap.size);
    console.log('[AdminChatsPage] Employee map size:', employeeMap.size);

    channels.forEach((ch: any) => {
      ch.customers = customerMap.get(ch.customer_id) || null;
      ch.user_profiles = employeeMap.get(ch.employee_id) || null;
      ch.message_count = messageCountMap.get(ch.id) || 0;

      if (!ch.user_profiles) {
        console.log(`[AdminChatsPage] Channel ${ch.id}: employee_id ${ch.employee_id} not found in map`);
      }
    });
  }

  // Calculate stats
  const stats = {
    total: channels?.length || 0,
    permanent: channels?.filter((ch: any) => ch.channel_type === 'permanent').length || 0,
    request: channels?.filter((ch: any) => ch.channel_type === 'request').length || 0,
    task: channels?.filter((ch: any) => ch.channel_type === 'task').length || 0,
    active: channels?.filter((ch: any) => ch.channel_status === 'active').length || 0,
    closed: channels?.filter((ch: any) => ch.channel_status === 'closed').length || 0,
  };

  return (
    <AdminChatDashboard
      channels={channels || []}
      stats={stats}
    />
  );
}
