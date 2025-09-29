import { createClient } from '@/lib/supabase/server';
import { requireAdminUser, createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { UserDetailPageClient } from '@/components/users/UserDetailPageClient';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Save, Shield, Users, User, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { CompleteUserData, getUserDisplayName, getUserRoleInfo, getUserStatusInfo, getUserStats } from '@/lib/user-utils';

interface PageProps {
  params: Promise<{ id: string }>;
}


export default async function UserDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Get current user and their role
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/auth/login');
  }

  // Create admin client for admin operations
  const adminClient = createAdminClient();

  // Get current user's profile to check role using admin client
  const { data: currentUserProfile, error: currentProfileError } = await adminClient
    .from('user_profiles')
    .select('user_type, is_active')
    .eq('id', user.id)
    .single();

  if (currentProfileError || !currentUserProfile?.is_active) {
    redirect('/auth/login');
  }

  // Only admins can view other users' details, employees can only view their own
  if (currentUserProfile.user_type !== 'admin' && user.id !== id) {
    redirect('/dashboard/users');
  }

  // Get user profile first
  const { data: userProfile, error: profileError } = await adminClient
    .from('user_profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (profileError || !userProfile) {
    redirect('/dashboard/users');
  }

  // Get auth user email for request matching
  const { data: { user: authUser } } = await adminClient.auth.admin.getUserById(id);
  const userEmail = authUser?.email;

  // Get complete user data using admin client for all operations
  const [
    { data: customerData, error: customerError },
    { data: employeeData, error: employeeError },
    { data: activityLogs, error: activityError },
    { data: userRequests, error: requestsError },
    { data: userTasks, error: tasksError },
    { data: managedCustomers, error: managedCustomersError },
    { data: assignedRequests, error: assignedRequestsError },
    { data: recentChats, error: recentChatsError }
  ] = await Promise.all([
    adminClient
      .from('customers')
      .select('*')
      .eq('user_id', id)
      .maybeSingle(),
    adminClient
      .from('employee_profiles')
      .select(`
        *,
        departments:departments!employee_profiles_department_id_fkey (
          id, name, manager_id
        )
      `)
      .eq('user_id', id)
      .maybeSingle(),
    adminClient
      .from('user_activity_logs')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
    // Get requests by email for customers, or by customer relationship
    adminClient
      .from('contact_requests')
      .select(`
        *,
        converted_customer:customers!contact_requests_converted_to_customer_id_fkey (
          id, company_name, contact_person, user_id
        )
      `)
      .eq('email', userEmail || '')
      .order('created_at', { ascending: false })
      .limit(10),
    adminClient
      .from('tasks')
      .select(`
        *,
        customers:customer_id (
          id, company_name, contact_person
        ),
        contact_requests:contact_request_id (
          id, subject, status
        )
      `)
      .or(`assigned_to.eq.${id},created_by.eq.${id}`)
      .order('created_at', { ascending: false })
      .limit(20),
    // Managed customers (for employees)
    adminClient
      .from('customers')
      .select('*')
      .eq('assigned_employee_id', id)
      .order('created_at', { ascending: false }),
    // Assigned requests (for employees)
    adminClient
      .from('contact_requests')
      .select(`
        *,
        request_assignments!inner (
          id, assigned_at, priority, estimated_hours, notes
        )
      `)
      .eq('request_assignments.assigned_to', id)
      .eq('request_assignments.is_active', true)
      .order('created_at', { ascending: false }),
    // Recent chat messages - will filter in component based on managed customers
    adminClient
      .from('customer_chat_messages')
      .select(`
        *,
        customers:customer_id (
          company_name, contact_person, assigned_employee_id
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50) // Get more and filter in component
  ]);

  // Get user auth data for the target user (admin only operation)
  let authUserData;
  if (currentUserProfile.user_type === 'admin') {
    try {
      const { data: { user: authUser }, error: authError } = await adminClient.auth.admin.getUserById(id);
      if (authError || !authUser) {
        redirect('/dashboard/users');
      }
      authUserData = authUser;
    } catch (error) {
      redirect('/dashboard/users');
    }
  } else {
    // For non-admin users viewing their own profile, use current auth data
    authUserData = user;
  }

  const completeUser: CompleteUserData = {
    id: authUserData.id,
    email: authUserData.email || '',
    created_at: authUserData.created_at,
    last_sign_in_at: authUserData.last_sign_in_at,
    email_confirmed_at: authUserData.email_confirmed_at,
    profile: profileError ? undefined : userProfile,
    customer: customerError ? undefined : customerData,
    employee: employeeError ? undefined : employeeData
  };

  // Get system stats for admin users only
  let systemStats;
  if (completeUser.profile?.user_type === 'admin' && currentUserProfile.user_type === 'admin') {
    try {
      const { data: allAuthUsers, error: authError } = await adminClient.auth.admin.listUsers();
      if (authError) throw authError;
      const userIds = allAuthUsers.users.map(u => u.id);

      const [
        { data: allProfiles },
        { data: allRequests }
      ] = await Promise.all([
        adminClient.from('user_profiles').select('*').in('id', userIds),
        adminClient.from('contact_requests').select('id, status').limit(1000)
      ]);

      const usersWithProfiles = allAuthUsers.users.map(authUser => ({
        ...authUser,
        profile: allProfiles?.find(p => p.id === authUser.id)
      }));

      const stats = getUserStats(usersWithProfiles as any);

      systemStats = {
        totalUsers: stats.totalUsers,
        activeUsers: stats.activeUsers,
        totalRequests: allRequests?.length || 0,
        pendingRequests: allRequests?.filter(r => r.status === 'pending').length || 0,
        systemHealth: 95 // This could be calculated based on actual metrics
      };
    } catch (error) {
      console.error('Error fetching system stats:', error);
      systemStats = {
        totalUsers: 0,
        activeUsers: 0,
        totalRequests: 0,
        pendingRequests: 0,
        systemHealth: 100
      };
    }
  }

  // Debug logging for errors
  console.log('Database Query Errors:', {
    profileError,
    customerError,
    employeeError,
    activityError,
    requestsError,
    tasksError,
    managedCustomersError,
    assignedRequestsError,
    recentChatsError
  });

  console.log('Database Query Results:', {
    userProfile: userProfile ? 'exists' : 'null',
    customerData: customerData ? 'exists' : 'null',
    employeeData: employeeData ? 'exists' : 'null',
    activityLogs: activityLogs?.length || 0,
    userRequests: userRequests?.length || 0,
    userTasks: userTasks?.length || 0,
    managedCustomers: managedCustomers?.length || 0,
    assignedRequests: assignedRequests?.length || 0,
    recentChats: recentChats?.length || 0
  });

  return (
    <UserDetailPageClient
      user={completeUser}
      employeeProfile={employeeError ? null : (employeeData || null)}
      tasks={tasksError ? [] : (userTasks || [])}
      managedCustomers={managedCustomersError ? [] : (managedCustomers || [])}
      assignedRequests={assignedRequestsError ? [] : (assignedRequests || [])}
      recentChats={recentChatsError ? [] : (recentChats || [])}
      activityLogs={activityError ? [] : (activityLogs || [])}
      userId={id}
    />
  );
}
