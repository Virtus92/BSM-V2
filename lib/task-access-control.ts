import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Central definition of which task statuses grant temporary access
// Adjust here if product policy changes.
// Only tasks that are actually being worked on grant access
export const ACTIVE_TASK_STATUSES: ReadonlyArray<string> = ['in_progress', 'review', 'blocked'] as const;

/**
 * Check if a user has temporary access to a customer/request through active tasks
 * Employees get access to linked customers/requests when working on tasks (status: in_progress)
 */
export interface TaskAccessResult {
  hasAccess: boolean;
  reason: 'admin' | 'direct_assignment' | 'task_access' | 'no_access';
  activeTasks?: Array<{
    id: string;
    title: string;
    status: string;
    customer_id?: string | null;
    contact_request_id?: string | null;
  }>;
}

export async function checkTaskBasedAccess(
  userId: string,
  resourceType: 'customer' | 'contact_request',
  resourceId: string
): Promise<TaskAccessResult> {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', userId)
      .single();

    // Admins always have access
    if (profile?.user_type === 'admin') {
      return {
        hasAccess: true,
        reason: 'admin'
      };
    }

    // Check for active tasks that give temporary access
    // Only tasks in ACTIVE_TASK_STATUSES are considered (not done/cancelled)
    const { data: activeTasks } = await admin
      .from('tasks')
      .select(`
        id,
        title,
        status,
        customer_id,
        contact_request_id,
        assigned_to
      `)
      .eq('assigned_to', userId)
      .in('status', ACTIVE_TASK_STATUSES as string[])
      .or(
        resourceType === 'customer'
          ? `customer_id.eq.${resourceId}`
          : `contact_request_id.eq.${resourceId}`
      );

    if (activeTasks && activeTasks.length > 0) {
      return {
        hasAccess: true,
        reason: 'task_access',
        activeTasks: activeTasks.map(task => ({
          id: task.id,
          title: task.title,
          status: task.status,
          customer_id: task.customer_id,
          contact_request_id: task.contact_request_id
        }))
      };
    }

    // Check for direct assignment (for customers)
    if (resourceType === 'customer') {
      const { data: customer } = await admin
        .from('customers')
        .select('assigned_employee_id')
        .eq('id', resourceId)
        .single();

      if (customer?.assigned_employee_id === userId) {
        return {
          hasAccess: true,
          reason: 'direct_assignment'
        };
      }
    }

    // Check for direct assignment (for contact requests)
    if (resourceType === 'contact_request') {
      const { data: assignment } = await admin
        .from('request_assignments')
        .select('assigned_to')
        .eq('contact_request_id', resourceId)
        .eq('assigned_to', userId)
        .eq('is_active', true)
        .single();

      if (assignment) {
        return {
          hasAccess: true,
          reason: 'direct_assignment'
        };
      }
    }

    return {
      hasAccess: false,
      reason: 'no_access'
    };

  } catch (error) {
    console.error('Error checking task-based access:', error);
    return {
      hasAccess: false,
      reason: 'no_access'
    };
  }
}

/**
 * Get all customers/requests accessible to a user through active tasks
 */
export async function getUserAccessibleResources(userId: string) {
  try {
    const admin = createAdminClient();

    // Get all active tasks assigned to the user
    // Only tasks in ACTIVE_TASK_STATUSES are considered (not done/cancelled)
    const { data: activeTasks } = await admin
      .from('tasks')
      .select(`
        id,
        title,
        status,
        customer_id,
        contact_request_id,
        customers:customer_id (
          id, company_name, contact_person
        ),
        contact_requests:contact_request_id (
          id, subject, status
        )
      `)
      .eq('assigned_to', userId)
      .in('status', ACTIVE_TASK_STATUSES as string[]);

    const accessibleCustomers = new Set<string>();
    const accessibleRequests = new Set<string>();

    if (activeTasks) {
      activeTasks.forEach(task => {
        if (task.customer_id) {
          accessibleCustomers.add(task.customer_id);
        }
        if (task.contact_request_id) {
          accessibleRequests.add(task.contact_request_id);
        }
      });
    }

    return {
      customerIds: Array.from(accessibleCustomers),
      requestIds: Array.from(accessibleRequests),
      activeTasks: activeTasks || []
    };

  } catch (error) {
    console.error('Error getting accessible resources:', error);
    return {
      customerIds: [],
      requestIds: [],
      activeTasks: []
    };
  }
}

/**
 * Middleware function to check access in API routes
 */
export async function withTaskBasedAccess(
  userId: string,
  resourceType: 'customer' | 'contact_request',
  resourceId: string,
  callback: (accessResult: TaskAccessResult) => Promise<Response>
): Promise<Response> {
  const accessResult = await checkTaskBasedAccess(userId, resourceType, resourceId);
  return callback(accessResult);
}
