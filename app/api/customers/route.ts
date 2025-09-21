import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseAndValidateCustomerCreate } from '@/lib/utils/api-schemas';
import { logApiError, logAuthError, logDatabaseError } from '@/lib/utils/error-handler';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      logAuthError('Unauthorized customer list access attempt', { metadata: { url: request.url } });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Single-tenant: allow any authenticated user; use admin client for RLS-safe reads
    const adminClient = createAdminClient();

    // Get customers using admin client (no RLS issues)
    // Order by updated_at so recently edited customers appear first
    const { data: customers, error } = await adminClient
      .from('customers')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      logDatabaseError('fetch customers', error, { userId: user.id });
      return NextResponse.json(
        { error: 'Failed to fetch customers' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      customers: customers || []
    });

  } catch (error) {
    logApiError('/api/customers GET', error as Error, { metadata: { url: request.url } });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      logAuthError('Unauthorized customer creation attempt', { metadata: { url: request.url } });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // ✅ Type-safe request validation
    const validation = await parseAndValidateCustomerCreate(request);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors || validation.message },
        { status: 400 }
      );
    }

    // Map client payload to DB schema
    const v = validation.data!
    const insertData = {
      company_name: (v.company || v.name) as string,
      contact_person: v.name || null,
      email: v.email || null,
      phone: v.phone || null,
      website: v.website || null,
      address_line1: v.street || null,
      city: v.city || null,
      postal_code: v.postal_code || null,
      country: v.country || null,
      industry: v.industry || null,
      status: (v.status || 'prospect'),
      notes: v.notes || null,
      tags: v.tags || null,
      created_by: user.id
    };

    const { data, error } = await adminClient
      .from('customers')
      .insert(insertData)
      .select('*')
      .single()

    if (error) {
      logDatabaseError('create customer', error, { userId: user.id, metadata: { company_name: insertData.company_name } });
      return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
    }

    return NextResponse.json({ success: true, customer: data });
  } catch (error) {
    logApiError('/api/customers POST', error as Error, { metadata: { url: request.url } });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
