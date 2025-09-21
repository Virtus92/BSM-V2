import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('customer_notes')
      .select('*')
      .eq('customer_id', id)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: 'Failed to load notes' }, { status: 500 })
    return NextResponse.json({ notes: data || [] })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({})) as {
      title?: string
      content: string
      is_internal?: boolean
      note_type?: string
      priority?: 'low' | 'medium' | 'high' | 'critical'
      due_date?: string | null
    }
    if (!body.content || !body.content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('customer_notes')
      .insert({
        customer_id: id,
        title: body.title?.trim() || null,
        content: body.content.trim(),
        is_internal: body.is_internal ?? false,
        note_type: body.note_type || 'general',
        priority: body.priority || 'medium',
        due_date: body.due_date || null,
        created_by: user.id,
        updated_by: user.id
      })
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
    return NextResponse.json({ success: true, note: data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
