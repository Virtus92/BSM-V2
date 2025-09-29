import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is customer
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type, first_name, last_name, is_active, created_at')
      .eq('id', user.id)
      .single();

    if (!profile || profile.user_type !== 'customer') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get customer data
    const admin = createAdminClient();
    const { data: customer } = await admin
      .from('customers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      profile: {
        ...profile,
        email: user.email
      },
      customer: customer || null
    });

  } catch (error) {
    console.error('Portal profile GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is customer
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (!profile || profile.user_type !== 'customer') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Parse form data
    const contentType = request.headers.get('content-type') || '';
    let updateData: any = {};

    if (contentType.includes('application/json')) {
      updateData = await request.json();
    } else {
      const form = await request.formData();
      updateData = {
        first_name: form.get('first_name')?.toString().trim(),
        last_name: form.get('last_name')?.toString().trim(),
        email: form.get('email')?.toString().trim(),
        company_name: form.get('company_name')?.toString().trim(),
        phone: form.get('phone')?.toString().trim(),
        address: form.get('address')?.toString().trim()
      };
    }

    const admin = createAdminClient();

    // Update user profile
    const profileUpdate: any = {};
    if (updateData.first_name) profileUpdate.first_name = updateData.first_name;
    if (updateData.last_name) profileUpdate.last_name = updateData.last_name;

    if (Object.keys(profileUpdate).length > 0) {
      await supabase
        .from('user_profiles')
        .update(profileUpdate)
        .eq('id', user.id);
    }

    // Update customer data
    const customerUpdate: any = {};
    if (updateData.email) customerUpdate.email = updateData.email;
    if (updateData.company_name) customerUpdate.company_name = updateData.company_name;
    if (updateData.phone) customerUpdate.phone = updateData.phone;
    if (updateData.address) customerUpdate.address = updateData.address;

    if (Object.keys(customerUpdate).length > 0) {
      // Check if customer record exists
      const { data: existingCustomer } = await admin
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingCustomer) {
        // Update existing customer
        await admin
          .from('customers')
          .update(customerUpdate)
          .eq('user_id', user.id);
      } else {
        // Create new customer record
        await admin
          .from('customers')
          .insert({
            ...customerUpdate,
            user_id: user.id,
            contact_person: `${updateData.first_name || ''} ${updateData.last_name || ''}`.trim(),
            status: 'active'
          });
      }
    }

    // Update auth email if changed
    if (updateData.email && updateData.email !== user.email) {
      await supabase.auth.updateUser({
        email: updateData.email
      });
    }

    return NextResponse.json({ success: true, message: 'Profil erfolgreich aktualisiert' });

  } catch (error) {
    console.error('Portal profile POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}