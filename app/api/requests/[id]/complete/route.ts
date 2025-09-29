import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();
    if (!profile || !['admin', 'employee'].includes(profile.user_type)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const admin = createAdminClient();

    // Mark user's task for this request as done (if exists)
    const { data: userTask } = await admin
      .from('tasks')
      .select('id, status')
      .eq('contact_request_id', requestId)
      .eq('assigned_to', user.id)
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (userTask) {
      await admin
        .from('tasks')
        .update({ status: 'done', progress_percentage: 100, completed_at: new Date().toISOString() })
        .eq('id', userTask.id);
    }

    // Update request status to responded (if not converted/archived)
    const { data: req } = await admin
      .from('contact_requests')
      .select('status')
      .eq('id', requestId)
      .single();

    if (req && !['converted', 'archived'].includes(req.status)) {
      await admin
        .from('contact_requests')
        .update({ status: 'responded', updated_at: new Date().toISOString() })
        .eq('id', requestId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Request complete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

