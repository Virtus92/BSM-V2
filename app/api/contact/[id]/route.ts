import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { TablesUpdate } from '@/lib/database.types'

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

    // Single-tenant: allow any authenticated user; use admin client for RLS-safe reads
    const adminClient = createAdminClient();

    // Get contact request with notes using admin client (no RLS issues)
    const { data: request, error } = await adminClient
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
    console.error('Get contact request error:', error);
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

    // Single-tenant: allow any authenticated user; use admin client for RLS-safe writes
    const adminClient = createAdminClient();

    const body = await request.json();
    const { status, priority, assigned_to, note } = body as {
      status?: 'new' | 'in_progress' | 'responded' | 'converted' | 'archived'
      priority?: 'low' | 'medium' | 'high' | 'critical'
      assigned_to?: string
      note?: string
    };

    // Update contact request using admin client (no RLS issues)
    const updateData: Partial<TablesUpdate<'contact_requests'>> = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to;

    const { data: updatedRequest, error } = await adminClient
      .from('contact_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating contact request:', error);
      return NextResponse.json(
        { error: 'Failed to update contact request' },
        { status: 500 }
      );
    }

    // Add note if provided using admin client (no RLS issues)
      if (note && note.trim()) {
        await adminClient
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
    console.error('Update contact request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
