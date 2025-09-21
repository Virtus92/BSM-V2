import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { CustomerStatus } from '@/lib/shared-types';

export async function POST(
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

    // Single-tenant: allow any authenticated user to convert requests
    const adminClient = createAdminClient();

    // Optional custom overrides from client
    type Overrides = Partial<{
      name: string
      company: string
      phone: string
      status: CustomerStatus
      notes: string
    }>

    const overrides: Overrides = await request.json().catch(() => ({} as Overrides));

    // Load the contact request
    const { data: contactRequest, error: requestError } = await adminClient
      .from('contact_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (requestError || !contactRequest) {
      return NextResponse.json(
        { error: 'Contact request not found' },
        { status: 404 }
      );
    }

    if (contactRequest.converted_to_customer_id) {
      return NextResponse.json(
        { error: 'Contact request already converted to customer' },
        { status: 400 }
      );
    }

    // Try linking to existing customer by email
    const { data: existingCustomer } = await adminClient
      .from('customers')
      .select('*')
      .eq('email', contactRequest.email)
      .maybeSingle();

    if (existingCustomer) {
      const { error: linkError } = await adminClient
        .from('contact_requests')
        .update({
          converted_to_customer_id: existingCustomer.id,
          converted_at: new Date().toISOString(),
          status: 'converted'
        })
        .eq('id', id);

      if (linkError) {
        console.error('Error linking to existing customer:', linkError);
        return NextResponse.json(
          { error: 'Failed to link to existing customer' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Linked to existing customer',
        customer: existingCustomer,
        action: 'linked'
      });
    }

    // Create new customer with modern schema
    const insertPayload = {
      company_name: (overrides?.company ?? contactRequest.company ?? contactRequest.name) as string,
      contact_person: overrides?.name ?? contactRequest.name,
      email: contactRequest.email,
      phone: overrides?.phone ?? contactRequest.phone,
      status: (overrides?.status ?? 'prospect') as CustomerStatus,
      notes:
        overrides?.notes ??
        `Erstellt aus Kontaktanfrage: ${contactRequest.subject}\n\nUrsprüngliche Nachricht:\n${contactRequest.message}`,
      created_by: user.id
    } as const;

    const { data: newCustomer, error: customerError } = await adminClient
      .from('customers')
      .insert(insertPayload)
      .select('*')
      .single();

    if (customerError) {
      console.error('Error creating customer:', customerError);
      return NextResponse.json(
        { error: 'Failed to create customer' },
        { status: 500 }
      );
    }

    // Mark contact request as converted
    const { error: updateError } = await adminClient
      .from('contact_requests')
      .update({
        converted_to_customer_id: newCustomer.id,
        converted_at: new Date().toISOString(),
        status: 'converted'
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating contact request after conversion:', updateError);
      // Note: do not fail the whole request here
    }

    // Add an internal note about conversion
    await adminClient
      .from('contact_request_notes')
      .insert({
        contact_request_id: id,
        content: `Zu Kunde konvertiert: ${newCustomer.contact_person || newCustomer.company_name} (ID: ${newCustomer.id})`,
        is_internal: true,
        created_by: user.id
      });

    return NextResponse.json({
      success: true,
      message: 'Contact request converted to customer successfully',
      customer: newCustomer,
      action: 'created'
    });

  } catch (error) {
    console.error('Convert contact request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
