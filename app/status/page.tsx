export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getHealth() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/health`, { cache: 'no-store' }).catch(() => null)
  if (res && res.ok) return res.json()
  // Fallback to relative fetch in edge/runtime
  const rel = await fetch('/api/health', { cache: 'no-store' }).catch(() => null)
  return rel?.ok ? rel.json() : { ok: false }
}

export default async function StatusPage() {
  const health = await getHealth()
  const Item = ({ label, ok, details }: { label: string, ok: boolean, details?: any }) => (
    <div className={`flex items-center justify-between rounded-lg border p-4 ${ok ? 'border-green-800 bg-green-900/20' : 'border-red-800 bg-red-900/20'}`}>
      <span className="font-medium">{label}</span>
      <span className={ok ? 'text-green-400' : 'text-red-400'}>{ok ? 'OK' : 'FAILED'}</span>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <h1 className="text-2xl font-bold">Systemstatus</h1>
        <p className="text-slate-400">Überprüft Verbindungen zu Supabase und n8n.</p>

        <Item label="Environment" ok={!!health?.env?.ok} />
        <Item label="Supabase" ok={!!health?.supabase?.ok} />
        <Item label="n8n" ok={!!health?.n8n?.ok} />

        <pre className="mt-6 text-xs text-slate-300 bg-slate-900/60 border border-slate-800 rounded-lg p-4 overflow-x-auto">
{JSON.stringify(health, null, 2)}
        </pre>

      </div>
    </div>
  )
}

