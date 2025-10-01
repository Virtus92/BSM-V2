import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminUserOperations, requireAdminUser, createAdminClient } from '@/lib/supabase/admin';
import {
  ApiResponses,
  withErrorHandling,
  validateRequiredFields,
  validateEmail
} from '@/lib/api-response';
import { logger } from '@/lib/logger';

// GET users with role filtering
async function getHandler(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return ApiResponses.unauthorized();

  // Check if user has permission
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('user_type')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'employee'].includes(profile.user_type)) {
    return ApiResponses.forbidden('Access denied');
  }

  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  const adminClient = createAdminClient();

  // Build query
  let query = adminClient
    .from('user_profiles')
    .select('id, first_name, last_name, user_type, is_active, created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Apply role filter
  if (role === 'employee') {
    query = query.eq('user_type', 'employee');
  } else if (role === 'admin') {
    query = query.eq('user_type', 'admin');
  } else if (role === 'customer') {
    query = query.eq('user_type', 'customer');
  }

  const { data: users, error } = await query;

  if (error) {
    return ApiResponses.databaseError('Failed to fetch users', error);
  }

  return ApiResponses.success({
    users: users || [],
    pagination: {
      limit,
      offset,
      total: users?.length || 0
    }
  });
}

export async function POST(request: NextRequest) {
  try {
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
        error: 'Keine Berechtigung. Nur Administratoren können Benutzer erstellen.'
      }, { status: 403 });
    }

    const body = await request.json();
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      userType,
      // Employee fields
      jobTitle,
      department,
      employeeId,
      // Customer fields
      companyName,
      industry,
      website,
    } = body;

    // Validate required fields
    if (!email || !password || !userType) {
      return NextResponse.json({
        error: 'E-Mail, Passwort und Benutzertyp sind erforderlich.'
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        error: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.'
      }, { status: 400 });
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json({
        error: 'Das Passwort muss mindestens 6 Zeichen lang sein.'
      }, { status: 400 });
    }

    // Validate user type
    if (!['admin', 'employee', 'customer'].includes(userType)) {
      return NextResponse.json({
        error: 'Ungültiger Benutzertyp. Erlaubt sind: admin, employee, customer.'
      }, { status: 400 });
    }

    // Create user in Supabase Auth using admin operations
    let createUserResult;
    try {
      createUserResult = await adminUserOperations.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm admin-created users
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
        }
      });
    } catch (error: any) {
      logger.error('Auth user creation error', error, {
        component: 'API',
        userId: currentUser.id,
        metadata: { endpoint: '/api/users', method: 'POST', email }
      });

      // Handle specific Supabase errors
      if (error.message?.includes('already registered')) {
        return NextResponse.json({
          error: 'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits.'
        }, { status: 409 });
      }

      if (error.message?.includes('weak_password')) {
        return NextResponse.json({
          error: 'Das Passwort ist zu schwach. Bitte verwenden Sie ein stärkeres Passwort.'
        }, { status: 400 });
      }

      return NextResponse.json({
        error: 'Fehler beim Erstellen des Benutzerkontos. Bitte versuchen Sie es erneut.'
      }, { status: 500 });
    }

    if (!createUserResult.user) {
      return NextResponse.json({
        error: 'Benutzerkonto konnte nicht erstellt werden. Bitte versuchen Sie es erneut.'
      }, { status: 500 });
    }

    const newUserId = createUserResult.user.id;

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: newUserId,
        first_name: firstName,
        last_name: lastName,
        phone,
        user_type: userType,
        is_active: true,
        notifications_enabled: true,
        timezone: 'Europe/Berlin',
        language: 'de',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      logger.error('Profile creation error', profileError, {
        component: 'API',
        userId: currentUser.id,
        metadata: { endpoint: '/api/users', method: 'POST', newUserId, email }
      });
      // Try to clean up the auth user if profile creation failed
      try {
        await adminUserOperations.deleteUser(newUserId);
      } catch (cleanupError) {
        logger.error('Failed to cleanup user after profile creation error', cleanupError as Error, {
          component: 'API',
          userId: currentUser.id,
          metadata: { endpoint: '/api/users', method: 'POST', newUserId }
        });
      }
      return NextResponse.json({
        error: 'Fehler beim Erstellen des Benutzerprofils. Das Benutzerkonto wurde rückgängig gemacht.'
      }, { status: 500 });
    }

    // Create role-specific data
    if (userType === 'employee') {
      const { error: employeeError } = await supabase
        .from('employee_profiles')
        .insert({
          user_id: newUserId,
          employee_id: employeeId || null,
          job_title: jobTitle || null,
          hire_date: new Date().toISOString().split('T')[0], // Today's date
          working_hours_per_week: 40,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (employeeError) {
        logger.error('Employee creation error', employeeError, {
          component: 'API',
          userId: currentUser.id,
          metadata: { endpoint: '/api/users', method: 'POST', newUserId, email }
        });
        return NextResponse.json({
          error: 'Benutzer wurde erstellt, aber Mitarbeiterprofil konnte nicht angelegt werden.'
        }, { status: 500 });
      }
    }

    if (userType === 'customer') {
      const { error: customerError } = await supabase
        .from('customers')
        .insert({
          user_id: newUserId,
          company_name: companyName || null,
          contact_person: `${firstName} ${lastName}`.trim(),
          website: website || null,
          industry: industry || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (customerError) {
        logger.error('Customer creation error', customerError, {
          component: 'API',
          userId: currentUser.id,
          metadata: { endpoint: '/api/users', method: 'POST', newUserId, email }
        });
        return NextResponse.json({
          error: 'Benutzer wurde erstellt, aber Kundenprofil konnte nicht angelegt werden.'
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUserId,
        email,
        user_type: userType,
      }
    });
  } catch (error) {
    logger.error('Users API error', error as Error, {
      component: 'API',
      metadata: { endpoint: '/api/users', method: 'POST' }
    });

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

export const GET = withErrorHandling(getHandler);
