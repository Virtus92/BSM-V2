import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/chat/channels
 * List all chat channels for the current user
 *
 * Query params:
 * - status: 'active' | 'closed' | 'all' (default: 'active')
 * - type: 'permanent' | 'request' | 'task' | 'all' (default: 'all')
 * - customer_id: filter by customer ID
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';
    const type = searchParams.get('type') || 'all';
    const customer_id = searchParams.get('customer_id');

    // Build query
    let query = supabase
      .from('chat_channels')
      .select(`
        id,
        customer_id,
        employee_id,
        channel_type,
        channel_status,
        source_type,
        source_id,
        created_at,
        closed_at,
        metadata,
        customers!chat_channels_customer_id_fkey (
          id,
          company_name,
          contact_person,
          email
        ),
        user_profiles!chat_channels_employee_id_fkey (
          id,
          first_name,
          last_name,
          email
        )
      `);

    // Filter by status
    if (status !== 'all') {
      query = query.eq('channel_status', status);
    }

    // Filter by type
    if (type !== 'all') {
      query = query.eq('channel_type', type);
    }

    // Filter by customer
    if (customer_id) {
      query = query.eq('customer_id', customer_id);
    }

    // Filter by user role
    if (profile.user_type === 'employee') {
      query = query.eq('employee_id', user.id);
    } else if (profile.user_type === 'customer') {
      // Get customer ID for current user
      const { data: customerData } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!customerData) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }

      query = query.eq('customer_id', customerData.id);
    }
    // Admin sees all channels (no additional filter)

    // Execute query
    const { data: channels, error: channelsError } = await query
      .order('created_at', { ascending: false });

    if (channelsError) {
      console.error('Error fetching channels:', channelsError);
      return NextResponse.json({ error: channelsError.message }, { status: 500 });
    }

    return NextResponse.json({ channels, count: channels?.length || 0 });
  } catch (error) {
    console.error('Unexpected error in GET /api/chat/channels:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/channels
 * Create a new chat channel (manual creation)
 *
 * Body:
 * - customer_id: string (required)
 * - employee_id: string (required)
 * - channel_type: 'permanent' | 'request' | 'task' (required)
 * - source_type?: string (required for temporary channels)
 * - source_id?: string (required for temporary channels)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (!profile || !['employee', 'admin'].includes(profile.user_type)) {
      return NextResponse.json(
        { error: 'Only employees and admins can create channels' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { customer_id, employee_id, channel_type, source_type, source_id } = body;

    // Validation
    if (!customer_id || !employee_id || !channel_type) {
      return NextResponse.json(
        { error: 'Missing required fields: customer_id, employee_id, channel_type' },
        { status: 400 }
      );
    }

    if (!['permanent', 'request', 'task'].includes(channel_type)) {
      return NextResponse.json(
        { error: 'Invalid channel_type. Must be: permanent, request, or task' },
        { status: 400 }
      );
    }

    // Validate source requirements for temporary channels
    if (channel_type !== 'permanent' && (!source_type || !source_id)) {
      return NextResponse.json(
        { error: 'source_type and source_id are required for temporary channels' },
        { status: 400 }
      );
    }

    // Check if channel already exists
    const { data: existing } = await supabase
      .from('chat_channels')
      .select('id')
      .eq('customer_id', customer_id)
      .eq('employee_id', employee_id)
      .eq('channel_type', channel_type)
      .eq('channel_status', 'active')
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'Active channel already exists for this customer and employee' },
        { status: 409 }
      );
    }

    // Create channel
    const { data: channel, error: createError } = await supabase
      .from('chat_channels')
      .insert({
        customer_id,
        employee_id,
        channel_type,
        channel_status: 'active',
        source_type: channel_type === 'permanent' ? null : source_type,
        source_id: channel_type === 'permanent' ? null : source_id
      })
      .select(`
        id,
        customer_id,
        employee_id,
        channel_type,
        channel_status,
        source_type,
        source_id,
        created_at,
        closed_at,
        metadata
      `)
      .single();

    if (createError) {
      console.error('Error creating channel:', createError);
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    return NextResponse.json({ channel }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/chat/channels:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
