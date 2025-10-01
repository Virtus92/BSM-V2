import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SystemSettingsView } from '@/components/settings/SystemSettingsView';

export default async function SystemSettingsPage() {
  const supabase = await createClient();

  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/auth/login');
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('user_type')
    .eq('id', user.id)
    .single();

  if (!profile || profile.user_type !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-3">
              <span className="text-mystery-gradient">Systemeinstellungen</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Konfigurieren Sie Ihr System für optimale Leistung
            </p>
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <div className="fade-in-up">
        <SystemSettingsView />
      </div>
    </div>
  );
}