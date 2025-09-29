import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import WorkspaceShell from '@/components/workspace-shell';

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/login?redirectTo=/workspace');
  }

  // Check user role - only employees and admins can access workspace
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('user_type, is_active, first_name, last_name')
    .eq('id', user.id)
    .single();

  if (!profile?.is_active || !['employee', 'admin'].includes(profile.user_type)) {
    redirect('/auth/login'); // Redirect if not employee or admin
  }

  return (
    <WorkspaceShell>
      {children}
    </WorkspaceShell>
  );
}
