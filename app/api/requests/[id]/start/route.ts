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

    // Allow admin or employee
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'employee'].includes(profile.user_type)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const admin = createAdminClient();

    // Load request to get subject
    const { data: req, error: reqErr } = await admin
      .from('contact_requests')
      .select('id, subject, status')
      .eq('id', requestId)
      .single();
    if (reqErr || !req) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Find existing task for this user and request
    const { data: existingTask } = await admin
      .from('tasks')
      .select('id, status')
      .eq('contact_request_id', requestId)
      .eq('assigned_to', user.id)
      .order('created_at', { ascending: false })
      .maybeSingle();

    let taskId = existingTask?.id as string | undefined;

    if (!taskId) {
      // Create task for this request assigned to current user
      const { data: created, error: createErr } = await admin
        .from('tasks')
        .insert({
          title: `Bearbeitung: ${req.subject}`,
          description: `Automatisch erstellte Aufgabe für Anfrage: ${req.subject}`,
          assigned_to: user.id,
          assigned_by: user.id,
          contact_request_id: requestId,
          priority: 'medium',
          created_by: user.id,
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .select('id')
        .single();
      if (createErr || !created) {
        return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
      }
      taskId = created.id;
    } else {
      // Update existing task to in_progress
      await admin
        .from('tasks')
        .update({ status: 'in_progress', started_at: new Date().toISOString() })
        .eq('id', taskId);
    }

    // Update request status to in_progress if not already converted/archived
    if (!['converted', 'archived'].includes(req.status)) {
      await admin
        .from('contact_requests')
        .update({ status: 'in_progress', updated_at: new Date().toISOString() })
        .eq('id', requestId);
    }

    return NextResponse.json({ success: true, task_id: taskId });
  } catch (error) {
    console.error('Request start error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

