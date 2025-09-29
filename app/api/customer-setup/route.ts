import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({
        error: 'Nicht authentifiziert. Bitte melden Sie sich an.'
      }, { status: 401 });
    }

    // Verify user is a customer
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (!profile || profile.user_type !== 'customer') {
      return NextResponse.json({
        error: 'Nur Kunden können das Setup verwenden.'
      }, { status: 403 });
    }

    // Check if customer record already exists
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingCustomer) {
      return NextResponse.json({
        error: 'Kundenprofil existiert bereits.'
      }, { status: 409 });
    }

    const body = await request.json();
    const {
      company_name,
      contact_person,
      industry,
      website,
      email,
      phone,
      address_line1,
      address_line2,
      city,
      postal_code,
      country,
      description,
      how_heard,
      special_requirements
    } = body;

    // Validate required fields
    if (!company_name || !contact_person || !email || !city) {
      return NextResponse.json({
        error: 'Bitte füllen Sie alle Pflichtfelder aus.'
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        error: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.'
      }, { status: 400 });
    }

    // Use admin client to create customer record (bypasses RLS and trigger issues)
    const adminClient = createAdminClient();

    // First, check if email is already in use by another customer
    const { data: emailCheck } = await adminClient
      .from('customers')
      .select('id, user_id')
      .eq('email', email)
      .maybeSingle();

    if (emailCheck && emailCheck.user_id && emailCheck.user_id !== user.id) {
      return NextResponse.json({
        error: 'Diese E-Mail-Adresse wird bereits von einem anderen Kunden verwendet.'
      }, { status: 409 });
    }

    // Create customer record
    const { data: customer, error: createError } = await adminClient
      .from('customers')
      .insert({
        user_id: user.id,
        company_name,
        contact_person,
        industry,
        website,
        email,
        phone,
        address_line1,
        address_line2,
        city,
        postal_code,
        country: country || 'Österreich',
        status: 'active',
        additional_info: {
          description,
          how_heard,
          special_requirements,
          setup_completed_at: new Date().toISOString()
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id, company_name')
      .single();

    if (createError) {
      console.error('Customer creation error:', createError);

      // Handle specific errors
      if (createError.code === '23505') {
        if (createError.message.includes('email')) {
          return NextResponse.json({
            error: 'Diese E-Mail-Adresse wird bereits verwendet.'
          }, { status: 409 });
        }
      }

      return NextResponse.json({
        error: 'Fehler beim Erstellen des Kundenprofils. Bitte versuchen Sie es erneut.'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Kundenprofil wurde erfolgreich erstellt.',
      customer: {
        id: customer.id,
        company_name: customer.company_name
      }
    });

  } catch (error) {
    console.error('Setup API Error:', error);

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json({
        error: 'Ungültige Anfragedaten. Bitte überprüfen Sie Ihre Eingaben.'
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.'
    }, { status: 500 });
  }
}