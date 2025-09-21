import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const result: Record<string, any> = {
    supabase: { ok: false },
    n8n: { ok: false },
    env: { ok: false },
    timestamp: new Date().toISOString()
  }

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY
    const n8nBase = process.env.N8N_BASE_URL
    if (url && anon && service && n8nBase) {
      result.env = { ok: true }
    } else {
      result.env = { ok: false, missing: [
        !url && 'NEXT_PUBLIC_SUPABASE_URL',
        !anon && 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY',
        !service && 'SUPABASE_SERVICE_ROLE_KEY',
        !n8nBase && 'N8N_BASE_URL',
      ].filter(Boolean) }
    }
  } catch {}

  // Supabase connectivity test (service role)
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('user_profiles').select('id').limit(1)
    result.supabase.ok = !error
    if (error) result.supabase.error = error.message
  } catch (e: any) {
    result.supabase = { ok: false, error: e?.message || 'error' }
  }

  // n8n health check
  try {
    const base = process.env.N8N_BASE_URL!
    const res = await fetch(base.replace(/\/$/, '') + '/rest/healthz', {
      headers: {
        'X-N8N-API-KEY': process.env.N8N_API_KEY || ''
      }
    })
    if (res.ok) {
      const data = await res.json().catch(() => ({}))
      result.n8n = { ok: true, info: data }
    } else {
      result.n8n = { ok: false, status: res.status }
    }
  } catch (e: any) {
    result.n8n = { ok: false, error: e?.message || 'error' }
  }

  const ok = result.env.ok && result.supabase.ok && result.n8n.ok
  return NextResponse.json({ ok, ...result })
}

