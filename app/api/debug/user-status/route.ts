import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        error: 'No authenticated user',
        authError: authError?.message
      });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      profile,
      profileError: profileError?.message,
      hasProfile: !!profile,
      isActive: profile?.is_active,
      userType: profile?.user_type,
      debug: {
        queryExecuted: true,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Server error',
      message: (error as Error).message
    }, { status: 500 });
  }
}