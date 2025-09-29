import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function WorkspaceActivityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?redirectTo=/workspace/activity');

  const { data: logs } = await supabase
    .from('user_activity_logs')
    .select('id, action, created_at, severity, resource_type')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Meine Aktivität</h1>
      <Card>
        <CardHeader>
          <CardTitle>Letzte Aktionen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(logs || []).map((log) => (
              <div key={log.id} className="flex items-center justify-between border-b py-2 last:border-b-0">
                <div className="text-sm">
                  <div className="font-medium">{log.action}</div>
                  <div className="text-xs text-muted-foreground">{log.resource_type}</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(log.created_at).toLocaleString('de-DE')}
                </div>
              </div>
            ))}
            {(!logs || logs.length === 0) && (
              <div className="text-sm text-muted-foreground">Keine Aktivitäten gefunden.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

