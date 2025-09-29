'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  MapPin,
  Plus,
  Filter,
  Search,
  ExternalLink,
  Settings,
  Shield,
  Zap,
  Bell,
  Eye,
  ChevronRight,
  ChevronDown,
  X
} from 'lucide-react';
import Link from 'next/link';
import { CompleteUserData, formatUserDate, getUserDisplayName, getUserRoleInfo } from '@/lib/user-utils';
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal';
import { RequestDetailModal } from '@/components/requests/RequestDetailModal';
import { CustomerDetailModal } from '@/components/crm/CustomerDetailModal';

// Enhanced interfaces for modern implementation
interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  created_by: string;
  customer_id?: string;
  contact_request_id?: string;
  due_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  created_at: string;
  updated_at: string;
  customers?: {
    id: string;
    company_name: string;
    contact_person: string;
  };
  contact_requests?: {
    id: string;
    subject: string;
    status: string;
  };
}

interface Customer {
  id: string;
  user_id?: string;
  company_name: string;
  contact_person: string;
  email?: string;
  phone?: string;
  industry?: string;
  assigned_employee_id?: string;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
}

interface ContactRequest {
  id: string;
  customer_user_id?: string;
  subject: string;
  message: string;
  status: 'new' | 'in_progress' | 'responded' | 'converted' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  created_at: string;
  request_assignments?: {
    id: string;
    assigned_at: string;
    priority: string;
    estimated_hours?: number;
    notes?: string;
  }[];
}

interface ChatMessage {
  id: string;
  customer_id: string;
  sender_type: 'customer' | 'employee' | 'system';
  message: string;
  created_at: string;
  customers?: {
    company_name: string;
    contact_person: string;
    assigned_employee_id?: string;
  };
}

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: any;
  created_at: string;
}

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
  manager_id?: string;
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
      email?: string;
    }[];
  };
}

interface ModernUserDetailViewProps {
  user: CompleteUserData;
  employeeProfile?: EmployeeProfile | null;
  tasks?: Task[];
  managedCustomers?: Customer[];
  assignedRequests?: ContactRequest[];
  recentChats?: ChatMessage[];
  activityLogs?: ActivityLog[];
  onTaskCreate?: (task: Partial<Task>) => Promise<void>;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onCustomerAssign?: (customerId: string, employeeId: string) => Promise<void>;
  onRequestAssign?: (requestId: string, employeeId: string) => Promise<void>;
}

// Quick Action Components
const QuickActionCard = ({
  icon: Icon,
  title,
  description,
  count,
  color = "blue",
  onClick,
  href
}: {
  icon: any;
  title: string;
  description: string;
  count?: number;
  color?: string;
  onClick?: () => void;
  href?: string;
}) => {
  const Content = (
    <Card className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-l-4 border-l-${color}-500`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg bg-${color}-100 text-${color}-600`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{title}</h3>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {count !== undefined && (
              <Badge variant="secondary" className="text-xs">
                {count}
              </Badge>
            )}
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{Content}</Link>;
  }

  return <div onClick={onClick}>{Content}</div>;
};

