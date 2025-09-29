import { createClient } from '@/lib/supabase/server';
import { requireAdminUser, createAdminClient } from '@/lib/supabase/admin';
import { redirect, notFound } from 'next/navigation';
import { TaskDetailView } from '@/components/tasks/TaskDetailView';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TaskDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/auth/login');
  }

  // Get user profile for permissions
  const { data: currentUserProfile } = await supabase
    .from('user_profiles')
    .select('user_type, is_active')
    .eq('id', user.id)
    .single();

  if (!currentUserProfile?.is_active) {
    redirect('/auth/login');
  }

  // Use admin client for comprehensive data access
  const adminClient = createAdminClient();

  // Get complete task data with all relations
  const { data: task, error: taskError } = await adminClient
    .from('tasks')
    .select(`
      *,
      customers:customer_id (
        id, company_name, contact_person, email, phone, status, industry
      ),
      contact_requests:contact_request_id (
        id, subject, message, status, priority, created_at, name, email
      ),
      assignee:assigned_to (
        id, first_name, last_name, email, user_type
      ),
      creator:created_by (
        id, first_name, last_name, email, user_type
      )
    `)
    .eq('id', id)
    .single();

  if (taskError || !task) {
    notFound();
  }

  // Check permissions: admin, assigned user, or creator
  const isAdmin = currentUserProfile.user_type === 'admin';
  const isAssigned = task.assigned_to === user.id;
  const isCreator = task.created_by === user.id;

  if (!isAdmin && !isAssigned && !isCreator) {
    redirect('/dashboard/tasks');
  }

  // Get additional context data
  const [
    { data: taskComments },
    { data: relatedTasks },
    { data: activityLogs },
    { data: availableUsers },
    { data: availableCustomers },
    { data: availableRequests }
  ] = await Promise.all([
    // Task comments/notes (if you have a comments system)
    adminClient
      .from('task_comments')
      .select(`
        id, content, created_at,
        user:created_by (first_name, last_name, email)
      `)
      .eq('task_id', id)
      .order('created_at', { ascending: false })
      .limit(20),

    // Related tasks (same customer or request)
    adminClient
      .from('tasks')
      .select('id, title, status, priority, due_date')
      .or(`customer_id.eq.${task.customer_id || 'null'},contact_request_id.eq.${task.contact_request_id || 'null'}`)
      .neq('id', id)
      .limit(10),

    // Activity logs for this task
    adminClient
      .from('user_activity_logs')
      .select('*')
      .eq('entity_id', id)
      .eq('entity_type', 'task')
      .order('created_at', { ascending: false })
      .limit(20),

    // Available users for reassignment (employees only)
    adminClient
      .from('user_profiles')
      .select('id, first_name, last_name, email')
      .eq('user_type', 'employee')
      .eq('is_active', true),

    // Available customers for linking
    adminClient
      .from('customers')
      .select('id, company_name, contact_person')
      .eq('status', 'active')
      .limit(50),

    // Available unassigned requests
    adminClient
      .from('contact_requests')
      .select('id, subject, status, priority')
      .in('status', ['new', 'in_progress'])
      .limit(50)
  ]);

  return (
    <TaskDetailView
      task={task}
      currentUser={user}
      currentUserProfile={currentUserProfile}
      comments={taskComments || []}
      relatedTasks={relatedTasks || []}
      activityLogs={activityLogs || []}
      availableUsers={availableUsers || []}
      availableCustomers={availableCustomers || []}
      availableRequests={availableRequests || []}
      canEdit={isAdmin || isAssigned || isCreator}
      canDelete={isAdmin || isCreator}
    />
  );
}