import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkTaskBasedAccess, getUserAccessibleResources } from '@/lib/task-access-control';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resourceType = searchParams.get('type') as 'customer' | 'contact_request' | null;
    const resourceId = searchParams.get('id');

    // If specific resource is requested, check access to that resource
    if (resourceType && resourceId) {
      const accessResult = await checkTaskBasedAccess(user.id, resourceType, resourceId);
      return NextResponse.json(accessResult);
    }

    // Otherwise, return all accessible resources for the user
    const accessibleResources = await getUserAccessibleResources(user.id);

    return NextResponse.json({
      hasAccess: true,
      reason: 'accessible_resources',
      accessibleResources
    });

  } catch (error) {
    console.error('Task access check error:', error);
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

    const body = await request.json();
    const { resourceType, resourceId } = body;

    if (!resourceType || !resourceId) {
      return NextResponse.json({
        error: 'Missing required fields: resourceType, resourceId'
      }, { status: 400 });
    }

    if (!['customer', 'contact_request'].includes(resourceType)) {
      return NextResponse.json({
        error: 'Invalid resourceType. Must be "customer" or "contact_request"'
      }, { status: 400 });
    }

    const accessResult = await checkTaskBasedAccess(user.id, resourceType, resourceId);

    return NextResponse.json(accessResult);

  } catch (error) {
    console.error('Task access check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}