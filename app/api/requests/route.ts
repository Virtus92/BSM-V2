import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserAccessibleResources } from '@/lib/task-access-control';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
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
    if (status) {
      const statusList = status.split(',').map(s => s.trim());
      if (statusList.length > 1) {
        query = query.in('status', statusList);
      } else {
        query = query.eq('status', status);
      }
    }

    const { data: requests, error: requestsError } = await query;

    if (requestsError) {
      logger.error('Failed to fetch requests', requestsError, {
        component: 'API',
        userId: user.id,
        metadata: { endpoint: '/api/requests', method: 'GET' }
      });
      return NextResponse.json({ error: 'Failed to fetch requests', details: requestsError.message }, { status: 500 });
    }

    logger.info('Requests fetched successfully', {
      component: 'API',
      userId: user.id,
      metadata: { count: requests?.length || 0, endpoint: '/api/requests', method: 'GET' }
    });

    return NextResponse.json({
      requests: requests || [],
      total: requests?.length || 0
    });

  } catch (error) {
    logger.error('Requests GET error', error as Error, {
      component: 'API',
      metadata: { endpoint: '/api/requests', method: 'GET' }
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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
    const { customer_id, subject, description, priority = 'medium', urgency = 'medium' } = body;

    if (!customer_id || !subject) {
      return NextResponse.json({
        error: 'Missing required fields: customer_id, subject'
      }, { status: 400 });
    }

    const admin = createAdminClient();

    // Create new contact request
    const { data: newRequest, error: createError } = await admin
      .from('contact_requests')
      .insert({
        customer_id,
        customer_user_id: user.id, // The user creating the request
        subject,
        description,
        priority,
        urgency,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      logger.error('Failed to create request', createError, {
        component: 'API',
        userId: user.id,
        metadata: { endpoint: '/api/requests', method: 'POST', customer_id, subject }
      });
      return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
    }

    // Log the activity
    await admin.from('user_activity_logs').insert({
      user_id: user.id,
      action: 'REQUEST_CREATED',
      resource_type: 'contact_request',
      resource_id: newRequest.id,
      additional_context: {
        subject,
        customer_id,
        priority,
        urgency
      },
      severity: 'low'
    });

    return NextResponse.json({
      success: true,
      request: newRequest
    });

  } catch (error) {
    logger.error('Requests POST error', error as Error, {
      component: 'API',
      metadata: { endpoint: '/api/requests', method: 'POST' }
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
