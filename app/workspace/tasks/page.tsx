import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { WorkspaceTasksPageClient } from './client';

export default async function WorkspaceTasksPage() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/auth/login');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('user_type, is_active, first_name, last_name')
    .eq('id', user.id)
    .single();

  if (!profile || !['employee', 'admin'].includes(profile.user_type)) {
    redirect('/auth/login');
  }

  return <WorkspaceTasksPageClient />;
}

