import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { CustomerPortalNav } from '@/components/portal/CustomerPortalNav';

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Basic authentication check - middleware handles role-based access control
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/login?redirectTo=/portal');
  }

  // Trust that middleware has already validated user role and permissions
  // Middleware redirects non-customers away from /portal routes

  // Get customer data
  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  // If no customer, redirect to setup (let customer-setup handle the logic)
  if (!customer) {
    redirect('/customer-setup');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      <CustomerPortalNav user={user} customer={customer} />
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}