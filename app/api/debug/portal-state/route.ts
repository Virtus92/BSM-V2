import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ auth: { authenticated: false } }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type, is_active, activation_required, activated_at')
      .eq('id', user.id)
      .maybeSingle();

    const { data: supabaseCustomer } = await supabase
      .from('customers')
      .select('id, user_id, email, status, created_at, updated_at')
      .eq('user_id', user.id)
      .maybeSingle();

    const { data: adminCustomerByUser } = await admin
      .from('customers')
      .select('id, user_id, email, status, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: adminCustomerByEmail } = await admin
      .from('customers')
      .select('id, user_id, email, status, created_at, updated_at')
      .eq('email', user.email)
      .is('user_id', null)
      .maybeSingle();

    const { count: adminCustomerCount } = await admin
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Derive what layout/page would do
    const layoutWouldRedirectToSetup = !supabaseCustomer && !adminCustomerByUser;
    const pageWouldRedirectToSetup = !adminCustomerByUser;

    return NextResponse.json({
      auth: {
        authenticated: true,
        user: { id: user.id, email: user.email },
        profile
      },
      customers: {
        supabaseCustomer,
        adminCustomerByUser,
        adminCustomerByEmail,
        adminCustomerCount
      },
      decisions: {
        layoutWouldRedirectToSetup,
        pageWouldRedirectToSetup
      }
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

