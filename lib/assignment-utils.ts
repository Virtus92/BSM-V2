import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { TaskAssignee } from '@/lib/task-utils';

// ============================================================================
// TYPES
// ============================================================================

export interface AssigneeOption {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  user_type: 'admin' | 'employee' | 'customer';
  is_active: boolean;
  job_title?: string;
  department?: string;
}

export interface AssignmentResult {
  success: boolean;
  error?: string;
  assignee?: TaskAssignee;
}

// ============================================================================
// ASSIGNEE FETCHING
// ============================================================================

/**
 * Holt einen einzelnen Assignee basierend auf der User ID
 */
export async function getTaskAssignee(userId: string): Promise<TaskAssignee | null> {
  try {
    const supabase = await createClient();

    const { data: user, error } = await supabase
      .from('user_profiles')
      .select(`
        id,
        first_name,
        last_name,
        avatar_url,
        user_type,
        is_active
      `)
      .eq('id', userId)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      console.error('Error fetching task assignee:', error);
      return null;
    }

    // Hole auch auth user data für email
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);

    return {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: authUser?.user?.email || '',
      avatar_url: user.avatar_url
    };
  } catch (error) {
    console.error('Error in getTaskAssignee:', error);
    return null;
  }
}

/**
 * Holt alle verfügbaren Assignees (Admins und Employees)
 */
export async function getAvailableAssignees(): Promise<AssigneeOption[]> {
  try {
    const admin = createAdminClient();

    // Hole alle Auth-User
    const { data: authUsers, error: authError } = await admin.auth.admin.listUsers();
    if (authError || !authUsers?.users) {
      console.error('Error fetching auth users:', authError);
      return [];
    }

    const userIds = authUsers.users.map(u => u.id);

    // Hole User Profiles und Employee Daten
    const [
      { data: userProfiles, error: profilesError },
      { data: employees, error: employeesError }
    ] = await Promise.all([
      admin
        .from('user_profiles')
        .select('id, first_name, last_name, avatar_url, user_type, is_active')
        .in('id', userIds)
        .in('user_type', ['admin', 'employee'])
        .eq('is_active', true),
      admin
        .from('employee_profiles')
        .select(`
          user_id,
          job_title,
          is_active,
          departments!employee_profiles_department_id_fkey (name)
        `)
        .in('user_id', userIds)
        .eq('is_active', true)
    ]);

    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError);
      return [];
    }

    // Kombiniere alle Daten
    const assignees: AssigneeOption[] = [];

    for (const authUser of authUsers.users) {
      const profile = userProfiles?.find(p => p.id === authUser.id);
      const employee = employees?.find(e => e.user_id === authUser.id);

      if (profile && ['admin', 'employee'].includes(profile.user_type) && profile.is_active) {
        const name = [profile.first_name, profile.last_name]
          .filter(Boolean)
          .join(' ') || authUser.email || 'Unbekannt';

        assignees.push({
          id: authUser.id,
          name,
          email: authUser.email || '',
          avatar_url: profile.avatar_url,
          user_type: profile.user_type as 'admin' | 'employee',
          is_active: profile.is_active,
          job_title: employee?.job_title,
          department: employee?.departments?.name
        });
      }
    }

    // Sortiere: Admins zuerst, dann Employees, dann alphabetisch
    return assignees.sort((a, b) => {
      if (a.user_type !== b.user_type) {
        return a.user_type === 'admin' ? -1 : 1;
      }
      return a.name.localeCompare(b.name, 'de');
    });

  } catch (error) {
    console.error('Error in getAvailableAssignees:', error);
    return [];
  }
}

/**
 * Holt Assignees für spezifische User Types
 */
export async function getAssigneesByType(userTypes: ('admin' | 'employee')[]): Promise<AssigneeOption[]> {
  const allAssignees = await getAvailableAssignees();
  return allAssignees.filter(assignee => userTypes.includes(assignee.user_type));
}

// ============================================================================
// ASSIGNMENT OPERATIONS
// ============================================================================

/**
 * Weist einen Task einem User zu
 */
export async function assignTask(taskId: string, assigneeId: string, assignedByUserId: string): Promise<AssignmentResult> {
  try {
    const supabase = await createClient();

    // Prüfe ob Assignee existiert und aktiv ist
    const assignee = await getTaskAssignee(assigneeId);
    if (!assignee) {
      return {
        success: false,
        error: 'Zugewiesener Benutzer nicht gefunden oder inaktiv'
      };
    }

    // Update Task
    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        assigned_to: assigneeId,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (updateError) {
      console.error('Error assigning task:', updateError);
      return {
        success: false,
        error: 'Fehler beim Zuweisen der Aufgabe'
      };
    }

    // Log Activity
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: assignedByUserId,
        action: 'TASK_ASSIGNED',
        resource_type: 'task',
        resource_id: taskId,
        additional_context: {
          assigned_to: assigneeId,
          assigned_to_name: assignee.first_name && assignee.last_name
            ? `${assignee.first_name} ${assignee.last_name}`
            : assignee.email
        },
        severity: 'low'
      });

    return {
      success: true,
      assignee
    };

  } catch (error) {
    console.error('Error in assignTask:', error);
    return {
      success: false,
      error: 'Unerwarteter Fehler beim Zuweisen'
    };
  }
}

