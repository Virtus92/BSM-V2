'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Building,
  User,
  Briefcase,
  Users,
  CheckSquare,
  Clock,
  MessageSquare,
  Activity,
  Phone,
  Mail,
  Calendar,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Timer,
  Star,
  ArrowLeft,
  MoreVertical,
  Edit,
  Send,
  FileText,
  Award,
  MapPin
} from 'lucide-react';
import Link from 'next/link';
import { CompleteUserData, formatUserDate, getUserDisplayName } from '@/lib/user-utils';

// Real database interfaces based on schema analysis
interface EmployeeProfile {
  id: string;
  user_id: string;
  employee_id?: string;
  department_id?: string;
  job_title?: string;
  employment_type?: string;
  direct_phone?: string;
  hire_date?: string;
  working_hours_per_week?: number;
  skills?: string[];
  certifications?: string[];
  languages?: string[];
  performance_rating?: number;
  manager_id?: string;
  is_active: boolean;
  departments?: {
    id: string;
    name: string;
    manager_id?: string;
  };
  managers?: {
    id: string;
    user_profiles: {
      first_name?: string;
      last_name?: string;
      email: string;
    };
  };
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  assigned_to?: string;
  assigned_by?: string;
  due_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  started_at?: string;
  completed_at?: string;
  customer_id?: string;
  contact_request_id?: string;
  progress_percentage: number;
  category?: string;
  customers?: {
    id: string;
    company_name?: string;
    contact_person?: string;
  };
  contact_requests?: {
    id: string;
    subject: string;
    status: string;
  };
}

interface ManagedCustomer {
  id: string;
  company_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  status: 'prospect' | 'active' | 'inactive' | 'archived';
  website?: string;
  industry?: string;
  created_at: string;
  user_id?: string;
}

interface AssignedRequest {
  id: string;
  subject: string;
  status: 'new' | 'in_progress' | 'responded' | 'converted' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  customer_user_id?: string;
  company?: string;
  name: string;
  email: string;
  request_assignments?: {
    id: string;
    assigned_at: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    estimated_hours?: number;
    notes?: string;
  };
}

interface CustomerChatMessage {
  id: string;
  customer_id: string;
  message: string;
  is_from_customer: boolean;
  sender_id: string;
  created_at: string;
  customers?: {
    company_name?: string;
    contact_person?: string;
    assigned_employee_id?: string;
  };
}

interface ActivityLog {
  id: string;
  action: string;
  resource_type: string;
  resource_identifier?: string;
  description?: string;
  created_at: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  success: boolean;
  ip_address?: string;
}

interface EmployeeDetailViewProps {
  user: CompleteUserData;
  employeeProfile?: EmployeeProfile | null;
  tasks?: Task[] | null;
  managedCustomers?: ManagedCustomer[] | null;
  assignedRequests?: AssignedRequest[] | null;
  recentChats?: CustomerChatMessage[] | null;
  activityLogs?: ActivityLog[] | null;
}

