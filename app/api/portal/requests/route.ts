import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type') || ''
    let subject: string | null = null
    let message: string | null = null
    if (contentType.includes('application/json')) {
      const body = await request.json().catch(() => ({}))
      subject = (body.subject || '').toString().trim()
      message = (body.message || '').toString().trim()
    } else {
      const form = await request.formData()
      subject = (form.get('subject') || '').toString().trim()
      message = (form.get('message') || '').toString().trim()
    }

    if (!subject || !message) {
      return NextResponse.json({ error: 'Missing subject or message' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Ensure a customer record exists for this user
    const { data: customer } = await admin
      .from('customers')
      .select('id, company_name, email')
      .eq('user_id', user.id)
      .maybeSingle()

    const customerId = customer?.id || null

    const headersList = await headers()
    const forwardedFor = headersList.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : headersList.get('x-real-ip')
    const userAgent = headersList.get('user-agent')

    const { data, error } = await admin
      .from('contact_requests')
      .insert({
        name: user.user_metadata?.full_name || user.email || 'Kunde',
        email: user.email,
        company: customer?.company_name || null,
        subject,
        message,
        status: 'new',
        priority: 'medium',
        source: 'portal',
        created_by: user.id,
        ip_address: ip,
        user_agent: userAgent,
        converted_to_customer_id: customerId
      })
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data.id })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

