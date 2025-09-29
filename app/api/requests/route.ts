import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserAccessibleResources } from '@/lib/task-access-control';

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

    const isAdmin = profile.user_type === 'admin';

    // Get task-based accessible resources for non-admin users
    let taskAccessibleResources = { customerIds: [], requestIds: [], activeTasks: [] };
    if (!isAdmin) {
      taskAccessibleResources = await getUserAccessibleResources(user.id);
    }

    const { searchParams } = new URL(request.url);
    const unassigned = searchParams.get('unassigned') === 'true';
    const status = searchParams.get('status') || '';
    const limit = parseInt(searchParams.get('limit') || '50');

    const admin = createAdminClient();

    let query = admin
      .from('contact_requests')
      .select(`
        *,
        converted_customer:customers!contact_requests_converted_to_customer_id_fkey (
          id, company_name, contact_person
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unassigned) {
      // For unassigned requests, we need to exclude those that have active assignments
      const { data: assignedRequestIds } = await admin
        .from('request_assignments')
        .select('contact_request_id')
        .eq('is_active', true);

      const assignedIds = assignedRequestIds?.map(a => a.contact_request_id) || [];
      if (assignedIds.length > 0) {
        query = query.not('id', 'in', `(${assignedIds.join(',')})`);
      }
    } else {
      // For assigned requests, include assignment info
      query = admin
        .from('contact_requests')
        .select(`
          *,
          converted_customer:customers!contact_requests_converted_to_customer_id_fkey (
            id, company_name, contact_person
          ),
          request_assignments!inner (
            id, assigned_to, assigned_at, is_active
          )
        `)
        .eq('request_assignments.is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit);
    }

    if (status && !unassigned) {
      // Support multiple status values separated by comma (only for assigned requests)
      const statusList = status.split(',').map(s => s.trim());
      if (statusList.length > 1) {
        query = query.in('status', statusList);
      } else {
        query = query.eq('status', status);
      }
    }

    let requests, requestsError;
    if (unassigned) {
      // Apply status filter after getting unassigned requests
      if (status) {
        const statusList = status.split(',').map(s => s.trim());
        if (statusList.length > 1) {
          query = query.in('status', statusList);
        } else {
          query = query.eq('status', status);
        }
      }
      const result = await query;
      requests = result.data;
      requestsError = result.error;
    } else {
      const result = await query;
      requests = result.data;
      requestsError = result.error;
    }

    if (requestsError) {
      console.error('Requests fetch error:', requestsError);
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }

    return NextResponse.json({
      requests: requests || [],
      total: requests?.length || 0
    });

  } catch (error) {
    console.error('Requests GET error:', error);
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
      console.error('Request creation error:', createError);
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
    console.error('Requests POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
