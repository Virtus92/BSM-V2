import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import {
  ApiResponses,
  withErrorHandling
} from '@/lib/api-response';

async function getHandler(request: NextRequest) {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return ApiResponses.unauthorized();
  }

  // Get user role
  const { data: profile, error: profileError } = await adminClient
    .from('user_profiles')
    .select('user_type, is_active')
    .eq('id', user.id)
    .single();

  if (profileError || !profile?.is_active) {
    return ApiResponses.unauthorized();
  }

  // Only employees and admins can see unassigned requests
  if (!['employee', 'admin'].includes(profile.user_type)) {
    return ApiResponses.forbidden('Only admin and employees can view unassigned requests');
  }

  // Get query parameters
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  // Get unassigned requests (available for task linking)
  const { data: unassignedRequests, error: requestsError } = await adminClient
    .from('contact_requests')
    .select(`
      id,
      subject,
      message,
      status,
      priority,
      name,
      email,
      company,
      created_at
    `)
    .in('status', ['new', 'in_progress'])
    .is('converted_to_customer_id', null) // Not yet converted
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (requestsError) {
    return ApiResponses.databaseError('Failed to fetch unassigned requests', requestsError);
  }

  return ApiResponses.success({
    requests: unassignedRequests || [],
    pagination: {
      limit,
      offset,
      total: unassignedRequests?.length || 0
    }
  });
}

export const GET = withErrorHandling(getHandler);