/**
 * Entfernt die Zuweisung eines Tasks
 */
export async function unassignTask(taskId: string, unassignedByUserId: string): Promise<AssignmentResult> {
  try {
    const supabase = await createClient();

    // Update Task
    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        assigned_to: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (updateError) {
      console.error('Error unassigning task:', updateError);
      return {
        success: false,
        error: 'Fehler beim Entfernen der Zuweisung'
      };
    }

    // Log Activity
    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: unassignedByUserId,
        action: 'TASK_UNASSIGNED',
        resource_type: 'task',
        resource_id: taskId,
        severity: 'low'
      });

    return {
      success: true
    };

  } catch (error) {
    console.error('Error in unassignTask:', error);
    return {
      success: false,
      error: 'Unerwarteter Fehler beim Entfernen der Zuweisung'
    };
  }
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Weist mehrere Tasks einem User zu
 */
export async function bulkAssignTasks(
  taskIds: string[],
  assigneeId: string,
  assignedByUserId: string
): Promise<{ success: boolean; successCount: number; errors: string[] }> {
  const results = await Promise.allSettled(
    taskIds.map(taskId => assignTask(taskId, assigneeId, assignedByUserId))
  );

  const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const errors = results
    .filter(r => r.status === 'fulfilled' && !r.value.success)
    .map(r => r.status === 'fulfilled' ? r.value.error : 'Unbekannter Fehler')
    .filter(Boolean) as string[];

  return {
    success: successCount === taskIds.length,
    successCount,
    errors
  };
}

/**
 * Entfernt Zuweisungen von mehreren Tasks
 */
export async function bulkUnassignTasks(
  taskIds: string[],
  unassignedByUserId: string
): Promise<{ success: boolean; successCount: number; errors: string[] }> {
  const results = await Promise.allSettled(
    taskIds.map(taskId => unassignTask(taskId, unassignedByUserId))
  );

  const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const errors = results
    .filter(r => r.status === 'fulfilled' && !r.value.success)
    .map(r => r.status === 'fulfilled' ? r.value.error : 'Unbekannter Fehler')
    .filter(Boolean) as string[];

  return {
    success: successCount === taskIds.length,
    successCount,
    errors
  };
}

// ============================================================================
// ASSIGNMENT ANALYTICS
// ============================================================================

/**
 * Holt Assignment-Statistiken für einen User
 */
export async function getAssignmentStats(userId: string) {
  try {
    const supabase = await createClient();

    const [
      { count: assignedTasks },
      { count: completedTasks },
      { count: overdueTasks }
    ] = await Promise.all([
      supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('assigned_to', userId)
        .not('status', 'in', '(done,cancelled)'),
      supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('assigned_to', userId)
        .eq('status', 'done'),
      supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('assigned_to', userId)
        .lt('due_date', new Date().toISOString())
        .not('status', 'in', '(done,cancelled)')
    ]);

    return {
      assignedTasks: assignedTasks || 0,
      completedTasks: completedTasks || 0,
      overdueTasks: overdueTasks || 0
    };

  } catch (error) {
    console.error('Error in getAssignmentStats:', error);
    return {
      assignedTasks: 0,
      completedTasks: 0,
      overdueTasks: 0
    };
  }
}

/**
 * Holt Workload-Verteilung aller Assignees
 */
export async function getWorkloadDistribution(): Promise<Array<{
  assignee: AssigneeOption;
  taskCount: number;
  overdueCount: number;
  completedCount: number;
}>> {
  try {
    const assignees = await getAvailableAssignees();
    const workload = await Promise.all(
      assignees.map(async (assignee) => {
        const stats = await getAssignmentStats(assignee.id);
        return {
          assignee,
          taskCount: stats.assignedTasks,
          overdueCount: stats.overdueTasks,
          completedCount: stats.completedTasks
        };
      })
    );

    // Sortiere nach Task-Anzahl (höchste zuerst)
    return workload.sort((a, b) => b.taskCount - a.taskCount);

  } catch (error) {
    console.error('Error in getWorkloadDistribution:', error);
    return [];
  }
}

// ============================================================================
// DISPLAY UTILITIES
// ============================================================================

/**
 * Formatiert Assignee-Namen für Anzeige
 */
export function formatAssigneeName(assignee: TaskAssignee | AssigneeOption | null): string {
  if (!assignee) return 'Nicht zugewiesen';

  const name = 'name' in assignee
    ? assignee.name
    : [assignee.first_name, assignee.last_name].filter(Boolean).join(' ');

  return name || assignee.email || 'Unbekannt';
}

/**
 * Generiert Initialen für Avatar
 */
export function getAssigneeInitials(assignee: TaskAssignee | AssigneeOption | null): string {
  if (!assignee) return '?';

  const name = formatAssigneeName(assignee);
  if (name === 'Nicht zugewiesen' || name === 'Unbekannt') return '?';

  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Holt Farbe basierend auf User Type
 */
export function getAssigneeColor(assignee: AssigneeOption | null): string {
  if (!assignee) return 'bg-gray-500';

  switch (assignee.user_type) {
    case 'admin':
      return 'bg-red-500';
    case 'employee':
      return 'bg-blue-500';
    default:
      return 'bg-gray-500';
  }
}