import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { requireAdminUser } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NewAdminDashboardView } from '@/components/admin/NewAdminDashboardView';

async function getAdminDashboardData() {
  const { createAdminClient } = await import('@/lib/supabase/admin');
  const admin = createAdminClient();

  // Get user counts by type - using admin client for full access
  const { data: userCounts } = await admin
    .from('user_profiles')
    .select('user_type');

  // Get task statistics
  const { data: taskStats } = await admin
    .from('tasks')
    .select('status, priority');

  // Get pending requests
  const { data: pendingRequests } = await admin
    .from('contact_requests')
    .select('id, subject, status, priority, created_at')
    .in('status', ['new', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(5);

  // Use same logic as the working /api/admin/users route
  const { data: authUsers } = await admin.auth.admin.listUsers();
  console.log('Auth users from admin.auth:', authUsers?.users?.length || 0);

  let employeeUsers = [];

  if (authUsers?.users && authUsers.users.length > 0) {
    const userIds = authUsers.users.map(u => u.id);
    console.log('User IDs:', userIds);

    const [
      { data: userProfiles },
      { data: employees }
    ] = await Promise.all([
      admin.from('user_profiles').select('*').in('id', userIds),
      admin.from('employee_profiles').select(`
        id, user_id, employee_id, job_title, performance_rating, department_id,
        departments:department_id (name)
      `).in('user_id', userIds)
    ]);

    console.log('User profiles found:', userProfiles?.length || 0);
    console.log('Employee profiles found:', employees?.length || 0);

    // Merge all data together exactly like /api/admin/users
    const completeUsers = authUsers.users.map(authUser => {
      const profile = userProfiles?.find(p => p.id === authUser.id);
      const employeeData = employees?.find(e => e.user_id === authUser.id);

      return {
        id: authUser.id,
        email: authUser.email || '',
        email_confirmed_at: authUser.email_confirmed_at,
        profile,
        employee: employeeData
      };
    });

    console.log('Complete users:', completeUsers.length);
    console.log('User types:', completeUsers.map(u => u.profile?.user_type));

    // Filter for employees like UserKanbanBoard
    employeeUsers = completeUsers
      .filter(user =>
        user.profile?.user_type === 'employee' &&
        user.email_confirmed_at &&
        user.profile?.is_active !== false
      )
      .map(user => ({
        id: user.id,
        first_name: user.profile?.first_name,
        last_name: user.profile?.last_name,
        email: user.email,
        user_type: user.profile?.user_type,
        is_active: user.profile?.is_active,
        employee_profiles: user.employee
      }));

    console.log('Final employee users:', employeeUsers.length);
  }

  return {
    userCounts: userCounts || [],
    taskStats: taskStats || [],
    pendingRequests: pendingRequests || [],
    employeePerformance: employeeUsers || []
  };
}

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  try {
    await requireAdminUser(user.id);
  } catch (error) {
    redirect('/auth/login');
  }

  const dashboardData = await getAdminDashboardData();

  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <NewAdminDashboardView data={dashboardData} />
    </Suspense>
  );
}
