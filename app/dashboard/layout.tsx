import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import DashboardShell from "@/components/dashboard-shell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Ensure user profile exists
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Create user profile if it doesn't exist
  if (!userProfile) {
    await supabase
      .from('user_profiles')
      .insert({
        id: user.id,
        user_type: 'customer',
        first_name: user.user_metadata?.full_name?.split(' ')[0] || null,
        last_name: user.user_metadata?.full_name?.split(' ')[1] || null
      });
  }

  // Promote first user to admin if no admin exists yet (single-tenant bootstrap)
  const adminClient = createAdminClient();
  const { count: adminCount } = await adminClient
    .from('user_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('user_type', 'admin');

  if ((adminCount ?? 0) === 0) {
    await adminClient
      .from('user_profiles')
      .upsert({ id: user.id, user_type: 'admin' }, { onConflict: 'id' });
  }

  // Load final user profile to check access
  const { data: finalProfile } = await supabase
    .from('user_profiles')
    .select('user_type')
    .eq('id', user.id)
    .single();

  if (finalProfile?.user_type !== 'admin') {
    redirect('/portal');
  }

  return (
    <DashboardShell>
      {children}
    </DashboardShell>
  );
}
