import { createClient } from '@/lib/supabase/server';
import { requireAdminUser } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');
  try {
    await requireAdminUser(user.id);
  } catch {
    redirect('/auth/login');
  }
  redirect('/dashboard/admin');
}

