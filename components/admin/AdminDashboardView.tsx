'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  UserCheck,
  ClipboardList,
  AlertTriangle,
  TrendingUp,
  Calendar,
  FileText,
  Activity,
  Settings,
  Plus,
  Search,
  Filter,
  Download,
  Bell,
  Shield,
  Database,
  Server,
  BarChart3,
  Target,
  Zap,
  Globe,
  Lock,
  Mail,
  Phone,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  MoreVertical
} from 'lucide-react';
import Link from 'next/link';
import { CreateUserModal } from '@/components/users/CreateUserModal';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';

interface DashboardData {
  userCounts: any[];
  recentActivity: any[];
  taskStats: any[];
  pendingRequests: any[];
  employeePerformance: any[];
}

interface AdminDashboardViewProps {
  data: DashboardData;
}

export function AdminDashboardView({ data }: AdminDashboardViewProps) {
  const { userCounts, recentActivity, taskStats, pendingRequests, employeePerformance } = data;

  const adminCount = userCounts.filter(u => u.user_type === 'admin').length;
  const employeeCount = userCounts.filter(u => u.user_type === 'employee').length;
  const customerCount = userCounts.filter(u => u.user_type === 'customer').length;

  const activeTasks = taskStats.filter(t => t.status === 'in_progress').length;
  const completedTasks = taskStats.filter(t => t.status === 'done').length;
  const pendingTasks = taskStats.filter(t => t.status === 'todo').length;
  const overdueTasks = 0; // compute via due_date server-side if needed
  const highPriorityTasks = taskStats.filter(t => t.priority === 'high' || t.priority === 'urgent').length;

  const criticalAlerts = recentActivity.filter(a => a.severity === 'critical').length;
  const systemHealth = 98.5; // Mock system health percentage

  return (
    <div className="space-y-4 md:space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-3">
              <span className="text-mystery-gradient">Admin Dashboard</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Systemübersicht und zentrale Verwaltung
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
            <Button variant="outline" size="sm" className="flex items-center gap-2 whitespace-nowrap">
              <Download className="w-4 h-4" />
              System Report
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2 whitespace-nowrap">
              <Settings className="w-4 h-4" />
              Einstellungen
            </Button>
          </div>
        </div>
      </div>

      {/* System Status Alert */}
      {criticalAlerts > 0 && (
        <div className="modern-card border-red-500/20 bg-red-500/5 fade-in-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-red-500">Kritische Systemwarnungen ({criticalAlerts})</p>
              <p className="text-sm text-red-500/80">Es gibt kritische Ereignisse, die sofortige Aufmerksamkeit erfordern.</p>
            </div>
            <Button variant="outline" size="sm" className="border-red-500/50 text-red-300 hover:bg-red-500/20">
              Details anzeigen
            </Button>
          </div>
        </div>
      )}

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 fade-in-up">

        {/* System Health */}
        <Card className="modern-card md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Systemstatus</CardTitle>
            <div className={`p-2 rounded-full ${systemHealth > 95 ? 'bg-green-500/20' : systemHealth > 80 ? 'bg-yellow-500/20' : 'bg-red-500/20'}`}>
              <Activity className={`h-3 w-3 md:h-4 md:w-4 ${systemHealth > 95 ? 'text-green-400' : systemHealth > 80 ? 'text-yellow-400' : 'text-red-400'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-lg md:text-2xl font-bold ${systemHealth > 95 ? 'text-green-400' : systemHealth > 80 ? 'text-yellow-400' : 'text-red-400'}`}>
              {systemHealth}%
            </div>
            <p className="text-xs text-muted-foreground">Verfügbarkeit</p>
            <div className="mt-2 w-full bg-secondary rounded-full h-2">
              <div
                className={`h-2 rounded-full ${systemHealth > 95 ? 'bg-green-500' : systemHealth > 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${systemHealth}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        {/* Total Users */}
        <Card className="modern-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Benutzer</CardTitle>
            <Users className="h-3 w-3 md:h-4 md:w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">{userCounts.length}</div>
            <p className="text-xs text-muted-foreground">
              {adminCount}A · {employeeCount}M · {customerCount}K
            </p>
          </CardContent>
        </Card>

        {/* Active Tasks */}
        <Card className="modern-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Aufgaben</CardTitle>
            <ClipboardList className="h-3 w-3 md:h-4 md:w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">{taskStats.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeTasks} aktiv · {pendingTasks} ausstehend
            </p>
          </CardContent>
        </Card>

        {/* Pending Requests */}
        <Card className="modern-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Anfragen</CardTitle>
            <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold text-orange-400">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground">Ausstehend</p>
          </CardContent>
        </Card>

        {/* System Performance */}
        <Card className="modern-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Performance</CardTitle>
            <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold text-green-400">92%</div>
            <p className="text-xs text-muted-foreground">Durchschnitt</p>
          </CardContent>
        </Card>
        </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 fade-in-up">

        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">

          {/* Quick Actions */}
          <Card className="modern-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Schnellaktionen
              </CardTitle>
              <CardDescription>
                Häufig verwendete Verwaltungsfunktionen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <CreateUserModal
                  trigger={
                    <Button variant="ghost" className="w-full justify-start h-auto p-4 hover:bg-accent transition-colors">
                      <div className="flex items-center gap-3">
                        <Plus className="h-5 w-5 text-blue-400" />
                        <div className="text-left">
                          <div className="font-medium text-sm">Benutzer erstellen</div>
                          <div className="text-xs text-muted-foreground">Neuen Mitarbeiter/Admin anlegen</div>
                        </div>
                      </div>
                    </Button>
                  }
                />

                <CreateTaskModal
                  trigger={
                    <Button variant="ghost" className="w-full justify-start h-auto p-4 hover:bg-accent transition-colors">
                      <div className="flex items-center gap-3">
                        <Target className="h-5 w-5 text-purple-400" />
                        <div className="text-left">
                          <div className="font-medium text-sm">Aufgabe zuweisen</div>
                          <div className="text-xs text-muted-foreground">Neue Aufgabe erstellen</div>
                        </div>
                      </div>
                    </Button>
                  }
                />

                <Button variant="ghost" className="w-full justify-start h-auto p-4 hover:bg-accent transition-colors">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-green-400" />
                    <div className="text-left">
                      <div className="font-medium text-sm">Bericht erstellen</div>
                      <div className="text-xs text-muted-foreground">Performance-Analyse</div>
                    </div>
                  </div>
                </Button>

                <Button variant="ghost" className="w-full justify-start h-auto p-4 hover:bg-accent transition-colors">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-orange-400" />
                    <div className="text-left">
                      <div className="font-medium text-sm">Benachrichtigung</div>
                      <div className="text-xs text-muted-foreground">System-Broadcast senden</div>
                    </div>
                  </div>
                </Button>

                <Button variant="ghost" className="w-full justify-start h-auto p-4 hover:bg-accent transition-colors">
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-blue-400" />
                    <div className="text-left">
                      <div className="font-medium text-sm">Backup erstellen</div>
                      <div className="text-xs text-muted-foreground">System-Sicherung</div>
                    </div>
                  </div>
                </Button>

                <Button variant="ghost" className="w-full justify-start h-auto p-4 hover:bg-accent transition-colors">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-red-400" />
                    <div className="text-left">
                      <div className="font-medium text-sm">Sicherheitsscan</div>
                      <div className="text-xs text-muted-foreground">Vulnerability Check</div>
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="modern-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                Systemaktivität
              </CardTitle>
              <CardDescription>
                Letzte Benutzeraktionen und Systemereignisse
              </CardDescription>
            </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.slice(0, 8).map((activity, index) => {
                    const getSeverityColor = (severity: string) => {
                      switch (severity) {
                        case 'critical': return 'bg-red-500';
                        case 'high': return 'bg-orange-500';
                        case 'medium': return 'bg-yellow-500';
                        default: return 'bg-blue-500';
                      }
                    };

                    return (
                      <div key={activity.id || index} className="flex items-start gap-3 p-3 bg-accent/50 rounded-lg hover:bg-accent transition-colors">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getSeverityColor(activity.severity)}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {activity.user_profiles?.full_name || activity.user_profiles?.email || 'System'}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {activity.action}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {activity.resource_type} operation
                          </p>
                          <p className="text-xs text-muted-foreground/70">
                            {new Date(activity.created_at).toLocaleString('de-DE')}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" className="p-1">
                          <Eye className="w-3 h-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <Link href="/dashboard/activity">
                    <Button variant="outline" className="w-full">
                      Alle Aktivitäten anzeigen
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-4 md:space-y-6">

          {/* System Overview */}
          <Card className="modern-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5 text-green-400" />
                Systemübersicht
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm">API Status</span>
                </div>
                <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                  Online
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-400" />
                  <span className="text-sm">Datenbank</span>
                </div>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                  Optimal
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-purple-400" />
                  <span className="text-sm">CDN Status</span>
                </div>
                <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                  Aktiv
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm">SSL-Zertifikat</span>
                </div>
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                  90 Tage
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card className="modern-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-yellow-400" />
                Top Performer
              </CardTitle>
            </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {employeePerformance.slice(0, 5).map((employee, index) => (
                    <div key={employee.id} className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 text-white text-sm font-medium flex-shrink-0">
                        #{index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {employee.user_profiles?.full_name || employee.user_profiles?.email}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {employee.departments?.name}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {employee.performance_score || 0}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Score
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <Link href="/dashboard/users?role=employee">
                    <Button variant="outline" className="w-full">
                      Alle Mitarbeiter
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

          {/* Management Links */}
          <Card className="modern-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-muted-foreground" />
                Verwaltung
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/dashboard/users">
                <Button variant="ghost" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Benutzerverwaltung
                </Button>
              </Link>

              <Link href="/dashboard/users?role=employee">
                <Button variant="ghost" className="w-full justify-start">
                  <UserCheck className="w-4 h-4 mr-2" />
                  Mitarbeiterverwaltung
                </Button>
              </Link>

              <Link href="/dashboard/tasks">
                <Button variant="ghost" className="w-full justify-start">
                  <Target className="w-4 h-4 mr-2" />
                  Aufgabenverwaltung
                </Button>
              </Link>

              <Link href="/dashboard/requests">
                <Button variant="ghost" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Anfragenverwaltung
                </Button>
              </Link>

              <Link href="/dashboard/security">
                <Button variant="ghost" className="w-full justify-start">
                  <Shield className="w-4 h-4 mr-2" />
                  Sicherheitseinstellungen
                </Button>
              </Link>

              <Link href="/dashboard/automation">
                <Button variant="ghost" className="w-full justify-start">
                  <Server className="w-4 h-4 mr-2" />
                  Automation & n8n
                </Button>
              </Link>
            </CardContent>
          </Card>

        </div>
      </div>

    </div>
  );
}
