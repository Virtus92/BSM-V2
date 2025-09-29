import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SetupWizard } from '@/components/setup/SetupWizard';

export default async function SetupPage() {
  const supabase = await createClient();

  // Check if system is already installed
  const { data: systemConfig } = await supabase
    .from('system_config')
    .select('is_installed, first_admin_id')
    .single();

  if (systemConfig?.is_installed) {
    redirect('/auth/login');
  }

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Rising BSM V2 Setup
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Willkommen! Richten Sie Ihr Business Service Management System ein.
              Dieser Prozess erstellt den ersten Administrator und konfiguriert die Sicherheitseinstellungen.
            </p>
          </div>

          {/* Setup Wizard */}
          <SetupWizard currentUser={user} />
        </div>
      </div>
    </div>
  );
}