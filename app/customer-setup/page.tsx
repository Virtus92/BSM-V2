import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { CustomerSetupForm } from '@/components/portal/CustomerSetupForm';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

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
    console.log('CustomerSetup: non-customer profile', { hasProfile: !!profile, userType: profile?.user_type });
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

  console.log('CustomerSetup: existingCustomer (user client)', { userId: user.id, found: !!existingCustomer });

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
      console.log('CustomerSetup: linked by email', { linkError: linkError?.message, linked: !!existingCustomer });
    }
  }

  // If customer exists (either found or linked), verify visibility then go to portal
  if (existingCustomer) {
    // Ensure the current user can read the customer row (RLS visibility)
    const { data: visibleCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (visibleCustomer?.id) {
      console.log('CustomerSetup: visibleCustomer true, rendering confirmation');
      // Avoid automatic redirect loop: render confirmation with manual navigation
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
          <div className="container mx-auto px-4 py-16 text-center space-y-6">
            <h1 className="text-3xl font-bold text-white">Kundenprofil vorhanden</h1>
            <p className="text-gray-300">Ihr Kundenprofil ist bereits verknüpft. Sie können direkt zum Portal wechseln.</p>
            <Link href="/portal" className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500">Zum Portal</Link>
          </div>
        </div>
      );
    }
    console.log('CustomerSetup: visibleCustomer false, rendering setup form');
    // Else: fall through to render the setup form (avoid redirect loops)
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