export function EmployeeDetailView({
  user,
  employeeProfile,
  tasks = [],
  managedCustomers = [],
  assignedRequests = [],
  recentChats = [],
  activityLogs = []
}: EmployeeDetailViewProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const displayName = getUserDisplayName(user);

  // Debug logging to see what data we're getting
  console.log('EmployeeDetailView Debug:', {
    user: user.id,
    userType: user.profile?.user_type,
    employeeProfile: employeeProfile ? 'exists' : 'null',
    tasksCount: tasks?.length || 0,
    managedCustomersCount: managedCustomers?.length || 0,
    assignedRequestsCount: assignedRequests?.length || 0,
    recentChatsCount: recentChats?.length || 0,
    activityLogsCount: activityLogs?.length || 0
  });

  // Filter chat messages for this employee's managed customers
  const filteredChats = useMemo(() => {
    if (!recentChats || !managedCustomers) return [];
    const managedCustomerIds = managedCustomers.map(c => c.id);
    return recentChats
      .filter(chat => managedCustomerIds.includes(chat.customer_id))
      .slice(0, 10);
  }, [recentChats, managedCustomers]);

  // Calculate work statistics - handle null/undefined arrays properly
  const workStats = useMemo(() => {
    const safeTasksArray = Array.isArray(tasks) ? tasks : [];
    const safeRequestsArray = Array.isArray(assignedRequests) ? assignedRequests : [];
    const safeCustomersArray = Array.isArray(managedCustomers) ? managedCustomers : [];

    const taskStats = {
      total: safeTasksArray.length,
      completed: safeTasksArray.filter(t => t.status === 'done').length,
      inProgress: safeTasksArray.filter(t => t.status === 'in_progress').length,
      pending: safeTasksArray.filter(t => t.status === 'todo').length,
      overdue: safeTasksArray.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length
    };

    const requestStats = {
      total: safeRequestsArray.length,
      new: safeRequestsArray.filter(r => r.status === 'new').length,
      inProgress: safeRequestsArray.filter(r => r.status === 'in_progress').length,
      completed: safeRequestsArray.filter(r => r.status === 'responded' || r.status === 'converted').length
    };

    const customerStats = {
      total: safeCustomersArray.length,
      active: safeCustomersArray.filter(c => c.status === 'active').length,
      prospects: safeCustomersArray.filter(c => c.status === 'prospect').length
    };

    const totalHoursLogged = safeTasksArray.reduce((sum, task) => sum + (task.actual_hours || 0), 0);
    const totalHoursEstimated = safeTasksArray.reduce((sum, task) => sum + (task.estimated_hours || 0), 0);

    return {
      taskStats,
      requestStats,
      customerStats,
      totalHoursLogged,
      totalHoursEstimated,
      efficiency: totalHoursEstimated > 0 ? (totalHoursLogged / totalHoursEstimated) * 100 : 0
    };
  }, [tasks, assignedRequests, managedCustomers]);

  // Also add debug logging for arrays
  console.log('Array contents:', {
    tasks: Array.isArray(tasks) ? tasks : 'not array',
    managedCustomers: Array.isArray(managedCustomers) ? managedCustomers : 'not array',
    assignedRequests: Array.isArray(assignedRequests) ? assignedRequests : 'not array'
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
      case 'responded':
      case 'converted':
      case 'active':
        return 'text-green-400';
      case 'in_progress':
        return 'text-blue-400';
      case 'todo':
      case 'new':
        return 'text-yellow-400';
      case 'cancelled':
      case 'blocked':
      case 'archived':
        return 'text-red-400';
      case 'prospect':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-400 bg-red-500/10';
      case 'high':
        return 'text-orange-400 bg-orange-500/10';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/10';
      case 'low':
        return 'text-green-400 bg-green-500/10';
      default:
        return 'text-gray-400 bg-gray-500/10';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="fade-in-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <Link href="/dashboard/users">
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-blue-500/10 flex items-center justify-center ring-2 ring-blue-500/20">
                  <Briefcase className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-3xl font-bold text-white">
                    {displayName}
                  </h1>
                  <p className="text-sm sm:text-base text-blue-400 flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    {employeeProfile?.job_title || 'Mitarbeiter'}
                    {employeeProfile?.departments?.name && (
                      <span className="text-gray-400">• {employeeProfile.departments.name}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/dashboard/users/${user.id}/edit`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Edit className="w-4 h-4" />
                  <span className="hidden sm:inline">Bearbeiten</span>
                </Button>
              </Link>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <Card className="modern-card border-0">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Aufgaben</p>
                    <p className="text-lg sm:text-xl font-bold text-white">
                      {workStats.taskStats.completed}/{workStats.taskStats.total}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="modern-card border-0">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Anfragen</p>
                    <p className="text-lg sm:text-xl font-bold text-white">
                      {workStats.requestStats.completed}/{workStats.requestStats.total}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="modern-card border-0">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Kunden</p>
                    <p className="text-lg sm:text-xl font-bold text-white">
                      {workStats.customerStats.active}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="modern-card border-0">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <Timer className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Stunden</p>
                    <p className="text-lg sm:text-xl font-bold text-white">
                      {workStats.totalHoursLogged.toFixed(1)}h
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <div className="fade-in-up">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            {/* Mobile Tab Navigation */}
            <div className="sm:hidden">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full h-12 px-4 rounded-lg border border-white/10 bg-gray-800/50 text-white text-sm"
              >
                <option value="overview">📊 Übersicht</option>
                <option value="tasks">✅ Aufgaben ({workStats.taskStats.total})</option>
                <option value="customers">👥 Kunden ({workStats.customerStats.total})</option>
                <option value="requests">💬 Anfragen ({workStats.requestStats.total})</option>
                <option value="chats">💬 Chats ({filteredChats?.length || 0})</option>
                <option value="activity">📈 Aktivität</option>
              </select>
            </div>

            {/* Desktop Tab Navigation */}
            <TabsList className="hidden sm:grid w-full grid-cols-6 gap-1 bg-gray-800/50 p-1">
              <TabsTrigger value="overview" className="text-sm">Übersicht</TabsTrigger>
              <TabsTrigger value="tasks" className="text-sm">
                Aufgaben
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-white/20 rounded">
                  {workStats.taskStats.total}
                </span>
              </TabsTrigger>
              <TabsTrigger value="customers" className="text-sm">
                Kunden
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-white/20 rounded">
                  {workStats.customerStats.total}
                </span>
              </TabsTrigger>
              <TabsTrigger value="requests" className="text-sm">
                Anfragen
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-white/20 rounded">
                  {workStats.requestStats.total}
                </span>
              </TabsTrigger>
              <TabsTrigger value="chats" className="text-sm">Chats</TabsTrigger>
              <TabsTrigger value="activity" className="text-sm">Aktivität</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Employee Info */}
                <Card className="modern-card border-0 lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Mitarbeiter-Informationen
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm text-muted-foreground">Mitarbeiter-ID</label>
                          <p className="font-medium">{employeeProfile?.employee_id || 'Nicht vergeben'}</p>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Abteilung</label>
                          <p className="font-medium">{employeeProfile?.departments?.name || 'Nicht zugewiesen'}</p>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Position</label>
                          <p className="font-medium">{employeeProfile?.job_title || 'Nicht definiert'}</p>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Anstellungsart</label>
                          <p className="font-medium capitalize">
                            {employeeProfile?.employment_type?.replace('_', ' ') || 'Vollzeit'}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm text-muted-foreground">Eintrittsdatum</label>
                          <p className="font-medium">
                            {employeeProfile?.hire_date ? formatUserDate(employeeProfile.hire_date) : 'Nicht verfügbar'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Wochenstunden</label>
                          <p className="font-medium">{employeeProfile?.working_hours_per_week || 40}h</p>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Direkte Telefonnummer</label>
                          <p className="font-medium">{employeeProfile?.direct_phone || user.profile?.phone || 'Nicht verfügbar'}</p>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Performance</label>
                          <div className="flex items-center gap-2">
                            {employeeProfile?.performance_rating && (
                              <>
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < employeeProfile.performance_rating!
                                          ? 'text-yellow-400 fill-current'
                                          : 'text-gray-600'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  ({employeeProfile.performance_rating.toFixed(1)}/5.0)
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Skills */}
                    {employeeProfile?.skills && employeeProfile.skills.length > 0 && (
                      <div>
                        <label className="text-sm text-muted-foreground">Fähigkeiten</label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {employeeProfile.skills.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Certifications */}
                    {employeeProfile?.certifications && employeeProfile.certifications.length > 0 && (
                      <div>
                        <label className="text-sm text-muted-foreground">Zertifikate</label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {employeeProfile.certifications.map((cert, index) => (
                            <Badge key={index} variant="outline" className="text-xs gap-1">
                              <Award className="w-3 h-3" />
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Performance Overview */}
                <div className="space-y-4">
                  <Card className="modern-card border-0">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Aufgaben Abschlussrate</span>
                          <span>
                            {workStats.taskStats.total > 0
                              ? Math.round((workStats.taskStats.completed / workStats.taskStats.total) * 100)
                              : 0}%
                          </span>
                        </div>
                        <Progress
                          value={workStats.taskStats.total > 0 ? (workStats.taskStats.completed / workStats.taskStats.total) * 100 : 0}
                          className="h-2"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Zeitschätzung Genauigkeit</span>
                          <span>{Math.min(workStats.efficiency, 100).toFixed(0)}%</span>
                        </div>
                        <Progress
                          value={Math.min(workStats.efficiency, 100)}
                          className="h-2"
                        />
                      </div>

                      {workStats.taskStats.overdue > 0 && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                          <div className="flex items-center gap-2 text-red-400">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              {workStats.taskStats.overdue} überfällige Aufgaben
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card className="modern-card border-0">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Schnellzugriff
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Link href={`/dashboard/tasks?assigned_to=${user.id}`} className="block">
                          <Button variant="outline" className="w-full justify-start gap-2 h-10">
                            <CheckSquare className="w-4 h-4" />
                            Meine Aufgaben
                          </Button>
                        </Link>
                        <Link href={`/dashboard/customers?employee=${user.id}`} className="block">
                          <Button variant="outline" className="w-full justify-start gap-2 h-10">
                            <Users className="w-4 h-4" />
                            Meine Kunden
                          </Button>
                        </Link>
                        <Link href={`/dashboard/requests?assigned_to=${user.id}`} className="block">
                          <Button variant="outline" className="w-full justify-start gap-2 h-10">
                            <MessageSquare className="w-4 h-4" />
                            Anfragen bearbeiten
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              <Card className="modern-card border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <CheckSquare className="w-5 h-5" />
                      Zugewiesene Aufgaben
                    </CardTitle>
                    <Badge variant="outline">
                      {workStats.taskStats.total} Aufgaben
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {tasks && tasks.length > 0 ? (
                    <div className="space-y-3">
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          className="p-4 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-white truncate">{task.title}</h4>
                              {task.description && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-3">
                              <Badge variant="outline" className={`${getPriorityColor(task.priority)} text-xs`}>
                                {task.priority}
                              </Badge>
                              <Badge variant="outline" className={`${getStatusColor(task.status)} text-xs`}>
                                {task.status}
                              </Badge>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                              {task.due_date && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>{formatUserDate(task.due_date)}</span>
                                </div>
                              )}
                              {task.estimated_hours && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{task.estimated_hours}h geschätzt</span>
                                </div>
                              )}
                              {task.customers?.company_name && (
                                <div className="flex items-center gap-1">
                                  <Building className="w-4 h-4" />
                                  <span>{task.customers.company_name}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              {task.progress_percentage > 0 && (
                                <div className="flex items-center gap-2">
                                  <Progress value={task.progress_percentage} className="h-2 w-20" />
                                  <span className="text-xs text-muted-foreground">{task.progress_percentage}%</span>
                                </div>
                              )}

                              <div className="flex items-center gap-2 ml-auto">
                                {task.status !== 'done' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-3 text-xs"
                                    onClick={() => {
                                      // TODO: Implement task status update
                                      console.log('Update task status:', task.id);
                                    }}
                                  >
                                    {task.status === 'todo' ? 'Starten' : task.status === 'in_progress' ? 'Fertig' : 'Aktualisieren'}
                                  </Button>
                                )}
                                <Link href={`/dashboard/tasks/${task.id}`}>
                                  <Button variant="ghost" size="sm" className="h-7 px-3 text-xs">
                                    Details
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">Keine Aufgaben zugewiesen</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customers" className="space-y-4">
              <Card className="modern-card border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Verwaltete Kunden
                    </CardTitle>
                    <Badge variant="outline">
                      {workStats.customerStats.total} Kunden
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {managedCustomers && managedCustomers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {managedCustomers.map((customer) => (
                        <div
                          key={customer.id}
                          className="p-4 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-white truncate">
                                {customer.company_name || customer.contact_person || 'Unbenannt'}
                              </h4>
                              {customer.contact_person && customer.company_name && (
                                <p className="text-sm text-muted-foreground">{customer.contact_person}</p>
                              )}
                            </div>
                            <Badge variant="outline" className={`${getStatusColor(customer.status)} text-xs`}>
                              {customer.status}
                            </Badge>
                          </div>

                          <div className="space-y-2 text-sm text-muted-foreground">
                            {customer.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                <span className="truncate">{customer.email}</span>
                              </div>
                            )}
                            {customer.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                <span>{customer.phone}</span>
                              </div>
                            )}
                            {customer.industry && (
                              <div className="flex items-center gap-2">
                                <Building className="w-4 h-4" />
                                <span>{customer.industry}</span>
                              </div>
                            )}
                          </div>

                          <div className="mt-3 pt-3 border-t border-white/10">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Erstellt: {formatUserDate(customer.created_at)}</span>
                              <Link href={`/dashboard/customers/${customer.id}`}>
                                <Button variant="ghost" size="sm" className="h-6 px-2">
                                  Details
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">Keine Kunden zugewiesen</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="requests" className="space-y-4">
              <Card className="modern-card border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      Zugewiesene Anfragen
                    </CardTitle>
                    <Badge variant="outline">
                      {workStats.requestStats.total} Anfragen
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {assignedRequests && assignedRequests.length > 0 ? (
                    <div className="space-y-3">
                      {assignedRequests.map((request) => (
                        <div
                          key={request.id}
                          className="p-4 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-white truncate">{request.subject}</h4>
                              <p className="text-sm text-muted-foreground">
                                von {request.name} ({request.email})
                                {request.company && <span> • {request.company}</span>}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-3">
                              <Badge variant="outline" className={`${getPriorityColor(request.priority)} text-xs`}>
                                {request.priority}
                              </Badge>
                              <Badge variant="outline" className={`${getStatusColor(request.status)} text-xs`}>
                                {request.status}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-4 text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>Zugewiesen: {formatUserDate(request.request_assignments?.assigned_at || request.created_at)}</span>
                              </div>
                              {request.request_assignments?.estimated_hours && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{request.request_assignments.estimated_hours}h geschätzt</span>
                                </div>
                              )}
                            </div>
                            <Link href={`/dashboard/requests/${request.id}`}>
                              <Button variant="ghost" size="sm" className="h-7 px-3">
                                Bearbeiten
                              </Button>
                            </Link>
                          </div>

                          {request.request_assignments?.notes && (
                            <div className="mt-3 p-3 rounded bg-gray-800/50">
                              <p className="text-sm text-muted-foreground">
                                <strong>Notizen:</strong> {request.request_assignments.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">Keine Anfragen zugewiesen</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chats" className="space-y-4">
              <Card className="modern-card border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      Kürzliche Chat-Nachrichten
                    </CardTitle>
                    <Badge variant="outline">
                      {filteredChats?.length || 0} Nachrichten
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredChats && filteredChats.length > 0 ? (
                    <div className="space-y-3">
                      {filteredChats.map((message) => (
                        <div
                          key={message.id}
                          className="p-4 rounded-lg border border-white/10"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                message.is_from_customer ? 'bg-blue-400' : 'bg-green-400'
                              }`} />
                              <span className="font-medium text-sm">
                                {message.customers?.company_name || message.customers?.contact_person || 'Kunde'}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {message.is_from_customer ? 'Kunde' : 'Mitarbeiter'}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatUserDate(message.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-300 line-clamp-3">
                            {message.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">Keine Chat-Nachrichten</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <Card className="modern-card border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Aktivitätsverlauf
                    </CardTitle>
                    <Badge variant="outline">
                      {activityLogs?.length || 0} Einträge
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {activityLogs && activityLogs.length > 0 ? (
                    <div className="space-y-3">
                      {activityLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-start gap-3 p-3 rounded-lg border border-white/10"
                        >
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            log.severity === 'critical' ? 'bg-red-400' :
                            log.severity === 'high' ? 'bg-orange-400' :
                            log.severity === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm text-white">
                                {log.action} - {log.resource_type}
                              </span>
                              <Badge variant="outline" className={`${log.success ? 'text-green-400' : 'text-red-400'} text-xs`}>
                                {log.success ? 'Erfolgreich' : 'Fehler'}
                              </Badge>
                            </div>
                            {log.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {log.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{formatUserDate(log.created_at)}</span>
                              {log.resource_identifier && (
                                <span>ID: {log.resource_identifier}</span>
                              )}
                              {log.ip_address && (
                                <span>IP: {log.ip_address}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">Keine Aktivitäten protokolliert</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}