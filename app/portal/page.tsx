import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function ensureCustomerRecord(userId: string, email: string | null, fullName?: string | null) {
  const admin = createAdminClient()
  // Check if a customer record exists for this user
  const { data: existing } = await admin
    .from('customers')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (existing?.id) return existing.id

  const companyName = fullName || email || 'Customer'
  const { data: created } = await admin
    .from('customers')
    .insert({
      company_name: companyName,
      contact_person: fullName || null,
      email: email || null,
      status: 'active',
      user_id: userId
    })
    .select('id')
    .single()

  return created?.id || null
}

export default async function PortalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // If the user is admin, go to admin dashboard
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('user_type, first_name, last_name')
    .eq('id', user.id)
    .single()

  if (profile?.user_type === 'admin') {
    redirect('/dashboard')
  }

  // Ensure we have a customer record linked to this user
  await ensureCustomerRecord(user.id, user.email ?? null, user.user_metadata?.full_name ?? null)

  // Load own requests (admin client filters to current user only)
  const admin = createAdminClient()
  const { data: requests } = await admin
    .from('contact_requests')
    .select('id, created_at, status, subject')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-2">Kundenportal</h1>
        <p className="text-slate-400 mb-8">Erstellen Sie neue Anfragen und verfolgen Sie den Status.</p>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 mb-8">
          <h2 className="text-lg font-semibold mb-4">Neue Anfrage</h2>
          <form className="space-y-3" action="/api/portal/requests" method="post">
            <div>
              <label className="text-sm text-slate-300">Betreff</label>
              <input name="subject" required placeholder="Kurzbeschreibung" className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white" />
            </div>
            <div>
              <label className="text-sm text-slate-300">Nachricht</label>
              <textarea name="message" required placeholder="Beschreiben Sie Ihr Anliegen" className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white h-28" />
            </div>
            <button type="submit" className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition">Anfrage senden</button>
          </form>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-4">Ihre letzten Anfragen</h2>
          <div className="divide-y divide-slate-800">
            {(requests || []).length === 0 && (
              <p className="text-slate-400">Noch keine Anfragen erstellt.</p>
            )}
            {(requests || []).map((r) => (
              <div key={r.id as string} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{r.subject || 'Anfrage'}</p>
                  <p className="text-sm text-slate-400">{new Date(r.created_at as string).toLocaleString('de-DE')}</p>
                </div>
                <span className="text-sm text-slate-300">{r.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
