import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserAccessibleResources, ACTIVE_TASK_STATUSES } from '@/lib/task-access-control';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  MessageSquare,
  CheckCircle,
  Clock,
  TrendingUp,
  FileText,
  Calendar,
  Star,
  MessageCircle
} from 'lucide-react';
import Link from 'next/link';

export default async function EmployeeWorkspace() {
  const supabase = await createClient();

  // Check if user is employee (admin can also access)
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/auth/login');
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('user_type, is_active, first_name, last_name')
    .eq('id', user.id)
    .single();

  if (!profile || !['employee', 'admin'].includes(profile.user_type)) {
    redirect('/auth/login');
  }

  // Get employee dashboard stats scoped to connected data
  const admin = createAdminClient();

  // Get task-based accessible resources for non-admin users
  const isAdmin = profile.user_type === 'admin';
  let taskAccessibleResources = { customerIds: [], requestIds: [], activeTasks: [] };

  if (!isAdmin) {
    taskAccessibleResources = await getUserAccessibleResources(user.id);
    console.log('Task-accessible resources for user:', user.id, taskAccessibleResources);
  }

  // Load assigned requests to compute status counts with task-based access
  let requestsQuery = admin
    .from('contact_requests')
    .select(`id, status, request_assignments!inner(assigned_to, is_active)`)
    .eq('request_assignments.assigned_to', user.id)
    .eq('request_assignments.is_active', true);

  // For non-admin users, also include task-accessible requests
  let taskAccessibleRequestsData = [];
  if (!isAdmin && taskAccessibleResources.requestIds.length > 0) {
    const { data: taskRequests } = await admin
      .from('contact_requests')
      .select('id, status')
      .in('id', taskAccessibleResources.requestIds);
    taskAccessibleRequestsData = taskRequests || [];
  }

  const { data: assignedRequests } = await requestsQuery;
  const allAccessibleRequests = [...(assignedRequests || []), ...taskAccessibleRequestsData];

  const totalRequests = allAccessibleRequests.length;
  const pendingRequests = allAccessibleRequests.filter(r => ['new', 'in_progress'].includes(r.status || 'new')).length;
  const completedRequests = allAccessibleRequests.filter(r => r.status === 'responded').length;

  // Customers assigned to or created by this user, including task-based access
  let customerQuery = admin
    .from('customers')
    .select('id', { count: 'exact', head: true });

  if (isAdmin) {
    // Admins see all customers
    // No additional filters
  } else {
    // Build access conditions for employees
    const accessConditions = [
      `assigned_employee_id.eq.${user.id}`,
      `created_by.eq.${user.id}`
    ];

    // Add task-based access
    if (taskAccessibleResources.customerIds.length > 0) {
      accessConditions.push(`id.in.(${taskAccessibleResources.customerIds.join(',')})`);
    }

    customerQuery = customerQuery.or(accessConditions.join(','));
  }

  const { count: totalCustomers } = await customerQuery;

  const { count: myTasks } = await supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)
    .in('status', ACTIVE_TASK_STATUSES as string[]);

  // Get recent requests with task-based access for non-admin users
  let recentRequestsQuery = admin
    .from('contact_requests')
    .select('id, name, subject, status, created_at, company, request_assignments!inner(assigned_to, is_active)')
    .eq('request_assignments.assigned_to', user.id)
    .eq('request_assignments.is_active', true);

  // For non-admin users, also include task-accessible requests
  if (!isAdmin && taskAccessibleResources.requestIds.length > 0) {
    // Extend query to include task-accessible requests
    recentRequestsQuery = admin
      .from('contact_requests')
      .select('id, name, subject, status, created_at, company')
      .or(`request_assignments.assigned_to.eq.${user.id},id.in.(${taskAccessibleResources.requestIds.join(',')})`)
      .order('created_at', { ascending: false })
      .limit(5);
  } else {
    recentRequestsQuery = recentRequestsQuery
      .order('created_at', { ascending: false })
      .limit(5);
  }

  const { data: recentRequests } = await recentRequestsQuery;

  const stats = [
    {
      title: 'Kunden verwalten',
      description: 'Kundenbeziehungen pflegen',
      count: totalCustomers || 0,
      subtitle: 'Registrierte Kunden',
      icon: Users,
      href: '/workspace/customers',
      color: 'blue'
    },
    {
      title: 'Anfragen bearbeiten',
      description: 'Kontaktanfragen verwalten',
      count: totalRequests || 0,
      subtitle: `${pendingRequests || 0} offen, ${completedRequests || 0} erledigt`,
      icon: MessageSquare,
      href: '/workspace/requests',
      color: 'green'
    },
    {
      title: 'Meine Aufgaben',
      description: 'Zu bearbeitende Aufgaben',
      count: myTasks || 0,
      subtitle: 'Offen / in Arbeit',
      icon: Clock,
      href: '/workspace/tasks',
      color: myTasks && myTasks > 0 ? 'orange' : 'green'
    },
    {
      title: 'Aktivitäten',
      description: 'Letzte Ereignisse',
      count: completedRequests || 0,
      subtitle: 'Zuletzt erledigt',
      icon: FileText,
      href: '/workspace/activity',
      color: 'purple'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'in_progress': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Willkommen, {profile.first_name || 'Mitarbeiter'}!
          </h1>
          <p className="text-muted-foreground">
            Übersicht über Ihre Aufgaben und Kunden
          </p>
        </div>
        <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
          <Star className="w-3 h-3 mr-1" />
          {profile.user_type === 'admin' ? 'Administrator' : 'Mitarbeiter'}
        </Badge>
      </div>

      {/* Employee Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg bg-${stat.color}-500/10`}>
                  <Icon className={`w-4 h-4 text-${stat.color}-500`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.count}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.subtitle}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {stat.description}
                </p>
                <Link href={stat.href}>
                  <Button variant="outline" size="sm" className="w-full mt-3">
                    Anzeigen
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions and Recent Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Schnellaktionen
            </CardTitle>
            <CardDescription>
              Häufig verwendete Funktionen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/workspace/requests?status=new">
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="w-4 h-4 mr-2" />
                Neue Anfragen bearbeiten
              </Button>
            </Link>
            <Link href="/workspace/customers/chat">
              <Button variant="outline" className="w-full justify-start">
                <MessageCircle className="w-4 h-4 mr-2" />
                Kunden-Chat verwalten
              </Button>
            </Link>
            <Link href="/workspace/automation">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                Workflows verwalten
              </Button>
            </Link>
            <Link href="/workspace/activity">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Aktivitätsprotokoll
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Aktuelle Anfragen
            </CardTitle>
            <CardDescription>
              Die neuesten Kontaktanfragen
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentRequests && recentRequests.length > 0 ? (
              <div className="space-y-3">
                {recentRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium truncate">{request.name}</p>
                        <Badge variant="secondary" className={getStatusColor(request.status || 'new')}>
                          {request.status === 'new' ? 'Neu' :
                           request.status === 'in_progress' ? 'In Bearbeitung' :
                           request.status === 'completed' ? 'Erledigt' : request.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {request.subject}
                      </p>
                      {request.company && (
                        <p className="text-xs text-muted-foreground">
                          {request.company}
                        </p>
                      )}
                    </div>
                    <Link href={`/workspace/requests/${request.id}`}>
                      <Button variant="ghost" size="sm">
                        Details
                      </Button>
                    </Link>
                  </div>
                ))}
                <Link href="/workspace/requests">
                  <Button variant="outline" className="w-full mt-3">
                    Alle Anfragen anzeigen
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  Keine aktuellen Anfragen
                </p>
                <Link href="/workspace/requests">
                  <Button variant="outline" className="mt-3">
                    Anfragen anzeigen
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Arbeitsübersicht</CardTitle>
          <CardDescription>
            Ihre Arbeitsleistung im Überblick
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500">{completedRequests || 0}</div>
              <p className="text-sm text-muted-foreground">Erledigte Anfragen</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500">{myTasks || 0}</div>
              <p className="text-sm text-muted-foreground">Offene Aufgaben</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-500">{totalCustomers || 0}</div>
              <p className="text-sm text-muted-foreground">Kunden betreut</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
