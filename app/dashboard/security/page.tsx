import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Shield,
  AlertTriangle,
  Eye,
  Activity,
  Lock,
  UserCheck,
  Settings,
  RefreshCw
} from 'lucide-react';

export default async function SecurityDashboard() {
  const supabase = await createClient();

  // Check if user is admin
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/auth/login');
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('user_type, is_active')
    .eq('id', user.id)
    .single();

  if (!profile?.is_active || profile?.user_type !== 'admin') {
    redirect('/dashboard');
  }

  // Fetch security events
  const { data: securityEvents } = await supabase
    .from('security_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  // Fetch audit logs
  const { data: auditLogs } = await supabase
    .from('security_audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  // Get statistics
  const { count: totalEvents } = await supabase
    .from('security_events')
    .select('*', { count: 'exact', head: true });

  const { count: openEvents } = await supabase
    .from('security_events')
    .select('*', { count: 'exact', head: true })
    .eq('resolved', false);

  const { count: totalAudits } = await supabase
    .from('security_audit_logs')
    .select('*', { count: 'exact', head: true });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Security Dashboard</h1>
            <p className="text-gray-300">Überwachung und Verwaltung der Systemsicherheit</p>
          </div>
          <Button className="mystery-button">
            <RefreshCw className="w-4 h-4 mr-2" />
            Aktualisieren
          </Button>
        </div>

        {/* Security Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

          {/* Total Events */}
          <Card className="modern-card border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Sicherheitsereignisse</CardTitle>
              <Shield className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalEvents || 0}</div>
              <p className="text-xs text-gray-400">Gesamt</p>
            </CardContent>
          </Card>

          {/* Open Events */}
          <Card className="modern-card border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Offene Ereignisse</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">{openEvents || 0}</div>
              <p className="text-xs text-gray-400">Ungelöst</p>
            </CardContent>
          </Card>

          {/* Audit Logs */}
          <Card className="modern-card border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Audit Logs</CardTitle>
              <Eye className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalAudits || 0}</div>
              <p className="text-xs text-gray-400">Einträge</p>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="modern-card border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">System Status</CardTitle>
              <UserCheck className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">Secure</div>
              <p className="text-xs text-gray-400">Status</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Security Events */}
        <Card className="modern-card border-0">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              Aktuelle Sicherheitsereignisse
            </CardTitle>
            <CardDescription className="text-gray-400">
              Letzte 10 Sicherheitsereignisse
            </CardDescription>
          </CardHeader>
          <CardContent>
            {securityEvents && securityEvents.length > 0 ? (
              <div className="space-y-4">
                {securityEvents.map((event: any) => (
                  <div key={event.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        event.severity === 'high' ? 'bg-red-500' :
                        event.severity === 'medium' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`} />
                      <div>
                        <p className="text-white font-medium">{event.event_type}</p>
                        <p className="text-gray-400 text-sm">{event.details}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={event.resolved ? "secondary" : "destructive"}>
                        {event.resolved ? 'Gelöst' : 'Offen'}
                      </Badge>
                      <p className="text-gray-400 text-xs mt-1">
                        {new Date(event.created_at).toLocaleString('de-DE')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">Keine Sicherheitsereignisse gefunden</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Audit Logs */}
        <Card className="modern-card border-0">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Audit Logs
            </CardTitle>
            <CardDescription className="text-gray-400">
              Letzte 10 Systemaktivitäten
            </CardDescription>
          </CardHeader>
          <CardContent>
            {auditLogs && auditLogs.length > 0 ? (
              <div className="space-y-4">
                {auditLogs.map((log: any) => (
                  <div key={log.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center gap-3">
                      <Activity className="w-4 h-4 text-blue-400" />
                      <div>
                        <p className="text-white font-medium">{log.event_type}</p>
                        <p className="text-gray-400 text-sm">{log.method} {log.path}</p>
                        {log.user_role && (
                          <p className="text-gray-500 text-xs">User: {log.user_role}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        log.severity === 'high' ? 'destructive' :
                        log.severity === 'medium' ? 'default' :
                        'secondary'
                      }>
                        {log.severity}
                      </Badge>
                      <p className="text-gray-400 text-xs mt-1">
                        {new Date(log.created_at).toLocaleString('de-DE')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">Keine Audit Logs gefunden</p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}