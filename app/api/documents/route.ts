import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Only employees/admins can add documents via workspace
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type, is_active')
      .eq('id', user.id)
      .single();

    if (!profile?.is_active || !['employee','admin'].includes(profile.user_type)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const customerId = (body.customerId || '').toString();
    const title = (body.title || '').toString().trim();
    const url = (body.url || '').toString().trim();
    const description = (body.description || '').toString().trim() || null;
    const documentType = (body.document_type || 'guide').toString();
    const visibility = (body.visibility || 'internal').toString();
    if (!customerId || !title || !url) {
      return NextResponse.json({ error: 'Missing customerId, title or url' }, { status: 400 });
    }

    const fileName = url.split('/').pop() || title;
    const admin = createAdminClient();
    const { error } = await admin
      .from('documents')
      .insert({
        title,
        description,
        document_type: documentType,
        status: 'published',
        file_name: fileName,
        file_mime_type: null,
        file_path: url,
        visibility,
        created_by: user.id,
        customer_id: customerId,
      });
    if (error) return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

