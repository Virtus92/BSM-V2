import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test with the admin user JWT token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!;

    // Create client and set auth manually for testing
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get admin user info first
    const adminUserId = 'bf69ec6d-9b69-4067-97ba-b4a5087a5fc0'; // admin from previous query

    // Test 1: Can we read the admin's own profile without auth?
    const { data: profileNoAuth, error: errorNoAuth } = await supabase
      .from('user_profiles')
      .select('user_type, is_active')
      .eq('id', adminUserId)
      .single();

    // Test 2: Test the helper functions
    const { data: isAdminResult, error: isAdminError } = await supabase
      .rpc('is_admin_direct');

    const { data: roleResult, error: roleError } = await supabase
      .rpc('get_user_role_direct');

    return NextResponse.json({
      adminUserId,
      tests: {
        profile_without_auth: {
          data: profileNoAuth,
          error: errorNoAuth?.message,
          success: !errorNoAuth
        },
        is_admin_function: {
          data: isAdminResult,
          error: isAdminError?.message,
          success: !isAdminError
        },
        get_role_function: {
          data: roleResult,
          error: roleError?.message,
          success: !roleError
        }
      },
      analysis: {
        can_read_profiles_without_auth: !errorNoAuth,
        helper_functions_work: !isAdminError && !roleError,
        likely_issue: errorNoAuth ? 'RLS blocks anonymous access' : 'Auth session issue'
      }
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Server error',
      message: (error as Error).message
    }, { status: 500 });
  }
}