import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(
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

    // Check if user is admin or employee
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'employee'].includes(profile.user_type)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // Validate status value
    const validStatuses = ['new', 'in_progress', 'responded', 'converted', 'archived'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Check if request exists
    const { data: contactRequest, error: requestError } = await admin
      .from('contact_requests')
      .select('id, subject, status')
      .eq('id', requestId)
      .single();

    if (requestError || !contactRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Update request status
    const { data: updatedRequest, error: updateError } = await admin
      .from('contact_requests')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) {
      console.error('Request status update error:', updateError);
      return NextResponse.json({ error: 'Failed to update request status' }, { status: 500 });
    }

    // Log the status change
    await admin.from('user_activity_logs').insert({
      user_id: user.id,
      action: 'REQUEST_STATUS_CHANGED',
      resource_type: 'contact_request',
      resource_id: requestId,
      additional_context: {
        request_subject: contactRequest.subject,
        previous_status: contactRequest.status,
        new_status: status
      },
      severity: 'low'
    });

    return NextResponse.json({
      success: true,
      request: updatedRequest,
      message: `Request status updated to ${status}`
    });

  } catch (error) {
    console.error('Request status update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
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

    // Check if user is admin or employee
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'employee'].includes(profile.user_type)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const admin = createAdminClient();

    // Get request with relations
    // Try full detail shape first (without cross-schema profile embeds)
    let { data: contactRequest, error: requestError } = await admin
      .from('contact_requests')
      .select(`
        *,
        request_assignments (
          id, assigned_to, assigned_at, is_active
        ),
        contact_request_notes (
          id, content, is_internal, created_at, created_by
        )
      `)
      .eq('id', requestId)
      .single();

    // Fallback: minimal shape if embed causes errors
    if (requestError) {
      const fallback = await admin
        .from('contact_requests')
        .select('*')
        .eq('id', requestId)
        .single();
      contactRequest = fallback.data;
      requestError = fallback.error as any;
    }

    if (requestError || !contactRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      request: contactRequest
    });

  } catch (error) {
    console.error('Request GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
