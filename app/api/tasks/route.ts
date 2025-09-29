import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  ApiResponses,
  withErrorHandling,
  validateRequiredFields
} from '@/lib/api-response';

async function getHandler(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return ApiResponses.unauthorized();

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get('scope') || 'mine'; // mine|all (admin only)

  if (scope === 'all') {
    // Only admins can list all tasks
    const { data: profile } = await supabase.from('user_profiles').select('user_type').eq('id', user.id).single();
    if (profile?.user_type !== 'admin') {
      return ApiResponses.forbidden('Admin access required to view all tasks');
    }
  }

  const query = supabase
    .from('tasks')
    .select('id, title, description, status, priority, due_date, progress_percentage, created_at, created_by, assigned_to, customer_id, contact_request_id')
    .order('created_at', { ascending: false });

  const { data, error } = scope === 'all'
    ? await query
    : await query.or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`);

  if (error) return ApiResponses.databaseError('Failed to fetch tasks', error);
  return ApiResponses.success({ tasks: data || [] });
}

export const GET = withErrorHandling(getHandler);

async function postHandler(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return ApiResponses.unauthorized();

  const body = await request.json();
  const {
    title,
    description,
    priority = 'medium',
    dueDate,
    assignedTo,
    estimatedHours,
    tags
  } = body as {
    title?: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
    dueDate?: string;
    assignedTo?: string;
    estimatedHours?: string | number;
    tags?: string;
  };

  const missingField = validateRequiredFields(body, ['title']);
  if (missingField) {
    return ApiResponses.missingField(missingField);
  }

  // Map non-schema values
  const normalizedPriority = priority === 'critical' ? 'urgent' : priority;

  const insertData: any = {
    title: title.trim(),
    description: description || null,
    priority: normalizedPriority,
    created_by: user.id,
    status: 'todo',
  };

  if (assignedTo) insertData.assigned_to = assignedTo;
  if (dueDate) insertData.due_date = new Date(dueDate).toISOString();
  if (estimatedHours) insertData.estimated_hours = Number(estimatedHours);
  if (tags) insertData.tags = tags.split(',').map((t: string) => t.trim()).filter(Boolean);

  const { data, error } = await supabase.from('tasks').insert(insertData).select('id').single();
  if (error) return ApiResponses.databaseError('Failed to create task', error);

  return ApiResponses.success({ id: data.id }, 'Task created successfully');
}

export const POST = withErrorHandling(postHandler);
