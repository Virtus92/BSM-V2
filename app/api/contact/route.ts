import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserAccessibleResources } from '@/lib/task-access-control';
import { headers } from 'next/headers';
import {
  ApiResponses,
  withErrorHandling,
  validateRequiredFields,
  validateEmail,
  createPaginationMeta,
  createSuccessResponse
} from '@/lib/api-response';

async function postHandler(request: NextRequest) {
  const headersList = await headers();

  // Get request data
  const body = await request.json();
  const { name, email, company, phone, subject, message } = body;

  // Validate required fields
  const missingField = validateRequiredFields(body, ['name', 'email', 'subject', 'message']);
  if (missingField) {
    return ApiResponses.missingField(missingField);
  }

  // Email validation
  if (!validateEmail(email)) {
    return ApiResponses.invalidEmail(email);
  }

    // Get client IP and user agent
    const forwardedFor = headersList.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : headersList.get('x-real-ip');
    const userAgent = headersList.get('user-agent');

    // Single-tenant setup - no workspace needed
    // Use admin client for contact form submission (public form, no RLS issues)
    const adminClient = createAdminClient();

    // Insert contact request
    const { data: contactRequest, error } = await adminClient
      .from('contact_requests')
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        company: company?.trim() || null,
        phone: phone?.trim() || null,
        subject: subject.trim(),
        message: message.trim(),
        source: 'website',
        ip_address: ip,
        user_agent: userAgent,
        status: 'new',
        priority: 'medium'
      })
      .select()
      .single();

  if (error) {
    return ApiResponses.databaseError('Failed to submit contact request', error);
  }

  return ApiResponses.success(
    { id: contactRequest.id },
    'Contact request submitted successfully'
  );
}

export const POST = withErrorHandling(postHandler);

