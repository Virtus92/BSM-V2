import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const adminClient = createAdminClient();

    // Get all users from auth
    const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers();

    if (authError) {
      return NextResponse.json({ error: 'Auth error', message: authError.message });
    }

    // Get all user profiles
    const { data: profiles, error: profileError } = await adminClient
      .from('user_profiles')
      .select('*')
      .limit(10);

    if (profileError) {
      return NextResponse.json({ error: 'Profile error', message: profileError.message });
    }

    // Combine data
    const usersWithProfiles = authUsers.users.map(authUser => ({
      auth: {
        id: authUser.id,
        email: authUser.email,
        created_at: authUser.created_at,
        email_confirmed_at: authUser.email_confirmed_at
      },
      profile: profiles?.find(p => p.id === authUser.id) || null
    }));

    return NextResponse.json({
      total_auth_users: authUsers.users.length,
      total_profiles: profiles?.length || 0,
      users: usersWithProfiles,
      debug: {
        first_user_detail: usersWithProfiles[0] || null,
        profiles_sample: profiles?.slice(0, 2) || []
      }
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Server error',
      message: (error as Error).message
    }, { status: 500 });
  }
}