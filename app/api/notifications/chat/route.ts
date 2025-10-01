import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createNotification } from '@/lib/services/notification-service';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const customerId = (body.customerId || '').toString();
    const isFromCustomer = !!body.isFromCustomer;
    if (!customerId) return NextResponse.json({ error: 'Missing customerId' }, { status: 400 });

    const admin = createAdminClient();

    // Determine recipient
    const { data: customer } = await admin
      .from('customers')
      .select('id, user_id, assigned_employee_id')
      .eq('id', customerId)
      .maybeSingle();

    if (!customer) return NextResponse.json({ success: true });

    let recipientId: string | null = null;
    let role: 'admin' | 'employee' | 'customer' = 'customer';

    if (isFromCustomer) {
      recipientId = customer.assigned_employee_id || null;
      role = 'employee';
    } else {
      recipientId = customer.user_id || null;
      role = 'customer';
    }

    if (!recipientId) return NextResponse.json({ success: true });

    await createNotification({
      userId: recipientId,
      role,
      type: 'chat_new',
      resourceType: 'chat',
      resourceId: customer.id,
      title: 'Neue Chat-Nachricht',
      body: isFromCustomer ? 'Ein Kunde hat Ihnen geschrieben.' : 'Sie haben eine neue Nachricht vom Support.',
      data: { customerId: customer.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Chat notification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

