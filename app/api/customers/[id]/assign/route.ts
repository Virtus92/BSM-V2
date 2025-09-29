import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: customerId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (!profile || profile.user_type !== 'admin') {
      return NextResponse.json({ error: 'Access denied - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { employeeId } = body;

    if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Check if customer exists
    const { data: customer, error: customerError } = await admin
      .from('customers')
      .select('id, company_name')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Check if employee exists and is active
    const { data: employee, error: employeeError } = await admin
      .from('user_profiles')
      .select('id, first_name, last_name, user_type, is_active')
      .eq('id', employeeId)
      .eq('is_active', true)
      .single();

    if (employeeError || !employee) {
      return NextResponse.json({ error: 'Zielbenutzer nicht gefunden oder inaktiv' }, { status: 400 });
    }
    // Allow assignment to employees and admins (per request 1)
    if (!['employee', 'admin'].includes(employee.user_type)) {
      return NextResponse.json({ error: 'Nur aktive Mitarbeiter oder Admins können Kunden zugewiesen bekommen' }, { status: 400 });
    }

    // Assign customer to employee
    const { error: assignError } = await admin
      .from('customers')
      .update({ assigned_employee_id: employeeId })
      .eq('id', customerId);

    if (assignError) {
      console.error('Customer assignment error:', assignError);
      return NextResponse.json({ error: 'Failed to assign customer' }, { status: 500 });
    }

    // Also assign all pending/unassigned requests from this customer to the same employee
    const { data: customerRequests } = await admin
      .from('contact_requests')
      .select('id, subject')
      .eq('customer_id', customerId)
      .in('status', ['pending', 'new']);

    if (customerRequests && customerRequests.length > 0) {
      // Deactivate any existing assignments for these requests
      await admin
        .from('request_assignments')
        .update({ is_active: false })
        .in('contact_request_id', customerRequests.map(r => r.id));

      // Create new assignments for all customer requests
      const assignments = customerRequests.map(request => ({
        contact_request_id: request.id,
        assigned_to: employeeId,
        assigned_by: user.id,
        assigned_at: new Date().toISOString(),
        priority: 'medium',
        is_active: true
      }));

      await admin
        .from('request_assignments')
        .insert(assignments);

      // Update request statuses to 'assigned'
      await admin
        .from('contact_requests')
        .update({ status: 'assigned' })
        .in('id', customerRequests.map(r => r.id));
    }

    // Log the assignment
    await admin.from('user_activity_logs').insert({
      user_id: user.id,
      action: 'CUSTOMER_ASSIGNED',
      resource_type: 'customer',
      resource_id: customerId,
      additional_context: {
        customer_name: customer.company_name,
        assigned_to: employeeId,
        assigned_to_name: `${employee.first_name} ${employee.last_name}`,
        requests_assigned: customerRequests?.length || 0
      },
      severity: 'low'
    });

    return NextResponse.json({
      success: true,
      message: `Customer ${customer.company_name} assigned to ${employee.first_name} ${employee.last_name}`
    });

  } catch (error) {
    console.error('Customer assignment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
