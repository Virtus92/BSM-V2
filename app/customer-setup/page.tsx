import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { CustomerSetupForm } from '@/components/portal/CustomerSetupForm';

export default async function CustomerSetupPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?redirectTo=/customer-setup');
  }

  // Check user role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('user_type, first_name, last_name')
    .eq('id', user.id)
    .single();

  if (!profile || profile.user_type !== 'customer') {
    if (profile?.user_type === 'employee') {
      redirect('/workspace');
    } else if (profile?.user_type === 'admin') {
      redirect('/dashboard');
    } else {
      redirect('/auth/login');
    }
  }

  // Check if customer record already exists
  let { data: existingCustomer } = await supabase
    .from('customers')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  // Also check for unlinked customer by email and try to link
  if (!existingCustomer) {
    const adminClient = createAdminClient();
    const { data: customerByEmail } = await adminClient
      .from('customers')
      .select('*')
      .eq('email', user.email)
      .is('user_id', null)
      .maybeSingle();

    if (customerByEmail) {
      // Try to link the customer
      const { data: linkedCustomer, error: linkError } = await adminClient
        .from('customers')
        .update({
          user_id: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerByEmail.id)
        .select('*')
        .single();

      if (!linkError && linkedCustomer) {
        existingCustomer = linkedCustomer;
      }
    }
  }

  // If customer exists (either found or linked), go to portal
  if (existingCustomer) {
    redirect('/portal');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <CustomerSetupForm
            user={user}
            profile={profile}
          />
        </div>
      </div>
    </div>
  );
}