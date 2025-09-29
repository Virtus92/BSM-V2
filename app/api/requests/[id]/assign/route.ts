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

    // Check if user is admin or employee (for self-assignment)
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'employee'].includes(profile.user_type)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { employeeId, selfAssign = false, priority = 'medium', estimated_hours, notes } = body;

    // Handle self-assignment
    let targetEmployeeId = employeeId;
    if (selfAssign) {
      targetEmployeeId = user.id;
    }

    if (!targetEmployeeId) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Check if request exists
    const { data: contactRequest, error: requestError } = await admin
      .from('contact_requests')
      .select('id, subject, customer_user_id')
      .eq('id', requestId)
      .single();

    if (requestError || !contactRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Check if target employee exists and is active
    const { data: employee, error: employeeError } = await admin
      .from('user_profiles')
      .select('id, first_name, last_name, user_type, is_active')
      .eq('id', targetEmployeeId)
      .eq('is_active', true)
      .single();

    if (employeeError || !employee) {
      return NextResponse.json({ error: 'Zielbenutzer nicht gefunden oder inaktiv' }, { status: 400 });
    }

    // Allow assignment to employees and admins (per request 1)
    if (!['employee', 'admin'].includes(employee.user_type)) {
      return NextResponse.json({ error: 'Nur aktive Mitarbeiter oder Admins können Anfragen zugewiesen bekommen' }, { status: 400 });
    }

    // Check if request is already assigned
    const { data: existingAssignment } = await admin
      .from('request_assignments')
      .select('id')
      .eq('contact_request_id', requestId)
      .eq('is_active', true)
      .maybeSingle();

    if (existingAssignment) {
      return NextResponse.json({ error: 'Request is already assigned' }, { status: 409 });
    }

    // Create assignment
    const { data: assignment, error: assignError } = await admin
      .from('request_assignments')
      .insert({
        contact_request_id: requestId,
        assigned_to: targetEmployeeId,
        assigned_by: user.id,
        priority,
        estimated_hours,
        notes,
        assigned_at: new Date().toISOString(),
        is_active: true
      })
      .select()
      .single();

    if (assignError) {
      console.error('Request assignment error:', assignError);
      return NextResponse.json({ error: 'Failed to assign request' }, { status: 500 });
    }

    // Do not mutate request status here to avoid schema mismatches.

    // Log the assignment
    await admin.from('user_activity_logs').insert({
      user_id: user.id,
      action: 'REQUEST_ASSIGNED',
      resource_type: 'contact_request',
      resource_id: requestId,
      additional_context: {
        request_subject: contactRequest.subject,
        assigned_to: targetEmployeeId,
        assigned_to_name: `${employee.first_name} ${employee.last_name}`,
        self_assigned: selfAssign,
        priority,
        estimated_hours
      },
      severity: 'low'
    });

    return NextResponse.json({
      success: true,
      assignment,
      message: `Request "${contactRequest.subject}" assigned to ${employee.first_name} ${employee.last_name}`
    });

  } catch (error) {
    console.error('Request assignment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (!profile || profile.user_type !== 'admin') {
      return NextResponse.json({ error: 'Access denied - Admin only' }, { status: 403 });
    }

    const admin = createAdminClient();

    // Deactivate assignment
    const { error: unassignError } = await admin
      .from('request_assignments')
      .update({ is_active: false })
      .eq('contact_request_id', requestId)
      .eq('is_active', true);

    if (unassignError) {
      console.error('Request unassignment error:', unassignError);
      return NextResponse.json({ error: 'Failed to unassign request' }, { status: 500 });
    }

    // Do not mutate request status here. Unassignment only deactivates assignment.

    // Log the unassignment
    await admin.from('user_activity_logs').insert({
      user_id: user.id,
      action: 'REQUEST_UNASSIGNED',
      resource_type: 'contact_request',
      resource_id: requestId,
      additional_context: {
        action: 'unassignment'
      },
      severity: 'low'
    });

    return NextResponse.json({
      success: true,
      message: 'Request unassigned successfully'
    });

  } catch (error) {
    console.error('Request unassignment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
