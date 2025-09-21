import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();

    // Get request data
    const body = await request.json();
    const { name, email, company, phone, subject, message } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get client IP and user agent
    const forwardedFor = headersList.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : headersList.get('x-real-ip');
    const userAgent = headersList.get('user-agent');

    // Single-tenant setup - no workspace needed
    // Use admin client for contact form submission (public form, no RLS issues)
    const adminClient = createAdminClient();

    // Insert contact request
    const { data: contactRequest, error } = await adminClient
      .from('contact_requests')
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        company: company?.trim() || null,
        phone: phone?.trim() || null,
        subject: subject.trim(),
        message: message.trim(),
        source: 'website',
        ip_address: ip,
        user_agent: userAgent,
        status: 'new',
        priority: 'medium'
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to submit contact request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Contact request submitted successfully',
      id: contactRequest.id
    });

  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {

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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query for single-tenant using admin client (no RLS issues)
  let query = adminClient
      .from('contact_requests')
      .select(`
        *,
        converted_customer:customers(*)
      `)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Add status filter if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: requests, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch contact requests' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      requests,
      pagination: {
        limit,
        offset,
        total: requests?.length || 0
      }
    });

  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
