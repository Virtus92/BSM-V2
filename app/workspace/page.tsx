import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EmployeeWorkspaceView } from '@/components/workspace/EmployeeWorkspaceView';
import { logger } from '@/lib/logger';

interface WorkspaceData {
  totalCustomers: number;
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  myTasks: number;
  recentRequests: Array<{
    id: string;
    name: string;
    subject: string;
    status: string;
    created_at: string;
    company?: string;
    email?: string;
  }>;
}

async function getEmployeeWorkspaceData(userId: string, userType: string): Promise<WorkspaceData> {
  const supabase = await createClient();

  try {
    // Get basic stats using RLS-enabled queries
    const [
      { count: customersCount, error: customersError },
      { data: requests, error: requestsError },
      { data: tasks, error: tasksError },
      { data: recentRequests, error: recentError }
    ] = await Promise.all([
      // Customers - RLS will show unassigned + assigned
      supabase
        .from('customers')
        .select('*', { count: 'exact', head: true }),

      // Requests - RLS will show unassigned + assigned
      supabase
        .from('contact_requests')
        .select('id, status'),

      // Tasks - only active statuses
      supabase
        .from('tasks')
        .select('id, status')
        .or(`assigned_to.eq.${userId},created_by.eq.${userId}`)
        .in('status', ['todo', 'in_progress', 'review']),

      // Recent requests
      supabase
        .from('contact_requests')
        .select('id, name, subject, status, created_at, company, email')
        .order('created_at', { ascending: false })
        .limit(5)
    ]);

    // Log any errors but don't throw
    if (customersError) {
      logger.error('Failed to load customers count', customersError, {
        component: 'Workspace',
        userId
      });
    }
    if (requestsError) {
      logger.error('Failed to load requests', requestsError, {
        component: 'Workspace',
        userId
      });
    }
    if (tasksError) {
      logger.error('Failed to load tasks', tasksError, {
        component: 'Workspace',
        userId
      });
    }
    if (recentError) {
      logger.error('Failed to load recent requests', recentError, {
        component: 'Workspace',
        userId
      });
    }

    logger.debug('Workspace data loaded', {
      component: 'Workspace',
      userId,
      metadata: {
        customersCount,
        requestsCount: requests?.length,
        tasksCount: tasks?.length,
        recentRequestsCount: recentRequests?.length
      }
    });

    // Calculate stats
    const totalRequests = requests?.length || 0;
    const pendingRequests = requests?.filter(r => ['new', 'in_progress'].includes(r.status || 'new')).length || 0;
    const completedRequests = requests?.filter(r => r.status === 'responded').length || 0;

    return {
      totalCustomers: customersCount || 0,
      totalRequests,
      pendingRequests,
      completedRequests,
      myTasks: tasks?.length || 0,
      recentRequests: recentRequests || []
    };
  } catch (error) {
    logger.error('Workspace data loading error', error as Error, {
      component: 'Workspace',
      userId
    });

    // Return empty data on error - page will still render
    return {
      totalCustomers: 0,
      totalRequests: 0,
      pendingRequests: 0,
      completedRequests: 0,
      myTasks: 0,
      recentRequests: []
    };
  }
}

function WorkspaceLoadingSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="space-y-4 w-full max-w-4xl p-6">
        <div className="h-8 bg-gray-800 rounded animate-pulse w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-gray-800 rounded animate-pulse" />
      </div>
    </div>
  );
}

export default async function EmployeeWorkspace() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    logger.warn('Unauthorized workspace access', {
      component: 'Workspace',
      metadata: { error: authError?.message }
    });
    redirect('/auth/login');
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('user_type, is_active, first_name, last_name')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || !['employee', 'admin'].includes(profile.user_type)) {
    logger.error('Profile error in workspace', profileError, {
      component: 'Workspace',
      userId: user.id,
      metadata: {
        hasProfile: !!profile,
        userType: profile?.user_type
      }
    });
    redirect('/auth/login');
  }

  // Load workspace data
  const workspaceData = await getEmployeeWorkspaceData(user.id, profile.user_type);

  return (
    <Suspense fallback={<WorkspaceLoadingSkeleton />}>
      <EmployeeWorkspaceView
        profile={profile}
        data={workspaceData}
      />
    </Suspense>
  );
}
