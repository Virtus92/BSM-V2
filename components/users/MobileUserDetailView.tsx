'use client';

import { useState, useEffect } from 'react';
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
  ArrowLeft,
  Plus,
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
  Send,
  User,
  Shield,
  UserCheck,
  Briefcase,
  Target,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { formatUserDate, getUserDisplayName, getUserRoleInfo, getUserStatusInfo } from '@/lib/user-utils';
import { EditUserModal } from './EditUserModal';

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

interface MobileUserDetailViewProps {
  user: CompleteUserData;
  tasks?: Task[];
  managedCustomers?: Customer[];
  assignedRequests?: ContactRequest[];
  activityLogs?: ActivityLog[];
}

export function MobileUserDetailView({
  user,
  tasks = [],
  managedCustomers = [],
  assignedRequests = [],
  activityLogs = []
}: MobileUserDetailViewProps) {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [availableCustomers, setAvailableCustomers] = useState<Customer[]>([]);
  const [availableRequests, setAvailableRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    due_date: ''
  });
  const [customerAssignment, setCustomerAssignment] = useState('');
  const [requestAssignment, setRequestAssignment] = useState('');

  const roleInfo = getUserRoleInfo(user.profile?.user_type);
  const statusInfo = getUserStatusInfo(user);
  const displayName = getUserDisplayName(user);

  // Load available customers and requests for assignment
  useEffect(() => {
    if (showCustomerModal) {
      fetchAvailableCustomers();
    }
    if (showRequestModal) {
      fetchAvailableRequests();
    }
  }, [showCustomerModal, showRequestModal]);

  const fetchAvailableCustomers = async () => {
    try {
      const response = await fetch('/api/customers?unassigned=true');
      if (response.ok) {
        const data = await response.json();
        setAvailableCustomers(data.customers || []);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setAvailableCustomers([]);
    }
  };

  const fetchAvailableRequests = async () => {
    try {
      // Fetch only unassigned/new requests for assignment
      const response = await fetch('/api/requests?unassigned=true&status=pending,new&limit=100');
      if (response.ok) {
        const data = await response.json();
        setAvailableRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      setAvailableRequests([]);
    }
  };

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
    setLoading(true);
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

      if (response.ok) {
        setShowTaskModal(false);
        setTaskData({ title: '', description: '', priority: 'medium', due_date: '' });
        window.location.reload();
      } else {
        const error = await response.json();
        alert('Fehler: ' + error.error);
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Fehler beim Erstellen der Aufgabe');
    } finally {
      setLoading(false);
    }
  };

  const assignCustomer = async () => {
    setLoading(true);
    try {
      if (!['employee', 'admin'].includes(user.profile?.user_type || '')) {
        alert('Nur aktive Mitarbeiter oder Admins können Kunden zugewiesen bekommen.');
        setLoading(false);
        return;
      }
      const response = await fetch(`/api/customers/${customerAssignment}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: user.id }),
      });

      if (response.ok) {
        setShowCustomerModal(false);
        setCustomerAssignment('');
        window.location.reload();
      } else {
        const error = await response.json();
        alert('Fehler: ' + error.error);
      }
    } catch (error) {
      console.error('Error assigning customer:', error);
      alert('Fehler beim Zuweisen des Kunden');
    } finally {
      setLoading(false);
    }
  };

  const assignRequest = async () => {
    setLoading(true);
    try {
      if (!['employee', 'admin'].includes(user.profile?.user_type || '')) {
        alert('Nur aktive Mitarbeiter oder Admins können Anfragen zugewiesen bekommen.');
        setLoading(false);
        return;
      }
      const response = await fetch(`/api/requests/${requestAssignment}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: user.id }),
      });

      if (response.ok) {
        setShowRequestModal(false);
        setRequestAssignment('');
        window.location.reload();
      } else {
        const error = await response.json();
        alert('Fehler: ' + error.error);
      }
    } catch (error) {
      console.error('Error assigning request:', error);
      alert('Fehler beim Zuweisen der Anfrage');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      {/* Mobile Header */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/users">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
        </Link>
      </div>

      {/* User Profile Card - Mobile Optimized */}
      <Card className="modern-card border-0">
        <CardContent className="p-4">
          <div className="flex flex-col space-y-4">
            {/* Avatar and Name */}
            <div className="flex items-center space-x-3">
              <Avatar className="w-12 h-12 border-2 border-white/10">
                <AvatarFallback className={`text-sm font-bold ${roleInfo.bg} ${roleInfo.text}`}>
                  {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-white truncate">{displayName}</h1>
                <p className="text-sm text-white/70 truncate">{user.email}</p>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
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

            {/* Quick Info */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
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

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t border-white/10">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setShowEditModal(true)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Bearbeiten
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setShowChatModal(true)}
              >
                <Send className="w-4 h-4 mr-2" />
                Nachricht
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile-Optimized Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="modern-card border-0">
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-blue-400">{stats.totalTasks}</div>
            <div className="text-xs text-white/50">Aufgaben</div>
          </CardContent>
        </Card>
        <Card className="modern-card border-0">
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-purple-400">{stats.activeCustomers}</div>
            <div className="text-xs text-white/50">Kunden</div>
          </CardContent>
        </Card>
        <Card className="modern-card border-0">
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-orange-400">{stats.pendingRequests}</div>
            <div className="text-xs text-white/50">Anfragen</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Single Column on Mobile */}
      <div className="space-y-4">

        {/* Tasks */}
        <Card className="modern-card border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              Aufgaben
              <Badge variant="secondary" className="bg-white/10 text-white text-xs">
                {Math.min(tasks.length, 5)}
              </Badge>
            </CardTitle>
            <Button size="sm" onClick={() => setShowTaskModal(true)}>
              <Plus className="w-3 h-3 mr-1" />
              Neu
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 max-h-60 overflow-y-auto">
            {tasks.slice(0, 5).map((task) => (
              <div key={task.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="space-y-2">
                  <h4 className="font-medium text-white text-sm line-clamp-1">{task.title}</h4>
                  {task.description && (
                    <p className="text-xs text-white/60 line-clamp-1">{task.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1">
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
            ))}
            {tasks.length === 0 && (
              <div className="text-center py-6 text-white/50">
                <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <div className="text-sm">Keine Aufgaben</div>
              </div>
            )}
            {tasks.length > 5 && (
              <div className="text-center pt-2">
                <Button variant="outline" size="sm">
                  Alle {tasks.length} anzeigen
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customers */}
        <Card className="modern-card border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-4 h-4" />
              Kunden
              <Badge variant="secondary" className="bg-white/10 text-white text-xs">
                {Math.min(managedCustomers.length, 5)}
              </Badge>
            </CardTitle>
            <Button size="sm" onClick={() => setShowCustomerModal(true)}>
              <Plus className="w-3 h-3 mr-1" />
              Zuweisen
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 max-h-60 overflow-y-auto">
            {managedCustomers.slice(0, 5).map((customer) => (
              <div key={customer.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="space-y-2">
                  <h4 className="font-medium text-white text-sm line-clamp-1">{customer.company_name}</h4>
                  <p className="text-xs text-white/60">{customer.contact_person}</p>
                  <div className="flex flex-wrap gap-1">
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
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Anfragen
              <Badge variant="secondary" className="bg-white/10 text-white text-xs">
                {Math.min(assignedRequests.length, 5)}
              </Badge>
            </CardTitle>
            <Button size="sm" onClick={() => setShowRequestModal(true)}>
              <Plus className="w-3 h-3 mr-1" />
              Zuweisen
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 max-h-60 overflow-y-auto">
            {assignedRequests.slice(0, 5).map((request) => (
              <div key={request.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="space-y-2">
                  <h4 className="font-medium text-white text-sm line-clamp-1">{request.subject}</h4>
                  <p className="text-xs text-white/60 line-clamp-2">{request.message}</p>
                  <div className="flex flex-wrap gap-1">
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
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Aktivität
              <Badge variant="secondary" className="bg-white/10 text-white text-xs">
                {Math.min(activityLogs.length, 5)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-60 overflow-y-auto">
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

      {/* Task Creation Modal - Mobile Optimized */}
      <Dialog open={showTaskModal} onOpenChange={setShowTaskModal}>
        <DialogContent className="bg-gray-900 border-gray-700 w-[95%] max-w-md">
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
              rows={3}
            />
            <div className="grid grid-cols-1 gap-4">
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
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setShowTaskModal(false)} className="w-full sm:w-auto">
              Abbrechen
            </Button>
            <Button onClick={createTask} disabled={!taskData.title.trim() || loading} className="w-full sm:w-auto">
              {loading ? 'Erstelle...' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Assignment Modal - Mobile Optimized */}
      <Dialog open={showCustomerModal} onOpenChange={setShowCustomerModal}>
        <DialogContent className="bg-gray-900 border-gray-700 w-[95%] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Kunde zuweisen</DialogTitle>
            <DialogDescription className="text-white/70">
              Weisen Sie einen Kunden zu {displayName} zu.
            </DialogDescription>
          </DialogHeader>
          <div>
            <select
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
              value={customerAssignment}
              onChange={(e) => setCustomerAssignment(e.target.value)}
            >
              <option value="">Kunde auswählen...</option>
              {availableCustomers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.company_name} - {customer.contact_person}
                </option>
              ))}
            </select>
            {availableCustomers.length === 0 && (
              <p className="text-xs text-white/50 mt-2">Keine unzugewiesenen Kunden verfügbar.</p>
            )}
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setShowCustomerModal(false)} className="w-full sm:w-auto">
              Abbrechen
            </Button>
            <Button onClick={assignCustomer} disabled={!customerAssignment || loading} className="w-full sm:w-auto">
              {loading ? 'Zuweisen...' : 'Zuweisen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Assignment Modal - Mobile Optimized */}
      <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
        <DialogContent className="bg-gray-900 border-gray-700 w-[95%] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Anfrage zuweisen</DialogTitle>
            <DialogDescription className="text-white/70">
              Weisen Sie eine Anfrage zu {displayName} zu.
            </DialogDescription>
          </DialogHeader>
          <div>
            <select
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
              value={requestAssignment}
              onChange={(e) => setRequestAssignment(e.target.value)}
            >
              <option value="">Anfrage auswählen...</option>
              {availableRequests.map(request => (
                <option key={request.id} value={request.id}>
                  {request.subject} - {request.priority === 'urgent' ? '🔴' : request.priority === 'high' ? '🟡' : '🟢'}
                </option>
              ))}
            </select>
            {availableRequests.length === 0 && (
              <p className="text-xs text-white/50 mt-2">Keine unzugewiesenen Anfragen verfügbar.</p>
            )}
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setShowRequestModal(false)} className="w-full sm:w-auto">
              Abbrechen
            </Button>
            <Button onClick={assignRequest} disabled={!requestAssignment || loading} className="w-full sm:w-auto">
              {loading ? 'Zuweisen...' : 'Zuweisen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <EditUserModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        user={user}
        onUserUpdated={(updatedUser) => {
          // Reload the page to show updated data
          window.location.reload();
        }}
      />

      {/* Chat Modal - Simple placeholder for now */}
      <Dialog open={showChatModal} onOpenChange={setShowChatModal}>
        <DialogContent className="bg-gray-900 border-gray-700 w-[95%] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Nachricht an {displayName}</DialogTitle>
            <DialogDescription className="text-white/70">
              Chat-Funktionalität wird bald verfügbar sein.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 text-center text-white/60">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Chat-System in Entwicklung</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowChatModal(false)} className="w-full">
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
