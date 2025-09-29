import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const adminClient = createAdminClient();

    // Get first few users auth data
    const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers();

    if (authError) {
      return NextResponse.json({ error: 'Auth error', message: authError.message });
    }

    const userIds = authUsers.users.slice(0, 3).map(u => u.id);

    // Test profile access with admin client
    const { data: userProfiles, error: profilesError } = await adminClient
      .from('user_profiles')
      .select('*')
      .in('id', userIds);

    // Get customers and employees
    const [
      { data: customers, error: customersError },
      { data: employees, error: employeesError }
    ] = await Promise.all([
      adminClient.from('customers').select('*').in('user_id', userIds),
      adminClient.from('employee_profiles').select('*').in('user_id', userIds)
    ]);

    // Create complete user objects
    const completeUsers = authUsers.users.slice(0, 3).map(authUser => {
      const profile = userProfiles?.find(p => p.id === authUser.id);
      const customerData = customers?.find(c => c.user_id === authUser.id);
      const employeeData = employees?.find(e => e.user_id === authUser.id);

      return {
        id: authUser.id,
        email: authUser.email,
        profile: profile || null,
        customer: customerData || null,
        employee: employeeData || null,
        hasProfile: !!profile,
        userType: profile?.user_type || 'undefined',
        isActive: profile?.is_active || false
      };
    });

    return NextResponse.json({
      success: true,
      total_auth_users: authUsers.users.length,
      total_profiles: userProfiles?.length || 0,
      total_customers: customers?.length || 0,
      total_employees: employees?.length || 0,
      errors: {
        profiles: profilesError?.message || null,
        customers: customersError?.message || null,
        employees: employeesError?.message || null
      },
      sample_users: completeUsers,
      analysis: {
        all_users_have_profiles: completeUsers.every(u => u.hasProfile),
        user_types_found: [...new Set(completeUsers.map(u => u.userType))],
        admin_client_working: !profilesError
      }
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Server error',
      message: (error as Error).message
    }, { status: 500 });
  }
}