// Mobile Navigation Component
const MobileNavigation = ({
  sections,
  activeSection,
  onSectionChange
}: {
  sections: { id: string; label: string; count?: number }[];
  activeSection: string;
  onSectionChange: (section: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentSection = sections.find(s => s.id === activeSection);

  return (
    <div className="md:hidden mb-6">
      <Button
        variant="outline"
        className="w-full justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center space-x-2">
          <span>{currentSection?.label}</span>
          {currentSection?.count !== undefined && (
            <Badge variant="secondary" className="text-xs">
              {currentSection.count}
            </Badge>
          )}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <Card className="mt-2 border shadow-lg">
          <CardContent className="p-2">
            {sections.map((section) => (
              <Button
                key={section.id}
                variant={activeSection === section.id ? "default" : "ghost"}
                className="w-full justify-between mb-1 last:mb-0"
                onClick={() => {
                  onSectionChange(section.id);
                  setIsOpen(false);
                }}
              >
                <span>{section.label}</span>
                {section.count !== undefined && (
                  <Badge variant="secondary" className="text-xs">
                    {section.count}
                  </Badge>
                )}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Task Creation Modal
const TaskCreateModal = ({
  onTaskCreate,
  customers,
  requests
}: {
  onTaskCreate?: (task: Partial<Task>) => Promise<void>;
  customers: Customer[];
  requests: ContactRequest[];
}) => {
  const [open, setOpen] = useState(false);
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    customer_id: '',
    contact_request_id: '',
    due_date: '',
    estimated_hours: 0
  });

  const handleSubmit = async () => {
    if (!taskData.title.trim()) return;

    await onTaskCreate?.({
      ...taskData,
      estimated_hours: taskData.estimated_hours || undefined
    });

    setTaskData({
      title: '',
      description: '',
      priority: 'medium',
      customer_id: '',
      contact_request_id: '',
      due_date: '',
      estimated_hours: 0
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Neue Aufgabe</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Neue Aufgabe erstellen</DialogTitle>
          <DialogDescription>
            Erstellen Sie eine neue Aufgabe mit allen relevanten Details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Titel *</label>
            <Input
              value={taskData.title}
              onChange={(e) => setTaskData({...taskData, title: e.target.value})}
              placeholder="Aufgabentitel..."
            />
          </div>

          <div>
            <label className="text-sm font-medium">Beschreibung</label>
            <Input
              value={taskData.description}
              onChange={(e) => setTaskData({...taskData, description: e.target.value})}
              placeholder="Aufgabenbeschreibung..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Priorität</label>
              <select
                className="w-full p-2 border rounded-md"
                value={taskData.priority}
                onChange={(e) => setTaskData({...taskData, priority: e.target.value as Task['priority']})}
              >
                <option value="low">Niedrig</option>
                <option value="medium">Mittel</option>
                <option value="high">Hoch</option>
                <option value="urgent">Dringend</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Geschätzte Stunden</label>
              <Input
                type="number"
                value={taskData.estimated_hours}
                onChange={(e) => setTaskData({...taskData, estimated_hours: parseInt(e.target.value) || 0})}
                min="0"
                step="0.5"
              />
            </div>
          </div>

          {customers.length > 0 && (
            <div>
              <label className="text-sm font-medium">Kunde (optional)</label>
              <select
                className="w-full p-2 border rounded-md"
                value={taskData.customer_id}
                onChange={(e) => setTaskData({...taskData, customer_id: e.target.value})}
              >
                <option value="">Kunde auswählen...</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.company_name} - {customer.contact_person}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Fälligkeitsdatum</label>
            <Input
              type="datetime-local"
              value={taskData.due_date}
              onChange={(e) => setTaskData({...taskData, due_date: e.target.value})}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={!taskData.title.trim()}>
            Aufgabe erstellen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export function ModernUserDetailView({
  user,
  employeeProfile,
  tasks = [],
  managedCustomers = [],
  assignedRequests = [],
  recentChats = [],
  activityLogs = [],
  onTaskCreate,
  onTaskUpdate,
  onCustomerAssign,
  onRequestAssign
}: ModernUserDetailViewProps) {
  const [showAssignCustomer, setShowAssignCustomer] = useState(false);
  const [showAssignRequest, setShowAssignRequest] = useState(false);
  const [availableCustomers, setAvailableCustomers] = useState<Customer[]>([]);
  const [availableRequests, setAvailableRequests] = useState<ContactRequest[]>([]);
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedRequest, setSelectedRequest] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(user.id);
  const [loadingAssign, setLoadingAssign] = useState(false);

  const loadEmployees = async () => {
    try {
      const [empRes, adminRes] = await Promise.all([
        fetch('/api/users?role=employee&limit=100'),
        fetch('/api/users?role=admin&limit=100'),
      ]);
      const users: any[] = [];
      if (empRes.ok) {
        const d = await empRes.json();
        const list = d.users || d.data?.users || (Array.isArray(d.data) ? d.data : []);
        users.push(...(list || []));
      }
      if (adminRes.ok) {
        const d = await adminRes.json();
        const list = d.users || d.data?.users || (Array.isArray(d.data) ? d.data : []);
        users.push(...(list || []));
      }
      setEmployees(users.map((u: any) => {
        const first = u.profile?.first_name ?? u.first_name;
        const last = u.profile?.last_name ?? u.last_name;
        const name = [first, last].filter(Boolean).join(' ') || 'Unbekannt';
        return { id: u.id, name };
      }));
    } catch {
      setEmployees([]);
    }
  };

  const loadAssignableCustomers = async () => {
    try {
      const res = await fetch('/api/customers?status=active&limit=200');
      if (!res.ok) return setAvailableCustomers([]);
      const data = await res.json();
      const list = (data.customers || []) as Customer[];
      const unassigned = list.filter(c => !(c as any).assigned_employee_id);
      setAvailableCustomers(unassigned.length > 0 ? unassigned : list);
    } catch {
      setAvailableCustomers([]);
    }
  };

  const loadAssignableRequests = async () => {
    try {
      const res = await fetch('/api/requests?unassigned=true&status=pending,new&limit=200');
      if (!res.ok) return setAvailableRequests([]);
      const data = await res.json();
      setAvailableRequests(data.requests || []);
    } catch {
      setAvailableRequests([]);
    }
  };

  const openAssignCustomer = async () => {
    setShowAssignCustomer(true);
    setSelectedCustomer('');
    setSelectedEmployee(user.id);
    await Promise.all([loadEmployees(), loadAssignableCustomers()]);
  };

  const openAssignRequest = async () => {
    setShowAssignRequest(true);
    setSelectedRequest('');
    setSelectedEmployee(user.id);
    await Promise.all([loadEmployees(), loadAssignableRequests()]);
  };

  const submitAssignCustomer = async () => {
    if (!onCustomerAssign || !selectedCustomer || !selectedEmployee) return;
    setLoadingAssign(true);
    await onCustomerAssign(selectedCustomer, selectedEmployee);
    setLoadingAssign(false);
    setShowAssignCustomer(false);
  };

  const submitAssignRequest = async () => {
    if (!onRequestAssign || !selectedRequest || !selectedEmployee) return;
    setLoadingAssign(true);
    await onRequestAssign(selectedRequest, selectedEmployee);
    setLoadingAssign(false);
    setShowAssignRequest(false);
  };
  const [activeSection, setActiveSection] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const roleInfo = getUserRoleInfo(user.profile?.user_type);
  const displayName = getUserDisplayName(user);

  // Debug: Log user data to identify username loading issue
  console.log('🔍 User Debug Info:', {
    userId: user.id,
    email: user.email,
    profile: user.profile,
    displayName,
    profileFirstName: user.profile?.first_name,
    profileLastName: user.profile?.last_name,
    customerContactPerson: user.customer?.contact_person
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const pendingTasks = tasks.filter(t => t.status === 'todo').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const urgentTasks = tasks.filter(t => t.priority === 'urgent').length;

    const activeCustomers = managedCustomers.filter(c => c.status === 'active').length;
    const pendingRequests = assignedRequests.filter(r => r.status === 'new').length;
    const inProgressRequests = assignedRequests.filter(r => r.status === 'in_progress').length;

    return {
      tasks: {
        total: tasks.length,
        completed: completedTasks,
        pending: pendingTasks,
        inProgress: inProgressTasks,
        urgent: urgentTasks,
        completionRate: tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0
      },
      customers: {
        total: managedCustomers.length,
        active: activeCustomers
      },
      requests: {
        total: assignedRequests.length,
        pending: pendingRequests,
        inProgress: inProgressRequests
      },
      chats: {
        total: recentChats.length,
        recent: recentChats.filter(c => {
          const messageDate = new Date(c.created_at);
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return messageDate > dayAgo;
        }).length
      }
    };
  }, [tasks, managedCustomers, assignedRequests, recentChats]);

  // Modals: Task, Request, Customer
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [employeesForTasks, setEmployeesForTasks] = useState<{ id: string; name: string; email: string }[]>([]);

  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const openTaskModal = async (task: Task) => {
    setSelectedTask(task);
    try {
      const [empRes, adminRes] = await Promise.all([
        fetch('/api/users?role=employee&limit=100'),
        fetch('/api/users?role=admin&limit=100')
      ]);
      let allUsers: any[] = [];
      if (empRes.ok) { const d = await empRes.json(); const list = d.users || d.data?.users || (Array.isArray(d.data) ? d.data : []); allUsers = allUsers.concat(list || []); }
      if (adminRes.ok) { const d = await adminRes.json(); const list = d.users || d.data?.users || (Array.isArray(d.data) ? d.data : []); allUsers = allUsers.concat(list || []); }
      setEmployeesForTasks(allUsers.map(u => ({
        id: u.id,
        name: [u.profile?.first_name, u.profile?.last_name].filter(Boolean).join(' ') || u.email || 'Unbekannt',
        email: u.email || ''
      })));
    } catch { setEmployeesForTasks([]); }
    setTaskModalOpen(true);
  };

  const openRequestModal = (req: any) => { setSelectedRequestId(req?.id || null); setRequestModalOpen(true); };
  const openCustomerModal = (customer: any) => { setSelectedCustomerId(customer?.id || null); setCustomerModalOpen(true); };

  const handleTaskChanged = (updated: any) => {
    // No-op local update; source of truth via reload
  };
  const handleTaskUpdated = () => { window.location.reload(); };

  // Conversion is handled inside RequestDetailModal

  // Navigation sections
  const sections = [
    { id: 'overview', label: 'Übersicht' },
    { id: 'tasks', label: 'Aufgaben', count: stats.tasks.total },
    { id: 'customers', label: 'Kunden', count: stats.customers.total },
    { id: 'requests', label: 'Anfragen', count: stats.requests.total },
    { id: 'chats', label: 'Chats', count: stats.chats.total },
    { id: 'activity', label: 'Aktivität', count: activityLogs.length }
  ];

  // Quick Actions based on role and data
  const quickActions = useMemo(() => {
    const actions = [];

    if (user.profile?.user_type === 'employee') {
      actions.push(
        {
          icon: Plus,
          title: 'Neue Aufgabe',
          description: 'Aufgabe erstellen',
          color: 'green',
          onClick: () => setActiveSection('task-create')
        },
        {
          icon: Users,
          title: 'Kunden verwalten',
          description: `${stats.customers.active} aktive`,
          count: stats.customers.active,
          color: 'blue',
          onClick: () => setActiveSection('customers')
        },
        {
          icon: AlertCircle,
          title: 'Dringende Aufgaben',
          description: 'Benötigen Aufmerksamkeit',
          count: stats.tasks.urgent,
          color: 'red',
          onClick: () => setActiveSection('tasks')
        }
      );

      if (stats.requests.pending > 0) {
        actions.push({
          icon: Bell,
          title: 'Neue Anfragen',
          description: 'Warten auf Bearbeitung',
          count: stats.requests.pending,
          color: 'orange',
          onClick: () => setActiveSection('requests')
        });
      }
    }

    return actions;
  }, [user.profile?.user_type, stats]);

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/users">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zu Benutzern
          </Button>
        </Link>
      </div>

      {/* User Header Card */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-10" />
        <CardContent className="relative p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16 border-4 border-white shadow-lg">
                <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div>
                <h1 className="text-2xl font-bold text-foreground dark:text-white">{displayName}</h1>
                <p className="text-muted-foreground">{user.email}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant={roleInfo.variant} className="flex items-center space-x-1">
                    <roleInfo.icon className="w-3 h-3" />
                    <span>{roleInfo.label}</span>
                  </Badge>
                  {employeeProfile?.job_title && (
                    <Badge variant="outline">{employeeProfile.job_title}</Badge>
                  )}
                  {employeeProfile?.departments?.name && (
                    <Badge variant="outline">{employeeProfile.departments.name}</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Edit className="w-4 h-4 mr-2" />
                    Benutzer bearbeiten
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Send className="w-4 h-4 mr-2" />
                    Nachricht senden
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Activity className="w-4 h-4 mr-2" />
                    Aktivitätslog anzeigen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Schnellzugriff</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <QuickActionCard key={index} {...action} />
            ))}
          </div>
        </div>
      )}

      {/* Mobile Navigation */}
      <MobileNavigation
        sections={sections}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      {/* Desktop Navigation */}
      <div className="hidden md:block">
        <div className="flex space-x-1 border-b">
          {sections.map((section) => (
            <Button
              key={section.id}
              variant={activeSection === section.id ? "default" : "ghost"}
              className="relative"
              onClick={() => setActiveSection(section.id)}
            >
              {section.label}
              {section.count !== undefined && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {section.count}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Content Sections */}
      <div className="min-h-[400px]">
        {/* Overview Section */}
        {activeSection === 'overview' && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Aufgaben gesamt</p>
                      <p className="text-2xl font-bold">{stats.tasks.total}</p>
                    </div>
                    <CheckSquare className="w-8 h-8 text-blue-500" />
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Abgeschlossen</span>
                      <span>{stats.tasks.completionRate}%</span>
                    </div>
                    <Progress value={stats.tasks.completionRate} className="mt-1" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Verwaltete Kunden</p>
                      <p className="text-2xl font-bold">{stats.customers.active}</p>
                    </div>
                    <Users className="w-8 h-8 text-green-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    von {stats.customers.total} gesamt
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Offene Anfragen</p>
                      <p className="text-2xl font-bold">{stats.requests.pending + stats.requests.inProgress}</p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-orange-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {stats.requests.pending} neu, {stats.requests.inProgress} in Bearbeitung
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Chat-Nachrichten</p>
                      <p className="text-2xl font-bold">{stats.chats.recent}</p>
                    </div>
                    <MessageSquare className="w-8 h-8 text-purple-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    in den letzten 24h
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity & Profile Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>Kürzliche Aktivität</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activityLogs.slice(0, 5).map((log, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{log.action}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatUserDate(log.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {activityLogs.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Keine Aktivitäten verfügbar
                      </p>
                    )}
                  </div>
                  {activityLogs.length > 5 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-4"
                      onClick={() => setActiveSection('activity')}
                    >
                      Alle Aktivitäten anzeigen
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Profil-Informationen</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {employeeProfile && (
                      <>
                        {employeeProfile.employee_id && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Mitarbeiter-ID:</span>
                            <span className="text-sm font-medium">{employeeProfile.employee_id}</span>
                          </div>
                        )}
                        {employeeProfile.hire_date && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Einstellungsdatum:</span>
                            <span className="text-sm font-medium">{formatUserDate(employeeProfile.hire_date)}</span>
                          </div>
                        )}
                        {employeeProfile.working_hours_per_week && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Wochenstunden:</span>
                            <span className="text-sm font-medium">{employeeProfile.working_hours_per_week}h</span>
                          </div>
                        )}
                        {employeeProfile.direct_phone && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Direktwahl:</span>
                            <span className="text-sm font-medium">{employeeProfile.direct_phone}</span>
                          </div>
                        )}
                      </>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Letzter Login:</span>
                      <span className="text-sm font-medium">
                        {user.last_sign_in_at ? formatUserDate(user.last_sign_in_at) : 'Nie'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Registriert:</span>
                      <span className="text-sm font-medium">{formatUserDate(user.created_at)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Tasks Section */}
        {activeSection === 'tasks' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Aufgaben</h2>
                <p className="text-sm text-muted-foreground">
                  Verwalten Sie alle zugewiesenen und erstellten Aufgaben
                </p>
              </div>
              {onTaskCreate && (
                <TaskCreateModal
                  onTaskCreate={onTaskCreate}
                  customers={managedCustomers}
                  requests={assignedRequests}
                />
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Aufgaben durchsuchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                className="px-3 py-2 border rounded-md bg-gray-900 text-white border-white/10"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Alle Status</option>
                <option value="todo">Offen</option>
                <option value="in_progress">In Bearbeitung</option>
                <option value="review">Review</option>
                <option value="blocked">Blockiert</option>
                <option value="done">Abgeschlossen</option>
              </select>
            </div>

            <div className="space-y-3">
              {tasks
                .filter(task =>
                  (filterStatus === 'all' || task.status === filterStatus) &&
                  (searchTerm === '' ||
                   task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   task.description?.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                )
                .map((task) => (
                  <Card key={task.id} className="transition-all duration-200 hover:shadow-md cursor-pointer" onClick={() => openTaskModal(task)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-medium truncate">{task.title}</h3>
                            <Badge
                              variant={
                                task.priority === 'urgent' ? 'destructive' :
                                task.priority === 'high' ? 'default' :
                                task.priority === 'medium' ? 'secondary' : 'outline'
                              }
                              className="text-xs"
                            >
                              {task.priority === 'urgent' ? 'Dringend' :
                               task.priority === 'high' ? 'Hoch' :
                               task.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                            </Badge>
                            <Badge
                              variant={
                                task.status === 'done' ? 'default' :
                                task.status === 'in_progress' ? 'secondary' : 'outline'
                              }
                              className="text-xs"
                            >
                              {task.status === 'todo' ? 'Ausstehend' :
                               task.status === 'in_progress' ? 'In Bearbeitung' :
                               task.status === 'review' ? 'Review' :
                               task.status === 'blocked' ? 'Blockiert' :
                               task.status === 'done' ? 'Abgeschlossen' : 'Abgebrochen'}
                            </Badge>
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            {task.customers && (
                              <span className="flex items-center space-x-1">
                                <Building className="w-3 h-3" />
                                <span>{task.customers.company_name}</span>
                              </span>
                            )}
                            {task.due_date && (
                              <span className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{formatUserDate(task.due_date)}</span>
                              </span>
                            )}
                            {task.estimated_hours && (
                              <span className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{task.estimated_hours}h</span>
                              </span>
                            )}
                          </div>
                        </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-gray-900 text-white border border-white/10">
                          <DropdownMenuItem className="focus:bg-white/10 focus:text-white" onClick={(e) => { e.stopPropagation(); openTaskModal(task); }}>
                            <Edit className="w-4 h-4 mr-2" />
                            Bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuItem className="focus:bg-white/10 focus:text-white" onClick={() => onTaskUpdate?.(task.id, { status: 'done' })}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Als erledigt markieren
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-400 focus:bg-red-500/10 focus:text-red-300">
                            <X className="w-4 h-4 mr-2" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}

              {tasks.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">Keine Aufgaben vorhanden</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Es wurden noch keine Aufgaben erstellt oder zugewiesen.
                    </p>
                    {onTaskCreate && (
                      <TaskCreateModal
                        onTaskCreate={onTaskCreate}
                        customers={managedCustomers}
                        requests={assignedRequests}
                      />
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Customers Section */}
        {activeSection === 'customers' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Verwaltete Kunden</h2>
                <p className="text-sm text-muted-foreground">
                  Alle zugewiesenen Kunden und deren Status
                </p>
              </div>
              <Button size="sm" className="flex items-center space-x-2" onClick={openAssignCustomer}>
                <Plus className="w-4 h-4" />
                <span>Kunde zuweisen</span>
              </Button>
            </div>

            <div className="space-y-3">
              {managedCustomers.map((customer) => (
                <Card key={customer.id} className="transition-all duration-200 hover:shadow-md cursor-pointer" onClick={() => openCustomerModal(customer)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium truncate">{customer.company_name}</h3>
                          <Badge
                            variant={customer.status === 'active' ? 'default' : 'outline'}
                            className="text-xs"
                          >
                            {customer.status === 'active' ? 'Aktiv' :
                             customer.status === 'inactive' ? 'Inaktiv' : 'Ausstehend'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {customer.contact_person}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          {customer.email && (
                            <span className="flex items-center space-x-1">
                              <Mail className="w-3 h-3" />
                              <span>{customer.email}</span>
                            </span>
                          )}
                          {customer.phone && (
                            <span className="flex items-center space-x-1">
                              <Phone className="w-3 h-3" />
                              <span>{customer.phone}</span>
                            </span>
                          )}
                          {customer.industry && (
                            <span className="flex items-center space-x-1">
                              <Building className="w-3 h-3" />
                              <span>{customer.industry}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-gray-900 text-white border border-white/10">
                          <DropdownMenuItem className="focus:bg-white/10 focus:text-white">
                            <Eye className="w-4 h-4 mr-2" />
                            Details anzeigen
                          </DropdownMenuItem>
                          <DropdownMenuItem className="focus:bg-white/10 focus:text-white">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Chat öffnen
                          </DropdownMenuItem>
                          <DropdownMenuItem className="focus:bg-white/10 focus:text-white">
                            <Edit className="w-4 h-4 mr-2" />
                            Bearbeiten
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {managedCustomers.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">Keine Kunden zugewiesen</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Es wurden noch keine Kunden zu diesem Mitarbeiter zugewiesen.
                    </p>
                    <Button variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Ersten Kunden zuweisen
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Requests Section */}
        {activeSection === 'requests' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Zugewiesene Anfragen</h2>
                <p className="text-sm text-muted-foreground">
                  Alle Kundenanfragen und deren Bearbeitungsstatus
                </p>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" className="flex items-center space-x-2" onClick={openAssignRequest}>
                  <Plus className="w-4 h-4" />
                  <span>Anfrage zuweisen</span>
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {assignedRequests.map((request) => (
                <Card key={request.id} className="transition-all duration-200 hover:shadow-md cursor-pointer" onClick={() => openRequestModal(request)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium truncate">{request.subject}</h3>
                          <Badge
                            variant={
                              request.status === 'responded' || request.status === 'converted' ? 'default' :
                              request.status === 'in_progress' ? 'secondary' : 'outline'
                            }
                            className="text-xs"
                          >
                            {request.status === 'new' ? 'Neu' :
                             request.status === 'in_progress' ? 'In Bearbeitung' :
                             request.status === 'responded' ? 'Beantwortet' :
                             request.status === 'converted' ? 'Konvertiert' : 'Archiviert'}
                          </Badge>
                          <Badge
                            variant={
                              request.priority === 'urgent' ? 'destructive' :
                              request.priority === 'high' ? 'default' : 'outline'
                            }
                            className="text-xs"
                          >
                            {request.priority === 'urgent' ? 'Dringend' :
                             request.priority === 'high' ? 'Hoch' :
                             request.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {request.message}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          {request.category && (
                            <span className="flex items-center space-x-1">
                              <FileText className="w-3 h-3" />
                              <span>{request.category}</span>
                            </span>
                          )}
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatUserDate(request.created_at)}</span>
                          </span>
                          {request.request_assignments?.[0]?.estimated_hours && (
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{request.request_assignments[0].estimated_hours}h geschätzt</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-gray-900 text-white border border-white/10">
                          <DropdownMenuItem className="focus:bg-white/10 focus:text-white" onClick={() => onRequestStatusUpdate?.(request.id, 'in_progress')}>
                            <TrendingUp className="w-4 h-4 mr-2" />
                            In Bearbeitung
                          </DropdownMenuItem>
                          <DropdownMenuItem className="focus:bg-white/10 focus:text-white" onClick={() => onRequestStatusUpdate?.(request.id, 'responded')}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Beantwortet
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-400 focus:bg-red-500/10 focus:text-red-300" onClick={() => onRequestUnassign?.(request.id)}>
                            <X className="w-4 h-4 mr-2" />
                            Zuweisung entfernen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {assignedRequests.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">Keine Anfragen zugewiesen</h3>
                    <p className="text-sm text-muted-foreground">
                      Es wurden noch keine Kundenanfragen zu diesem Mitarbeiter zugewiesen.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Chats Section */}
        {activeSection === 'chats' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Chat-Nachrichten</h2>
                <p className="text-sm text-muted-foreground">
                  Kürzliche Kommunikation mit Kunden
                </p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {recentChats
                .filter(chat => chat.customers?.assigned_employee_id === user.id)
                .map((chat) => (
                  <Card key={chat.id} className="transition-all duration-200 hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          chat.sender_type === 'customer' ? 'bg-blue-500' :
                          chat.sender_type === 'employee' ? 'bg-green-500' : 'bg-gray-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-sm">
                              {chat.customers?.company_name} - {chat.customers?.contact_person}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {chat.sender_type === 'customer' ? 'Kunde' :
                               chat.sender_type === 'employee' ? 'Mitarbeiter' : 'System'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {chat.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatUserDate(chat.created_at)}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

              {recentChats.filter(chat => chat.customers?.assigned_employee_id === user.id).length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">Keine Chat-Nachrichten</h3>
                    <p className="text-sm text-muted-foreground">
                      Es gibt noch keine Chat-Kommunikation mit den zugewiesenen Kunden.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Activity Section */}
        {activeSection === 'activity' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Aktivitätsverlauf</h2>
                <p className="text-sm text-muted-foreground">
                  Komplette Aktivitätshistorie des Benutzers
                </p>
              </div>
              <div className="flex space-x-2">
                <Input
                  placeholder="Aktivitäten durchsuchen..."
                  className="w-48"
                />
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {activityLogs.map((log, index) => (
                <Card key={index} className="transition-all duration-200 hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        log.action.includes('create') ? 'bg-green-500' :
                        log.action.includes('update') ? 'bg-blue-500' :
                        log.action.includes('delete') ? 'bg-red-500' : 'bg-gray-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm">{log.action}</h4>
                          <span className="text-xs text-muted-foreground">
                            {formatUserDate(log.created_at)}
                          </span>
                        </div>
                        {log.entity_type && (
                          <p className="text-xs text-muted-foreground mb-1">
                            {log.entity_type}: {log.entity_id}
                          </p>
                        )}
                        {log.details && (
                          <div className="bg-gray-50 p-2 rounded text-xs">
                            <pre className="whitespace-pre-wrap">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {activityLogs.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">Keine Aktivitäten</h3>
                    <p className="text-sm text-muted-foreground">
                      Es wurden noch keine Aktivitäten für diesen Benutzer aufgezeichnet.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Assign Customer Modal */}
      <Dialog open={showAssignCustomer} onOpenChange={setShowAssignCustomer}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Kunde zuweisen</DialogTitle>
            <DialogDescription>Weisen Sie einen Kunden einem Benutzer zu.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Kunde</label>
              <select className="w-full p-2 border rounded-md bg-gray-900 text-white border-white/10" value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)}>
                <option value="">Bitte wählen...</option>
                {availableCustomers.map(c => (
                  <option key={c.id} value={c.id}>{c.company_name} - {c.contact_person}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Mitarbeiter/Admin</label>
              <select className="w-full p-2 border rounded-md bg-gray-900 text-white border-white/10" value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)}>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignCustomer(false)}>Abbrechen</Button>
            <Button onClick={submitAssignCustomer} disabled={!selectedCustomer || !selectedEmployee || loadingAssign}>
              {loadingAssign ? 'Zuweisen...' : 'Zuweisen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Request Modal */}
      <Dialog open={showAssignRequest} onOpenChange={setShowAssignRequest}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Anfrage zuweisen</DialogTitle>
            <DialogDescription>Weisen Sie eine Anfrage einem Benutzer zu.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Anfrage</label>
              <select className="w-full p-2 border rounded-md bg-gray-900 text-white border-white/10" value={selectedRequest} onChange={e => setSelectedRequest(e.target.value)}>
                <option value="">Bitte wählen...</option>
                {availableRequests.map(r => (
                  <option key={r.id} value={r.id}>{r.subject}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Mitarbeiter/Admin</label>
              <select className="w-full p-2 border rounded-md bg-gray-900 text-white border-white/10" value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)}>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignRequest(false)}>Abbrechen</Button>
            <Button onClick={submitAssignRequest} disabled={!selectedRequest || !selectedEmployee || loadingAssign}>
              {loadingAssign ? 'Zuweisen...' : 'Zuweisen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Detail Modal (consistent with dashboard/tasks) */}
      <TaskDetailModal
        open={taskModalOpen}
        onOpenChange={setTaskModalOpen}
        task={selectedTask as any}
        employees={employeesForTasks}
        onTaskUpdated={handleTaskUpdated}
        onTaskChanged={handleTaskChanged as any}
      />

      {/* Request Detail Modal */}
      <RequestDetailModal
        open={requestModalOpen}
        onOpenChange={setRequestModalOpen}
        requestId={selectedRequestId}
        onUpdated={() => window.location.reload()}
      />

      {/* Customer Detail Modal */}
      <CustomerDetailModal
        open={customerModalOpen}
        onOpenChange={setCustomerModalOpen}
        customerId={selectedCustomerId}
        onUpdated={() => window.location.reload()}
      />
    </div>
  );
}
