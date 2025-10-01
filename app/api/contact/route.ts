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
import { logger } from '@/lib/logger';

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

  // Check if user is admin or employee
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('user_type')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'employee'].includes(profile.user_type)) {
    return ApiResponses.forbidden();
  }

  // Get query parameters
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '100');

  // Use RLS-enabled query - policies will handle access control
  // Employees see: unassigned + assigned to them
  // Admins see: all
  let query = supabase
    .from('contact_requests')
    .select(`
      *,
      converted_customer:customers!contact_requests_converted_to_customer_id_fkey (
        id, company_name, contact_person
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  // Apply status filter if provided
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data: requests, error } = await query;

  if (error) {
    logger.error('Failed to fetch contact requests', error, {
      component: 'API',
      userId: user.id,
      metadata: { endpoint: '/api/contact', method: 'GET' }
    });
    return ApiResponses.databaseError('Failed to fetch contact requests', error);
  }

  logger.info('Contact requests fetched successfully', {
    component: 'API',
    userId: user.id,
    metadata: { count: requests?.length || 0, endpoint: '/api/contact', method: 'GET' }
  });

  return createSuccessResponse(
    { requests: requests || [] },
    undefined,
    {
      timestamp: new Date().toISOString(),
      version: '1.0',
      total: requests?.length || 0
    }
  );
}

export const GET = withErrorHandling(getHandler);
