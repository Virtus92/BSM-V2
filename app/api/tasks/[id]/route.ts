import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET single task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  // Get user role for permission check
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('user_type')
    .eq('id', user.id)
    .single();

  const { data: task, error } = await supabase
    .from('tasks')
    .select(`
      *,
      customers:customer_id (
        id, company_name, contact_person
      ),
      contact_requests:contact_request_id (
        id, subject, status
      ),
      assignee:assigned_to (
        first_name, last_name, email
      ),
      creator:created_by (
        first_name, last_name, email
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  // Check permissions: admin, assigned user, or creator
  const isAdmin = profile?.user_type === 'admin';
  const isAssigned = task.assigned_to === user.id;
  const isCreator = task.created_by === user.id;

  if (!isAdmin && !isAssigned && !isCreator) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ task });
}

// PATCH update task
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  // Get user role and existing task for permission check
  const [{ data: profile }, { data: existingTask }] = await Promise.all([
    supabase.from('user_profiles').select('user_type').eq('id', user.id).single(),
    supabase.from('tasks').select('assigned_to, created_by').eq('id', id).single()
  ]);

  if (!existingTask) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  // Check permissions
  const isAdmin = profile?.user_type === 'admin';
  const isAssigned = existingTask.assigned_to === user.id;
  const isCreator = existingTask.created_by === user.id;

  if (!isAdmin && !isAssigned && !isCreator) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Prepare update data
  const updateData: any = {
    updated_at: new Date().toISOString()
  };

  // Allow specific fields to be updated
  const allowedFields = [
    'title', 'description', 'status', 'priority',
    'due_date', 'estimated_hours', 'actual_hours',
    'progress_percentage', 'assigned_to', 'customer_id',
    'contact_request_id'
  ];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  // Handle special cases
  if (body.dueDate) updateData.due_date = new Date(body.dueDate).toISOString();
  if (body.assignedTo) updateData.assigned_to = body.assignedTo;
  if (body.estimatedHours) updateData.estimated_hours = Number(body.estimatedHours);
  if (body.actualHours) updateData.actual_hours = Number(body.actualHours);

  const { data, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Task update error:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }

  return NextResponse.json({ task: data });
}

// DELETE task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  // Get user role and existing task for permission check
  const [{ data: profile }, { data: existingTask }] = await Promise.all([
    supabase.from('user_profiles').select('user_type').eq('id', user.id).single(),
    supabase.from('tasks').select('assigned_to, created_by').eq('id', id).single()
  ]);

  if (!existingTask) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  // Check permissions: only admin or creator can delete
  const isAdmin = profile?.user_type === 'admin';
  const isCreator = existingTask.created_by === user.id;

  if (!isAdmin && !isCreator) {
    return NextResponse.json({ error: 'Forbidden - only creator or admin can delete' }, { status: 403 });
  }

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Task deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}