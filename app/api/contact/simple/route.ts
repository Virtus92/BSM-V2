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

    // Check if user is admin or employee
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'employee'].includes(profile.user_type)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    const admin = createAdminClient();

    // Simple query without complex joins to avoid schema issues
    const { data: requests, error: requestsError } = await admin
      .from('contact_requests')
      .select(`
        id,
        subject,
        status,
        priority,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (requestsError) {
      console.error('Simple requests fetch error:', requestsError);
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }

    return NextResponse.json({
      requests: requests || [],
      total: requests?.length || 0
    });

  } catch (error) {
    console.error('Simple requests GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}