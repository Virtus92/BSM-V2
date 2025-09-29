import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // EXACT same logic as middleware authenticateUser function
    console.log('Debug - Starting authentication check');

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log('Debug - Auth result:', {
      hasUser: !!user,
      authError: authError?.message,
      userId: user?.id,
      email: user?.email
    });

    if (authError || !user) {
      return NextResponse.json({
        step: 'auth_check',
        result: 'failed',
        authenticated: false,
        error: 'No valid session',
        authError: authError?.message
      });
    }

    // Get user profile and role - EXACT same query as middleware
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_type, is_active, activation_required, activated_at')
      .eq('id', user.id)
      .single();

    console.log('Debug - Profile query result:', {
      userId: user.id,
      profile,
      profileError: profileError?.message,
      hasProfile: !!profile,
      isActive: profile?.is_active,
      userType: profile?.user_type
    });

    if (profileError || !profile) {
      console.log('Debug - No profile found or error, would set inactive');
      return NextResponse.json({
        step: 'profile_check',
        result: 'failed',
        authenticated: true,
        user: {
          id: user.id,
          email: user.email!,
          role: 'customer', // Default role
          isActive: false,
          requiresActivation: true
        },
        profileError: profileError?.message,
        wouldRedirectTo: 'account_inactive'
      });
    }

    const authResult = {
      authenticated: true,
      user: {
        id: user.id,
        email: user.email!,
        role: profile.user_type,
        isActive: profile.is_active,
        requiresActivation: profile.activation_required && !profile.activated_at
      }
    };

    console.log('Debug - Final auth result:', authResult);

    // Check if user would be considered inactive
    if (!authResult.user.isActive) {
      return NextResponse.json({
        step: 'inactive_check',
        result: 'would_redirect',
        authResult,
        wouldRedirectTo: 'account_inactive',
        reason: 'isActive is false'
      });
    }

    return NextResponse.json({
      step: 'success',
      result: 'authenticated',
      authResult,
      wouldRedirectTo: 'none'
    });

  } catch (error) {
    console.error('Debug - Error:', error);
    return NextResponse.json({
      step: 'error',
      result: 'failed',
      error: (error as Error).message
    }, { status: 500 });
  }
}