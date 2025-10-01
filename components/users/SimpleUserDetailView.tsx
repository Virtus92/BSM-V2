'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  Plus,
  MoreVertical,
  Mail,
  Phone,
  Building,
  Calendar,
  Clock,
  Users,
  CheckSquare,
  MessageSquare,
  Activity,
  Edit,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  User,
  Shield,
  UserCheck,
  Briefcase,
  Target,
  Send
} from 'lucide-react';
import Link from 'next/link';
import { formatUserDate, getUserDisplayName, getUserRoleInfo, getUserStatusInfo } from '@/lib/user-utils';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  customers?: { company_name: string };
  contact_requests?: { subject: string };
}

interface Customer {
  id: string;
  company_name: string;
  contact_person: string;
  email?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'pending';
}

interface ContactRequest {
  id: string;
  subject: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
}

interface ActivityLog {
  id: string;
  action: string;
  created_at: string;
  entity_type?: string;
}

interface CompleteUserData {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  profile?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    user_type: string;
    is_active?: boolean;
  };
  customer?: {
    company_name: string;
    contact_person: string;
    phone?: string;
    industry?: string;
  };
  employee?: {
    employee_id?: string;
    job_title?: string;
    department?: { name: string };
    hire_date?: string;
    working_hours_per_week?: number;
  };
}

interface SimpleUserDetailViewProps {
  user: CompleteUserData;
  tasks?: Task[];
  managedCustomers?: Customer[];
  assignedRequests?: ContactRequest[];
  activityLogs?: ActivityLog[];
}

