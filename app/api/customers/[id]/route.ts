import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { TablesUpdate } from '@/lib/database.types'
import { parseAndValidateCustomerUpdate } from '@/lib/utils/api-schemas';
import { logAuthError } from '@/lib/utils/error-handler';
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
      logAuthError('Unauthorized customer access attempt', { metadata: { customerId: id } });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use RLS-enabled query - policies will check access
    const { data: customer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      logger.error('Error fetching customer', error, {
        component: 'API',
        userId: user.id,
        metadata: { endpoint: `/api/customers/${id}`, method: 'GET', customerId: id }
      });
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      customer
    });

  } catch (error) {
    logger.error('Customer API error', error as Error, {
      component: 'API',
      metadata: { endpoint: `/api/customers/[id]`, method: 'GET' }
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate and map client payload to DB schema
    const validation = await parseAndValidateCustomerUpdate(request, id)
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.errors || validation.message }, { status: 400 })
    }

    const v = validation.data!
    const updateData: Partial<TablesUpdate<'customers'>> = {
      updated_at: new Date().toISOString(),
      updated_by: user.id
    }
    if (v.name !== undefined) updateData.contact_person = v.name || null
    if (v.company !== undefined) updateData.company_name = v.company || v.name || undefined
    if (v.email !== undefined) updateData.email = v.email || null
    if (v.phone !== undefined) updateData.phone = v.phone || null
    if (v.website !== undefined) updateData.website = v.website || null
    if (v.street !== undefined) updateData.address_line1 = v.street || null
    if (v.city !== undefined) updateData.city = v.city || null
    if (v.postal_code !== undefined) updateData.postal_code = v.postal_code || null
    if (v.country !== undefined) updateData.country = v.country || null
    if (v.industry !== undefined) updateData.industry = v.industry || null
    if (v.status !== undefined) updateData.status = v.status
    // Notes are now handled via separate customer_notes table
    if (v.tags !== undefined) updateData.tags = v.tags || null

    // Use RLS-enabled update - policies will check write access
    const { data, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      logger.error('Error updating customer', error, {
        component: 'API',
        userId: user.id,
        metadata: { endpoint: `/api/customers/${id}`, method: 'PUT', customerId: id }
      });
      return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
    }

    return NextResponse.json({ success: true, customer: data });
  } catch (error) {
    logger.error('Customers PUT API error', error as Error, {
      component: 'API',
      metadata: { endpoint: `/api/customers/[id]`, method: 'PUT' }
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use RLS-enabled delete - policies will check delete access
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Error deleting customer', error, {
        component: 'API',
        userId: user.id,
        metadata: { endpoint: `/api/customers/${id}`, method: 'DELETE', customerId: id }
      });
      return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Customers DELETE API error', error as Error, {
      component: 'API',
      metadata: { endpoint: `/api/customers/[id]`, method: 'DELETE' }
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
