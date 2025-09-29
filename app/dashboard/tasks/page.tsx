import { createClient } from '@/lib/supabase/server';
import { requireAdminUser } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { TaskManagementClient } from '@/components/tasks/TaskManagementClient';

interface TaskData {
  id: string;
  title: string;
  description?: string | null;
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string | null;
  created_at: string;
  updated_at?: string | null;
  assigned_to?: string | null;
  created_by: string;
  estimated_hours?: number | null;
  actual_hours?: number | null;
  progress_percentage?: number | null;
  customer_id?: string | null;
  contact_request_id?: string | null;
}

export default async function TasksManagement() {
  const supabase = await createClient();

  // Check if user is admin
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/auth/login');
  }

  try {
    await requireAdminUser(user.id);
  } catch (error) {
    redirect('/dashboard');
  }

  // Get tasks
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id, title, description, status, priority, due_date, created_at, updated_at, assigned_to, created_by, estimated_hours, actual_hours, progress_percentage, customer_id, contact_request_id')
    .order('created_at', { ascending: false });

  const taskData: TaskData[] = tasks || [];

  if (tasksError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="modern-card border-0 p-6">
            <h2 className="text-white text-xl font-bold mb-2">Fehler beim Laden der Aufgaben</h2>
            <p className="text-gray-400">
              Die Aufgaben konnten nicht geladen werden.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <TaskManagementClient initialTasks={taskData} />;
}