export function SimpleUserDetailView({
  user,
  tasks = [],
  managedCustomers = [],
  assignedRequests = [],
  activityLogs = []
}: SimpleUserDetailViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    due_date: ''
  });
  const [customerAssignment, setCustomerAssignment] = useState({
    customerId: '',
    employeeId: user.id
  });
  const [requestAssignment, setRequestAssignment] = useState({
    requestId: '',
    employeeId: user.id
  });

  const roleInfo = getUserRoleInfo(user.profile?.user_type || user.user_type);
  const statusInfo = getUserStatusInfo(user);
  const displayName = getUserDisplayName(user);

  // Calculate quick stats
  const stats = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    activeTasks: tasks.filter(t => t.status === 'in_progress' || t.status === 'todo').length,
    urgentTasks: tasks.filter(t => t.priority === 'urgent').length,
    activeCustomers: managedCustomers.filter(c => c.status === 'active').length,
    pendingRequests: assignedRequests.filter(r => r.status === 'pending').length
  };

  const createTask = async () => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          dueDate: taskData.due_date,
          assignedTo: user.id
        }),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Erstellen der Aufgabe');
      }

      toast({
        title: 'Erfolg',
        description: 'Aufgabe wurde erfolgreich erstellt'
      });
      setShowTaskModal(false);
      setTaskData({ title: '', description: '', priority: 'medium', due_date: '' });
      router.refresh();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Fehler beim Erstellen'
      });
    }
  };

  const assignCustomer = async () => {
    try {
      if (!['employee', 'admin'].includes(user.profile?.user_type || '')) {
        toast({
          variant: 'destructive',
          title: 'Fehler',
          description: 'Nur aktive Mitarbeiter oder Admins können Kunden zugewiesen bekommen'
        });
        return;
      }
      const response = await fetch(`/api/customers/${customerAssignment.customerId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: user.id }),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Zuweisen');
      }

      toast({
        title: 'Erfolg',
        description: 'Kunde wurde erfolgreich zugewiesen'
      });
      setShowCustomerModal(false);
      router.refresh();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Fehler beim Zuweisen'
      });
    }
  };

  const assignRequest = async () => {
    try {
      if (!['employee', 'admin'].includes(user.profile?.user_type || '')) {
        toast({
          variant: 'destructive',
          title: 'Fehler',
          description: 'Nur aktive Mitarbeiter oder Admins können Anfragen zugewiesen bekommen'
        });
        return;
      }
      const response = await fetch(`/api/requests/${requestAssignment.requestId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: user.id }),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Zuweisen');
      }

      toast({
        title: 'Erfolg',
        description: 'Anfrage wurde erfolgreich zugewiesen'
      });
      setShowRequestModal(false);
      router.refresh();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Fehler beim Zuweisen'
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/users">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
        </Link>
      </div>

      {/* User Profile Card */}
      <Card className="modern-card border-0">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16 border-4 border-white/10">
                <AvatarFallback className={`text-lg font-bold ${roleInfo.bg} ${roleInfo.text}`}>
                  {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-white">{displayName}</h1>
                <p className="text-white/70">{user.email}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant={roleInfo.variant} className="flex items-center space-x-1">
                    <roleInfo.icon className="w-3 h-3" />
                    <span>{roleInfo.label}</span>
                  </Badge>
                  <Badge variant="outline" className={statusInfo.color}>
                    <statusInfo.icon className="w-3 h-3 mr-1" />
                    {statusInfo.label}
                  </Badge>
                  {user.employee?.job_title && (
                    <Badge variant="outline" className="text-white/70 border-white/20">
                      {user.employee.job_title}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Bearbeiten
              </Button>
              <Button variant="outline" size="sm">
                <Send className="w-4 h-4 mr-2" />
                Nachricht
              </Button>
            </div>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
            <div className="text-center">
              <div className="text-xs text-white/50">Registriert</div>
              <div className="text-sm text-white">{formatUserDate(user.created_at)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-white/50">Letzter Login</div>
              <div className="text-sm text-white">
                {user.last_sign_in_at ? formatUserDate(user.last_sign_in_at) : 'Nie'}
              </div>
            </div>
            {user.profile?.phone && (
              <div className="text-center">
                <div className="text-xs text-white/50">Telefon</div>
                <div className="text-sm text-white">{user.profile.phone}</div>
              </div>
            )}
            {user.employee?.department?.name && (
              <div className="text-center">
                <div className="text-xs text-white/50">Abteilung</div>
                <div className="text-sm text-white">{user.employee.department.name}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="modern-card border-0">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.totalTasks}</div>
            <div className="text-xs text-white/50">Aufgaben</div>
          </CardContent>
        </Card>
        <Card className="modern-card border-0">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{stats.completedTasks}</div>
            <div className="text-xs text-white/50">Erledigt</div>
          </CardContent>
        </Card>
        <Card className="modern-card border-0">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{stats.activeTasks}</div>
            <div className="text-xs text-white/50">Aktiv</div>
          </CardContent>
        </Card>
        <Card className="modern-card border-0">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{stats.urgentTasks}</div>
            <div className="text-xs text-white/50">Dringend</div>
          </CardContent>
        </Card>
        <Card className="modern-card border-0">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">{stats.activeCustomers}</div>
            <div className="text-xs text-white/50">Kunden</div>
          </CardContent>
        </Card>
        <Card className="modern-card border-0">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-400">{stats.pendingRequests}</div>
            <div className="text-xs text-white/50">Anfragen</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks */}
        <Card className="modern-card border-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5" />
              Aufgaben
              <Badge variant="secondary" className="bg-white/10 text-white">
                {Math.min(tasks.length, 5)}
              </Badge>
            </CardTitle>
            <Button size="sm" onClick={() => setShowTaskModal(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Neu
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 max-h-80 overflow-y-auto">
            {tasks.slice(0, 5).map((task) => (
              <div key={task.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white text-sm line-clamp-1">{task.title}</h4>
                    {task.description && (
                      <p className="text-xs text-white/60 line-clamp-1 mt-1">{task.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={task.priority === 'urgent' ? 'destructive' : 'outline'} className="text-xs">
                        {task.priority === 'urgent' ? 'Dringend' :
                         task.priority === 'high' ? 'Hoch' :
                         task.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                      </Badge>
                      <Badge variant={task.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                        {task.status === 'completed' ? 'Erledigt' :
                         task.status === 'in_progress' ? 'Läuft' : 'Offen'}
                      </Badge>
                      {task.due_date && (
                        <span className="text-xs text-white/50 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatUserDate(task.due_date)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <div className="text-center py-6 text-white/50">
                <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <div className="text-sm">Keine Aufgaben</div>
              </div>
            )}
            {tasks.length > 5 && (
              <div className="text-center pt-2">
                <Link href={`/workspace/tasks?user=${user.id}`}>
                  <Button variant="outline" size="sm">
                    Alle {tasks.length} anzeigen
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customers */}
        <Card className="modern-card border-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Kunden
              <Badge variant="secondary" className="bg-white/10 text-white">
                {Math.min(managedCustomers.length, 5)}
              </Badge>
            </CardTitle>
            <Button size="sm" onClick={() => setShowCustomerModal(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Zuweisen
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 max-h-80 overflow-y-auto">
            {managedCustomers.slice(0, 5).map((customer) => (
              <div key={customer.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white text-sm line-clamp-1">{customer.company_name}</h4>
                    <p className="text-xs text-white/60">{customer.contact_person}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={customer.status === 'active' ? 'default' : 'outline'} className="text-xs">
                        {customer.status === 'active' ? 'Aktiv' :
                         customer.status === 'inactive' ? 'Inaktiv' : 'Ausstehend'}
                      </Badge>
                      {customer.email && (
                        <span className="text-xs text-white/50 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                        </span>
                      )}
                      {customer.phone && (
                        <span className="text-xs text-white/50 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {managedCustomers.length === 0 && (
              <div className="text-center py-6 text-white/50">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <div className="text-sm">Keine Kunden</div>
              </div>
            )}
            {managedCustomers.length > 5 && (
              <div className="text-center pt-2">
                <Button variant="outline" size="sm">
                  Alle {managedCustomers.length} anzeigen
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Requests */}
        <Card className="modern-card border-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Anfragen
              <Badge variant="secondary" className="bg-white/10 text-white">
                {Math.min(assignedRequests.length, 5)}
              </Badge>
            </CardTitle>
            <Button size="sm" onClick={() => setShowRequestModal(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Zuweisen
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 max-h-80 overflow-y-auto">
            {assignedRequests.slice(0, 5).map((request) => (
              <div key={request.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white text-sm line-clamp-1">{request.subject}</h4>
                    <p className="text-xs text-white/60 line-clamp-2 mt-1">{request.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={request.priority === 'urgent' ? 'destructive' : 'outline'} className="text-xs">
                        {request.priority === 'urgent' ? 'Dringend' :
                         request.priority === 'high' ? 'Hoch' :
                         request.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                      </Badge>
                      <Badge variant={request.status === 'resolved' ? 'default' : 'secondary'} className="text-xs">
                        {request.status === 'resolved' ? 'Gelöst' :
                         request.status === 'in_progress' ? 'Läuft' : 'Offen'}
                      </Badge>
                      <span className="text-xs text-white/50 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatUserDate(request.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {assignedRequests.length === 0 && (
              <div className="text-center py-6 text-white/50">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <div className="text-sm">Keine Anfragen</div>
              </div>
            )}
            {assignedRequests.length > 5 && (
              <div className="text-center pt-2">
                <Button variant="outline" size="sm">
                  Alle {assignedRequests.length} anzeigen
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity */}
        <Card className="modern-card border-0">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Aktivität
              <Badge variant="secondary" className="bg-white/10 text-white">
                {Math.min(activityLogs.length, 5)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-80 overflow-y-auto">
            {activityLogs.slice(0, 5).map((log, index) => (
              <div key={index} className="p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white line-clamp-1">{log.action}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {log.entity_type && (
                        <Badge variant="outline" className="text-xs">
                          {log.entity_type}
                        </Badge>
                      )}
                      <span className="text-xs text-white/50 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatUserDate(log.created_at, true)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {activityLogs.length === 0 && (
              <div className="text-center py-6 text-white/50">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <div className="text-sm">Keine Aktivität</div>
              </div>
            )}
            {activityLogs.length > 5 && (
              <div className="text-center pt-2">
                <Button variant="outline" size="sm">
                  Alle {activityLogs.length} anzeigen
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Task Creation Modal */}
      <Dialog open={showTaskModal} onOpenChange={setShowTaskModal}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Neue Aufgabe für {displayName}</DialogTitle>
            <DialogDescription className="text-white/70">
              Erstellen Sie eine neue Aufgabe für diesen Benutzer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Aufgabentitel..."
              value={taskData.title}
              onChange={(e) => setTaskData({...taskData, title: e.target.value})}
              className="bg-gray-800 border-gray-600 text-white"
            />
            <Textarea
              placeholder="Beschreibung..."
              value={taskData.description}
              onChange={(e) => setTaskData({...taskData, description: e.target.value})}
              className="bg-gray-800 border-gray-600 text-white"
            />
            <div className="grid grid-cols-2 gap-4">
              <select
                className="p-2 bg-gray-800 border border-gray-600 rounded text-white"
                value={taskData.priority}
                onChange={(e) => setTaskData({...taskData, priority: e.target.value as Task['priority']})}
              >
                <option value="low">Niedrig</option>
                <option value="medium">Mittel</option>
                <option value="high">Hoch</option>
                <option value="urgent">Dringend</option>
              </select>
              <Input
                type="datetime-local"
                value={taskData.due_date}
                onChange={(e) => setTaskData({...taskData, due_date: e.target.value})}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTaskModal(false)}>
              Abbrechen
            </Button>
            <Button onClick={createTask} disabled={!taskData.title.trim()}>
              Erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Assignment Modal */}
      <Dialog open={showCustomerModal} onOpenChange={setShowCustomerModal}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Kunde zuweisen</DialogTitle>
            <DialogDescription className="text-white/70">
              Weisen Sie einen Kunden zu {displayName} zu.
            </DialogDescription>
          </DialogHeader>
          <div>
            <select
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
              value={customerAssignment.customerId}
              onChange={(e) => setCustomerAssignment({...customerAssignment, customerId: e.target.value})}
            >
              <option value="">Kunde auswählen...</option>
              {/* TODO: Add available customers */}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomerModal(false)}>
              Abbrechen
            </Button>
            <Button onClick={assignCustomer} disabled={!customerAssignment.customerId}>
              Zuweisen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Assignment Modal */}
      <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Anfrage zuweisen</DialogTitle>
            <DialogDescription className="text-white/70">
              Weisen Sie eine Anfrage zu {displayName} zu.
            </DialogDescription>
          </DialogHeader>
          <div>
            <select
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
              value={requestAssignment.requestId}
              onChange={(e) => setRequestAssignment({...requestAssignment, requestId: e.target.value})}
            >
              <option value="">Anfrage auswählen...</option>
              {/* TODO: Add available requests */}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestModal(false)}>
              Abbrechen
            </Button>
            <Button onClick={assignRequest} disabled={!requestAssignment.requestId}>
              Zuweisen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
