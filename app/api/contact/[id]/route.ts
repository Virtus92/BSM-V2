import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { TablesUpdate } from '@/lib/database.types'
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use RLS-enabled query - policies will check access
    const { data: request, error } = await supabase
      .from('contact_requests')
      .select(`
        *,
        converted_customer:customers(*)
      `)
      .eq('id', id)
      .single();

    if (error || !request) {
      return NextResponse.json(
        { error: 'Contact request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ request });

  } catch (error) {
    logger.error('Get contact request error', error as Error, {
      component: 'API',
      metadata: { endpoint: `/api/contact/[id]`, method: 'GET' }
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { status, priority, assigned_to, note } = body as {
      status?: 'new' | 'in_progress' | 'responded' | 'converted' | 'archived'
      priority?: 'low' | 'medium' | 'high' | 'critical'
      assigned_to?: string
      note?: string
    };

    // Update contact request - RLS will check write access
    const updateData: Partial<TablesUpdate<'contact_requests'>> = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to;

    const { data: updatedRequest, error } = await supabase
      .from('contact_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error updating contact request', error, {
        component: 'API',
        userId: user.id,
        metadata: { endpoint: `/api/contact/${id}`, method: 'PATCH', contactId: id }
      });
      return NextResponse.json(
        { error: 'Failed to update contact request' },
        { status: 500 }
      );
    }

    // Add note if provided - RLS will check write access
    if (note && note.trim()) {
      await supabase
        .from('contact_request_notes')
        .insert({
          contact_request_id: id,
          content: note.trim(),
          is_internal: true,
          created_by: user.id
        });
    }

    return NextResponse.json({
      success: true,
      request: updatedRequest
    });

  } catch (error) {
    logger.error('Update contact request error', error as Error, {
      component: 'API',
      metadata: { endpoint: `/api/contact/[id]`, method: 'PATCH' }
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
