'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Users,
  UserCheck,
  ClipboardList,
  AlertTriangle,
  TrendingUp,
  Activity,
  Plus,
  BarChart3,
  Target,
  Bell,
  Database,
  Download,
  FileText,
  MessageSquare,
  Clock,
  CheckCircle,
  Star,
  Trophy,
  Zap,
  Calendar,
  Building,
  Mail,
  Phone,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { CreateUserModal } from '@/components/users/CreateUserModal';

interface DashboardData {
  userCounts: any[];
  taskStats: any[];
  pendingRequests: any[];
  employeePerformance: any[];
}

interface NewAdminDashboardViewProps {
  data: DashboardData;
}

export function NewAdminDashboardView({ data }: NewAdminDashboardViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showSystemReportModal, setShowSystemReportModal] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const { userCounts, taskStats, pendingRequests, employeePerformance } = data;

  // Corrected user counts
  const adminCount = userCounts.filter(u => u.user_type === 'admin').length;
  const employeeCount = userCounts.filter(u => u.user_type === 'employee').length;
  const customerCount = userCounts.filter(u => u.user_type === 'customer').length;
  const totalUsers = adminCount + employeeCount + customerCount;

  const activeTasks = taskStats.filter(t => t.status === 'in_progress').length;
  const completedTasks = taskStats.filter(t => t.status === 'completed' || t.status === 'done').length;
  const pendingTasks = taskStats.filter(t => t.status === 'todo' || t.status === 'pending').length;

  const generateSystemReport = async () => {
    setReportLoading(true);
    try {
      const response = await fetch('/api/admin/system-report');
      if (!response.ok) {
        throw new Error('Fehler beim Generieren des System Reports');
      }
      const data = await response.json();
      setReportData(data.report);
      setShowSystemReportModal(true);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Fehler beim Generieren des System Reports'
      });
    } finally {
      setReportLoading(false);
    }
  };

  const downloadReport = async (format: 'json' | 'csv' | 'excel') => {
    try {
      const response = await fetch('/api/admin/system-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format })
      });

      if (!response.ok) {
        throw new Error('Fehler beim Download des Reports');
      }

      if (format === 'csv') {
        const csvData = await response.text();
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `system-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `system-report-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }

      toast({
        title: 'Erfolg',
        description: 'Report wurde erfolgreich heruntergeladen'
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Fehler beim Download des Reports'
      });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-3">
              <span className="text-mystery-gradient">Business Service Management</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Zentrale Steuerung und Überwachung aller Geschäftsprozesse
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={generateSystemReport}
              disabled={reportLoading}
              className="flex items-center gap-2"
            >
              {reportLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {reportLoading ? 'Generiere...' : 'System Report'}
            </Button>
          </div>
        </div>
      </div>

      {/* Corrected Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 fade-in-up">
        <Card className="modern-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Benutzer gesamt</CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {adminCount} Admin · {employeeCount} Mitarbeiter · {customerCount} Kunden
            </p>
          </CardContent>
        </Card>

        <Card className="modern-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aufgaben</CardTitle>
            <ClipboardList className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">{taskStats.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeTasks} aktiv · {completedTasks} erledigt · {pendingTasks} offen
            </p>
          </CardContent>
        </Card>

        <Card className="modern-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anfragen</CardTitle>
            <MessageSquare className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              Ausstehende Bearbeitung
            </p>
          </CardContent>
        </Card>

        <Card className="modern-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {employeePerformance.length > 0
                ? Math.round((employeePerformance.reduce((acc, emp) => acc + (emp.employee_profiles?.performance_rating || 0), 0) / employeePerformance.length) * 20)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Durchschnitt Team</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in-up">

        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">

          {/* Fixed Quick Actions */}
          <Card className="modern-card border-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Schnellaktionen
              </CardTitle>
              <CardDescription>
                Wichtige Verwaltungsaufgaben schnell erledigen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  variant="ghost"
                  className="w-full justify-start h-auto p-4 hover:bg-accent transition-colors"
                  onClick={() => setShowCreateUserModal(true)}
                >
                  <div className="flex items-center gap-3">
                    <Plus className="h-5 w-5 text-blue-400" />
                    <div className="text-left">
                      <div className="font-medium text-sm">Benutzer erstellen</div>
                      <div className="text-xs text-muted-foreground">Neuen Mitarbeiter/Admin anlegen</div>
                    </div>
                  </div>
                </Button>

                <Link href="/dashboard/tasks">
                  <Button variant="ghost" className="w-full justify-start h-auto p-4 hover:bg-accent transition-colors">
                    <div className="flex items-center gap-3">
                      <Target className="h-5 w-5 text-purple-400" />
                      <div className="text-left">
                        <div className="font-medium text-sm">Aufgaben verwalten</div>
                        <div className="text-xs text-muted-foreground">Kanban Board öffnen</div>
                      </div>
                    </div>
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  className="w-full justify-start h-auto p-4 hover:bg-accent transition-colors"
                  onClick={generateSystemReport}
                  disabled={reportLoading}
                >
                  <div className="flex items-center gap-3">
                    {reportLoading ? (
                      <Loader2 className="h-5 w-5 text-green-400 animate-spin" />
                    ) : (
                      <BarChart3 className="h-5 w-5 text-green-400" />
                    )}
                    <div className="text-left">
                      <div className="font-medium text-sm">
                        {reportLoading ? 'Generiere Report...' : 'System Report'}
                      </div>
                      <div className="text-xs text-muted-foreground">Performance-Analyse erstellen</div>
                    </div>
                  </div>
                </Button>

                <Link href="/dashboard/users">
                  <Button variant="ghost" className="w-full justify-start h-auto p-4 hover:bg-accent transition-colors">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-blue-400" />
                      <div className="text-left">
                        <div className="font-medium text-sm">Benutzerverwaltung</div>
                        <div className="text-xs text-muted-foreground">Kanban Board öffnen</div>
                      </div>
                    </div>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>


        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">

          {/* Mitarbeiterübersicht - Top Performer */}
          <Card className="modern-card border-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Mitarbeiterübersicht
              </CardTitle>
              <CardDescription>
                Performance-Ranking nach Leistung sortiert
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {employeePerformance.length > 0 ? (
                  employeePerformance
                    .sort((a, b) => (b.employee_profiles?.performance_rating || 0) - (a.employee_profiles?.performance_rating || 0))
                    .slice(0, 5)
                    .map((employee, index) => (
                    <Link href={`/dashboard/users/${employee.id}`} key={employee.id}>
                      <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all cursor-pointer">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-medium flex-shrink-0 ${
                          index === 0 ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' :
                          index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500' :
                          index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700' :
                          'bg-gradient-to-br from-blue-500 to-blue-600'
                        }`}>
                          #{index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-white truncate">
                            {employee.first_name && employee.last_name
                              ? `${employee.first_name} ${employee.last_name}`
                              : employee.email}
                          </div>
                          <div className="text-xs text-white/60 truncate">
                            {employee.employee_profiles?.job_title ||
                             employee.employee_profiles?.departments?.name ||
                             'Mitarbeiter'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-white">
                            {Math.round((employee.employee_profiles?.performance_rating || 0) * 20)}%
                          </div>
                          <div className="text-xs text-white/50">
                            Performance
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-6 text-white/50">
                    <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <div className="text-sm">Keine Mitarbeiterdaten</div>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <Link href="/dashboard/users?role=employee">
                  <Button variant="outline" className="w-full">
                    Alle Mitarbeiter anzeigen
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Pending Requests Overview */}
          <Card className="modern-card border-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                Offene Anfragen
              </CardTitle>
              <CardDescription>
                Kundenanfragen die Bearbeitung benötigen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingRequests.length > 0 ? (
                  pendingRequests.slice(0, 5).map((request, index) => (
                    <Link href={`/dashboard/requests/${request.id}`} key={request.id}>
                      <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all cursor-pointer">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          request.priority === 'urgent' ? 'bg-red-500' :
                          request.priority === 'high' ? 'bg-orange-500' :
                          request.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white mb-1 truncate">
                            {request.subject || `Anfrage #${request.id.slice(0, 8)}`}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`text-xs ${
                              request.priority === 'urgent' ? 'text-red-400 border-red-500/20' :
                              request.priority === 'high' ? 'text-orange-400 border-orange-500/20' :
                              request.priority === 'medium' ? 'text-yellow-400 border-yellow-500/20' :
                              'text-blue-400 border-blue-500/20'
                            }`}>
                              {request.priority === 'urgent' ? 'Dringend' :
                               request.priority === 'high' ? 'Hoch' :
                               request.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                            </Badge>
                            <span className="text-xs text-white/50 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(request.created_at).toLocaleDateString('de-DE')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-6 text-white/50">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <div className="text-sm">Alle Anfragen bearbeitet</div>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <Link href="/dashboard/requests">
                  <Button variant="outline" className="w-full">
                    Alle Anfragen anzeigen
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Create User Modal */}
      {showCreateUserModal && (
        <CreateUserModal
          open={showCreateUserModal}
          onOpenChange={setShowCreateUserModal}
          onUserCreated={() => {
            toast({
              title: 'Erfolg',
              description: 'Benutzer wurde erfolgreich erstellt'
            });
            router.refresh();
          }}
        />
      )}

      {/* System Report Modal */}
      <Dialog open={showSystemReportModal} onOpenChange={setShowSystemReportModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto modern-card border-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              System Report
            </DialogTitle>
            <DialogDescription>
              Umfassende Analyse aller Systemmetriken und Performance-Indikatoren
            </DialogDescription>
          </DialogHeader>

          {reportData && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="modern-card border-0">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-blue-400">
                      {(reportData as any).summary.totalUsers}
                    </div>
                    <div className="text-sm text-muted-foreground">Benutzer gesamt</div>
                  </CardContent>
                </Card>
                <Card className="modern-card border-0">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-purple-400">
                      {(reportData as any).summary.totalTasks}
                    </div>
                    <div className="text-sm text-muted-foreground">Aufgaben gesamt</div>
                  </CardContent>
                </Card>
                <Card className="modern-card border-0">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-orange-400">
                      {(reportData as any).summary.totalRequests}
                    </div>
                    <div className="text-sm text-muted-foreground">Anfragen gesamt</div>
                  </CardContent>
                </Card>
                <Card className="modern-card border-0">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-400">
                      {(reportData as any).summary.averagePerformance}%
                    </div>
                    <div className="text-sm text-muted-foreground">Ø Performance</div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User Statistics */}
                <Card className="modern-card border-0">
                  <CardHeader>
                    <CardTitle className="text-lg">Benutzerstatistiken</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Admins</span>
                      <span className="font-medium">{(reportData as any).users.admin}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mitarbeiter</span>
                      <span className="font-medium">{(reportData as any).users.employee}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kunden</span>
                      <span className="font-medium">{(reportData as any).users.customer}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Aktive</span>
                      <span className="font-medium text-green-400">{(reportData as any).users.active}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Neu (30 Tage)</span>
                      <span className="font-medium text-blue-400">{(reportData as any).users.newThisMonth}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Task Statistics */}
                <Card className="modern-card border-0">
                  <CardHeader>
                    <CardTitle className="text-lg">Aufgabenstatistiken</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Erledigt</span>
                      <span className="font-medium text-green-400">{(reportData as any).tasks.completed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>In Bearbeitung</span>
                      <span className="font-medium text-yellow-400">{(reportData as any).tasks.inProgress}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Offen</span>
                      <span className="font-medium text-blue-400">{(reportData as any).tasks.pending}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dringend</span>
                      <span className="font-medium text-red-400">{(reportData as any).tasks.urgent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completion Rate</span>
                      <span className="font-medium">{(reportData as any).systemHealth.taskCompletionRate}%</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* System Health */}
              <Card className="modern-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg">System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {(reportData as any).systemHealth.taskCompletionRate}%
                      </div>
                      <div className="text-sm text-muted-foreground">Task Completion</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {(reportData as any).systemHealth.requestResponseRate}%
                      </div>
                      <div className="text-sm text-muted-foreground">Request Response</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">
                        {(reportData as any).systemHealth.customerSatisfaction}%
                      </div>
                      <div className="text-sm text-muted-foreground">Satisfaction</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-400">
                        {(reportData as any).systemHealth.systemLoad}
                      </div>
                      <div className="text-sm text-muted-foreground">Daily Activity</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Download Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
                <Button
                  onClick={() => downloadReport('json')}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Als JSON herunterladen
                </Button>
                <Button
                  onClick={() => downloadReport('csv')}
                  variant="outline"
                  className="flex-1"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Als CSV herunterladen
                </Button>
                <Button
                  onClick={() => setShowSystemReportModal(false)}
                  className="flex-1 mystery-button"
                >
                  Schließen
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}