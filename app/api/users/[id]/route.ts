import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminUser, adminUserOperations, createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate user ID format
    if (!id || typeof id !== 'string' || id.length < 10) {
      return NextResponse.json({
        error: 'Ungültige Benutzer-ID.'
      }, { status: 400 });
    }

    const supabase = await createClient();

    // Check if user is admin
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !currentUser) {
      return NextResponse.json({
        error: 'Nicht authentifiziert. Bitte melden Sie sich an.'
      }, { status: 401 });
    }

    try {
      await requireAdminUser(currentUser.id);
    } catch (error) {
      return NextResponse.json({
        error: 'Keine Berechtigung. Nur Administratoren können Benutzer bearbeiten.'
      }, { status: 403 });
    }

    const body = await request.json();
    const {
      // Basic profile data
      first_name,
      last_name,
      phone,
      user_type,
      is_active,
      notifications_enabled,
      timezone,
      language,

      // Employee data
      employee_id,
      job_title,
      hire_date,
      direct_phone,
      emergency_contact,
      emergency_phone,
      working_hours_per_week,
      performance_rating,

      // Customer data
      company_name,
      contact_person,
      customer_phone,
      address_line1,
      address_line2,
      city,
      postal_code,
      country,
      website,
      industry,
    } = body;

    // Validate user_type if provided
    if (user_type && !['admin', 'employee', 'customer'].includes(user_type)) {
      return NextResponse.json({
        error: 'Ungültiger Benutzertyp. Erlaubt sind: admin, employee, customer.'
      }, { status: 400 });
    }

    // Check if user exists in auth.users first
    let authUser;
    try {
      authUser = await adminUserOperations.getUserById(id);
      if (!authUser?.user) {
        return NextResponse.json({
          error: 'Benutzer nicht gefunden.'
        }, { status: 404 });
      }
    } catch (authUserError) {
      return NextResponse.json({
        error: 'Benutzer nicht gefunden.'
      }, { status: 404 });
    }

    // Use admin client for all database operations
    const adminClient = createAdminClient();

    // Check if user profile exists
    let { data: existingUser, error: userCheckError } = await adminClient
      .from('user_profiles')
      .select('id, user_type')
      .eq('id', id)
      .single();

    // If profile doesn't exist, return error - this should only update existing users
    if (userCheckError?.code === 'PGRST116' || !existingUser) {
      return NextResponse.json({
        error: 'Benutzerprofil nicht gefunden. Kann nur bestehende Benutzer bearbeiten.'
      }, { status: 404 });
    }

    // Update user profile using admin client
    const { error: profileError } = await adminClient
      .from('user_profiles')
      .update({
        first_name,
        last_name,
        phone,
        user_type,
        is_active,
        notifications_enabled,
        timezone,
        language,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (profileError) {
      console.error('Profile update error:', profileError);
      return NextResponse.json({
        error: 'Fehler beim Aktualisieren des Benutzerprofils.'
      }, { status: 500 });
    }

    // Update employee data if user is employee
    if (user_type === 'employee') {
      const { error: employeeError } = await adminClient
        .from('employee_profiles')
        .upsert({
          user_id: id,
          employee_id,
          job_title,
          hire_date: hire_date || null,
          direct_phone,
          emergency_contact,
          emergency_phone,
          working_hours_per_week: working_hours_per_week || 40,
          performance_rating: performance_rating || null,
          is_active,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (employeeError) {
        console.error('Employee update error:', employeeError);
        return NextResponse.json({
          error: 'Benutzerprofil wurde aktualisiert, aber Mitarbeiterdaten konnten nicht gespeichert werden.'
        }, { status: 500 });
      }
    }

    // Update customer data if user is customer
    if (user_type === 'customer') {
      // Get user email for fallback values
      const userEmail = authUser?.user?.email || 'customer@example.com';

      const { error: customerError } = await adminClient
        .from('customers')
        .upsert({
          user_id: id,
          company_name: company_name || contact_person || first_name || last_name || 'Kunde',
          contact_person: contact_person || first_name + ' ' + last_name || 'Unbekannt',
          email: userEmail,
          phone: customer_phone,
          address_line1,
          address_line2,
          city,
          postal_code,
          country: country || 'Österreich',
          website,
          industry,
          status: 'active',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (customerError) {
        console.error('Customer update error:', customerError);
        return NextResponse.json({
          error: 'Benutzerprofil wurde aktualisiert, aber Kundendaten konnten nicht gespeichert werden: ' + customerError.message
        }, { status: 500 });
      }
    }

    // Return updated user data for the frontend
    return NextResponse.json({
      success: true,
      message: 'Benutzer wurde erfolgreich aktualisiert.',
      user: {
        id: id,
        profile: {
          first_name,
          last_name,
          phone,
          user_type,
          is_active
        }
      }
    });
  } catch (error) {
    console.error('API Error:', error);

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