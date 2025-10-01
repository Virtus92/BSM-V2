import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { CustomerChatView } from '@/components/portal/CustomerChatView';

export default async function CustomerChatPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.log('PortalChat[auth]: no user, authError=', !!authError);
    redirect('/auth/login');
  }

  // Check if user is customer
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('user_type, first_name, last_name')
    .eq('id', user.id)
    .single();

  if (!profile) {
    console.log('PortalChat[profile]: missing profile for user', user.id, 'error=', profileError?.message);
    redirect('/auth/login');
  }

  if (profile.user_type !== 'customer') {
    console.log('PortalChat[guard]: non-customer user_type=', profile.user_type, 'redirecting');
    // Redirect non-customers to their appropriate area
    if (profile.user_type === 'employee') {
      redirect('/workspace');
    } else if (profile.user_type === 'admin') {
      redirect('/workspace'); // Admins can use workspace too
    } else {
      redirect('/auth/login');
    }
  }

  // Get customer data (with assigned employee for display)
  console.log('PortalChat[user]: user.id=', user.id);

  const { data: customerRow, error: customerError } = await supabase
    .from('customers')
    .select('id, company_name, contact_person, email, phone, assigned_employee_id, status, created_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!customerRow) {
    // Debug: check if row exists via admin (RLS bypass) to diagnose policy issues
    try {
      const admin = createAdminClient();
      const { data: adminCheck, error: adminCheckErr } = await admin
        .from('customers')
        .select('id, user_id, assigned_employee_id, status')
        .eq('user_id', user.id)
        .maybeSingle();
      console.log('PortalChat[debug]: supabase user fetch returned none. error=', customerError?.message, 'adminCheck.exists=', !!adminCheck, 'adminCheck.error=', adminCheckErr?.message);
    } catch (e) {
      console.log('PortalChat[debug]: adminCheck failed', (e as Error).message);
    }
  } else {
    console.log('PortalChat[customers]: found customer id=', customerRow.id, 'assigned_employee_id=', customerRow.assigned_employee_id || 'none');
  }

  if (!customerRow) {
    console.log('PortalChat[redirect]: no customer row for user -> /customer-setup');
    redirect('/customer-setup');
  }

  // Fetch assigned employee profile if exists
  if (customerRow.assigned_employee_id) {
    const { data: employeeProfile, error: empError } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name')
      .eq('id', customerRow.assigned_employee_id)
      .maybeSingle();

    console.log('PortalChat[employee]:', {
      employeeId: customerRow.assigned_employee_id,
      found: !!employeeProfile,
      profile: employeeProfile,
      error: empError?.message || 'none'
    });

    (customerRow as any).user_profiles = employeeProfile;
  }

  // No auto-assignment workarounds; if no employee assigned, chat input stays disabled in UI
  // Note: Chat messages are now fetched by the component based on active channel

  console.log('PortalChat[ready]: customer id=', customerRow.id, 'has employee=', !!customerRow.assigned_employee_id);

  // Get available employees for assignment (empty for now, not used)
  const availableEmployees: any[] = [];

  return (
    <CustomerChatView
      customer={customerRow as any}
      chatMessages={[]} // Component fetches messages by channel
      availableEmployees={availableEmployees}
      currentUser={user}
    />
  );
}