async function getHandler(request: NextRequest) {
  const supabase = await createClient();

  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return ApiResponses.unauthorized();
  }

  // Check if user is admin for Task-based Access
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('user_type')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.user_type === 'admin';

  // Get task-based accessible resources for non-admin users
  let taskAccessibleResources = { customerIds: [], requestIds: [], activeTasks: [] };
  if (!isAdmin) {
    taskAccessibleResources = await getUserAccessibleResources(user.id);
  }

  // Single-tenant: allow any authenticated user; use admin client for RLS-safe reads
  const adminClient = createAdminClient();

  // Get query parameters
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = parseInt(searchParams.get('offset') || '0');
  const assignedToParam = searchParams.get('assignedTo');
  const includeUnassigned = searchParams.get('includeUnassigned') === 'true';

  // Resolve "assignedTo" filter
  const assignedTo = assignedToParam === 'me' ? user.id : (assignedToParam || null);

  // Build query for single-tenant using admin client with Task-based Access
  let baseSelect = `
    *,
    converted_customer:customers!contact_requests_converted_to_customer_id_fkey(*)
  `;

  // When scoping to a user, include assignments join to filter only active assignments
  const selectWithAssignments = `
    *,
    converted_customer:customers!contact_requests_converted_to_customer_id_fkey(*),
    request_assignments!inner(assigned_to, is_active)
  `;

  // Default: single query per assigned/unassigned flag
  let requests: any[] = []
  let error: any = null

  if (assignedTo && includeUnassigned) {
    // 1) Assigned to user
    let q1 = adminClient
      .from('contact_requests')
      .select(selectWithAssignments)
      .eq('request_assignments.assigned_to', assignedTo)
      .eq('request_assignments.is_active', true)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status && status !== 'all') q1 = q1.eq('status', status)

    const { data: assignedList, error: e1 } = await q1

    if (e1) {
      error = e1
    }

    // 2) Task-accessible requests for non-admin users
    let taskAccessibleList: any[] = []
    if (!isAdmin && taskAccessibleResources.requestIds.length > 0) {
      let q2 = adminClient
        .from('contact_requests')
        .select(baseSelect)
        .in('id', taskAccessibleResources.requestIds)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (status && status !== 'all') q2 = q2.eq('status', status)

      const { data: taskRequests, error: e2 } = await q2
      if (e2 && !error) error = e2
      taskAccessibleList = taskRequests || []
    }

    // 3) Unassigned (no active assignment) - for admin or when requested
    let unassignedList: any[] = []
    if (isAdmin || includeUnassigned) {
      // Get active assignment ids to exclude
      const { data: activeAssignments } = await adminClient
        .from('request_assignments')
        .select('contact_request_id')
        .eq('is_active', true)

      const assignedIds = (activeAssignments || []).map((a: any) => a.contact_request_id)

      let q3 = adminClient
        .from('contact_requests')
        .select(baseSelect)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (assignedIds.length > 0) {
        q3 = q3.not('id', 'in', `(${assignedIds.join(',')})`)
      }
      if (status && status !== 'all') q3 = q3.eq('status', status)

      const { data: unassigned, error: e3 } = await q3
      if (e3 && !error) error = e3
      unassignedList = unassigned || []
    }

    requests = [
      ...(assignedList || []),
      ...taskAccessibleList,
      ...unassignedList
    ]
  } else {
    // Single query path with Task-based Access
    let allRequests: any[] = []

    if (assignedTo) {
      // Robust two-step retrieval to avoid join edge cases
      const { data: assignedRows, error: aErr } = await adminClient
        .from('request_assignments')
        .select('contact_request_id')
        .eq('assigned_to', assignedTo)
        .eq('is_active', true)

      if (!aErr) {
        const assignedIds = (assignedRows || []).map((r: any) => r.contact_request_id)
        if (assignedIds.length > 0) {
          // Minimal select to avoid embed issues; list UI benötigt primäre Felder
          let reqQMin = adminClient
            .from('contact_requests')
            .select('*')
            .in('id', assignedIds)
            .order('updated_at', { ascending: false })
            .range(offset, offset + limit - 1)

          if (status && status !== 'all') reqQMin = reqQMin.eq('status', status)

          const { data: assignedList, error: rErr } = await reqQMin
          if (rErr) error = rErr
          allRequests = assignedList || []
        } else {
          // Fallback join if index list is empty (defensive)
          let joinQ = adminClient
            .from('contact_requests')
            .select(selectWithAssignments)
            .eq('request_assignments.assigned_to', assignedTo)
            .eq('request_assignments.is_active', true)
            .order('updated_at', { ascending: false })
            .range(offset, offset + limit - 1)

          if (status && status !== 'all') joinQ = joinQ.eq('status', status)

          const { data: joinList, error: jErr } = await joinQ
          if (jErr && !error) error = jErr
          allRequests = joinList || []
        }
      } else {
        error = aErr
      }
    }

    // Add task-accessible requests for non-admin users
    if (!isAdmin && taskAccessibleResources.requestIds.length > 0) {
      let taskQuery = adminClient
        .from('contact_requests')
        .select(baseSelect)
        .in('id', taskAccessibleResources.requestIds)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (status && status !== 'all') taskQuery = taskQuery.eq('status', status)

      const { data: taskRequests, error: taskError } = await taskQuery
      if (taskError && !error) error = taskError

      const existingIds = new Set(allRequests.map(r => r.id))
      const uniqueTaskRequests = (taskRequests || []).filter((r: any) => !existingIds.has(r.id))
      allRequests = [...allRequests, ...uniqueTaskRequests]
    }

    // For admin users without specific assignment filter, get all requests
    if (isAdmin && !assignedTo) {
      let query = adminClient
        .from('contact_requests')
        .select(baseSelect)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (status && status !== 'all') query = query.eq('status', status)

      const result = await query
      allRequests = result.data as any[] || []
      error = result.error
    }

    requests = allRequests
  }

  if (error) {
    return ApiResponses.databaseError('Failed to fetch contact requests', error);
  }

  // Calculate pagination
  const page = Math.floor(offset / limit) + 1;
  const total = requests?.length || 0;
  const paginationMeta = createPaginationMeta(page, limit, total);

  // Enrich meta to satisfy type (timestamp is required in ApiSuccess['meta'])
  return createSuccessResponse(
    { requests },
    undefined,
    {
      ...paginationMeta,
      timestamp: new Date().toISOString(),
      version: '1.0'
    }
  );
}

export const GET = withErrorHandling(getHandler);
