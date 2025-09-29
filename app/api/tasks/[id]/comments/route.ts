import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  ApiResponses,
  withErrorHandling,
  validateRequiredFields
} from '@/lib/api-response';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET task comments
async function getHandler(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return ApiResponses.unauthorized();

  const { id } = await params;

  // Check if user can access this task
  const { data: task } = await supabase
    .from('tasks')
    .select('assigned_to, created_by')
    .eq('id', id)
    .single();

  if (!task) {
    return ApiResponses.notFound('Task');
  }

  // Get user role for permission check
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('user_type')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.user_type === 'admin';
  const isAssigned = task.assigned_to === user.id;
  const isCreator = task.created_by === user.id;

  if (!isAdmin && !isAssigned && !isCreator) {
    return ApiResponses.forbidden('Access denied to this task');
  }

  // Get comments
  const { data: comments, error } = await supabase
    .from('task_comments')
    .select(`
      id,
      content,
      created_at,
      user:created_by (
        first_name,
        last_name,
        email
      )
    `)
    .eq('task_id', id)
    .order('created_at', { ascending: false });

  if (error) {
    return ApiResponses.databaseError('Failed to fetch comments', error);
  }

  return ApiResponses.success({ comments: comments || [] });
}

// POST new comment
async function postHandler(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return ApiResponses.unauthorized();

  const { id } = await params;
  const body = await request.json();

  // Validate required fields
  const missingField = validateRequiredFields(body, ['content']);
  if (missingField) {
    return ApiResponses.missingField(missingField);
  }

  // Check if user can access this task
  const { data: task } = await supabase
    .from('tasks')
    .select('assigned_to, created_by')
    .eq('id', id)
    .single();

  if (!task) {
    return ApiResponses.notFound('Task');
  }

  // Get user role for permission check
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('user_type')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.user_type === 'admin';
  const isAssigned = task.assigned_to === user.id;
  const isCreator = task.created_by === user.id;

  if (!isAdmin && !isAssigned && !isCreator) {
    return ApiResponses.forbidden('Access denied to this task');
  }

  // Create comment
  const { data, error } = await supabase
    .from('task_comments')
    .insert({
      task_id: id,
      content: body.content.trim(),
      created_by: user.id
    })
    .select(`
      id,
      content,
      created_at,
      user:created_by (
        first_name,
        last_name,
        email
      )
    `)
    .single();

  if (error) {
    return ApiResponses.databaseError('Failed to create comment', error);
  }

  return ApiResponses.success({ comment: data }, 'Comment added successfully');
}

export const GET = withErrorHandling(getHandler);
export const POST = withErrorHandling(postHandler);