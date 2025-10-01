import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CustomerPortalNav } from '@/components/portal/CustomerPortalNav';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface Customer {
  id: string;
  company_name: string;
  contact_person: string | null;
  email: string | null;
}

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Authentication check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    logger.warn('Unauthorized portal layout access', { component: 'PortalLayout' });
    redirect('/auth/login?redirectTo=/portal');
  }

  // Get customer data using RLS-enabled client
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id, company_name, contact_person, email')
    .eq('user_id', user.id)
    .maybeSingle();

  if (customerError) {
    logger.error('Failed to load customer in portal layout', customerError, {
      component: 'PortalLayout',
      userId: user.id
    });
  }

  logger.debug('Portal layout customer check', {
    component: 'PortalLayout',
    userId: user.id,
    metadata: { hasCustomer: !!customer }
  });

  // If no customer, redirect to setup
  if (!customer) {
    redirect('/customer-setup');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      <CustomerPortalNav user={user} customer={customer as Customer} />
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
