import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logActivity, ActivityAction, ResourceType, ActivitySeverity } from '@/lib/utils/activity-logger';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      action,
      resource_type,
      resource_id,
      additional_context,
      severity = 'low',
      description
    } = body;

    // Validate required fields
    if (!action || !resource_type) {
      return NextResponse.json({
        error: 'Missing required fields: action, resource_type'
      }, { status: 400 });
    }

    // Get request metadata
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : headersList.get('x-real-ip');
    const userAgent = headersList.get('user-agent');

    // Log the activity
    await logActivity({
      user_id: user.id,
      action: action as ActivityAction,
      resource_type: resource_type as ResourceType,
      resource_id,
      ip_address: ip,
      user_agent: userAgent,
      request_path: request.nextUrl.pathname,
      request_method: request.method,
      additional_context: additional_context || {},
      severity: severity as ActivitySeverity,
      description
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Activity logging error:', error);
    return NextResponse.json({ error: 'Failed to log activity' }, { status: 500 });
  }
}