'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Target,
  Plus,
  Calendar,
  User,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Filter,
  Search,
  Edit,
  Trash2,
  MoreVertical,
  Flag,
  Users,
  FileText,
  Award
} from 'lucide-react';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal';

interface TaskData {
  id: string;
  title: string;
  description?: string | null;
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string | null;
  created_at: string;
  updated_at?: string | null;
  assigned_to?: string | null;
  created_by: string;
  estimated_hours?: number | null;
  actual_hours?: number | null;
  progress_percentage?: number | null;
  customer_id?: string | null;
  contact_request_id?: string | null;
}

interface TaskManagementClientProps {
  initialTasks: TaskData[];
}

interface Employee {
  id: string;
  name: string;
  email: string;
}

interface Customer {
  id: string;
  company_name: string;
  contact_person: string;
  status: string;
}

interface ContactRequest {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
}

export function TaskManagementClient({ initialTasks }: TaskManagementClientProps) {
  const [tasks, setTasks] = useState<TaskData[]>(initialTasks);
  const [searchTerm, setSearchTerm] = useState('');
  const [assignmentFilter, setAssignmentFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskData | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [availableRequests, setAvailableRequests] = useState<ContactRequest[]>([]);
  const [showAssignRequestModal, setShowAssignRequestModal] = useState(false);
  const [showAssignCustomerModal, setShowAssignCustomerModal] = useState(false);
  const [selectedTaskForAssignment, setSelectedTaskForAssignment] = useState<TaskData | null>(null);

  // Load employees on component mount
  useEffect(() => {
    loadEmployees();
  }, []);

  // Load available requests when modal opens
  useEffect(() => {
    if (showAssignRequestModal) {
      fetchAvailableRequests();
    }
  }, [showAssignRequestModal]);

  // Load available customers when modal opens
  useEffect(() => {
    if (showAssignCustomerModal) {
      fetchAvailableCustomers();
    }
  }, [showAssignCustomerModal]);

  const loadEmployees = async () => {
    try {
      console.log('Loading employees...'); // Debug log
      // Load both employees and admins (who can be assigned to tasks)
      const [empResponse, adminResponse] = await Promise.all([
        fetch('/api/users?role=employee&limit=100'),
        fetch('/api/users?role=admin&limit=100')
      ]);

      console.log('Employee response status:', empResponse.status);
      console.log('Admin response status:', adminResponse.status);

      let allUsers: any[] = [];

      // Combine employees and admins
      if (empResponse.ok) {
        const empData = await empResponse.json();
        console.log('Employee API response:', empData);
        const list = empData.users || empData.data?.users || (Array.isArray(empData.data) ? empData.data : []);
        allUsers = [...allUsers, ...(list || [])];
      }

      if (adminResponse.ok) {
        const adminData = await adminResponse.json();
        console.log('Admin API response:', adminData);
        const list = adminData.users || adminData.data?.users || (Array.isArray(adminData.data) ? adminData.data : []);
        allUsers = [...allUsers, ...(list || [])];
      }

      console.log('Combined users from APIs:', allUsers);
      const missingEmployeeId = "0d7f752e-275c-46f7-9759-0d39c91fb842";
      const foundMissingEmployee = allUsers.find((u: any) => u.id === missingEmployeeId);
      console.log('Looking for missing employee:', missingEmployeeId);
      console.log('Found missing employee in combined data:', foundMissingEmployee);

      const employeeList = allUsers.map((u: any) => {
        const first = u.profile?.first_name ?? u.first_name;
        const last = u.profile?.last_name ?? u.last_name;
        const name = [first, last].filter(Boolean).join(' ') || 'Unknown';
        return {
          id: u.id,
          name,
          email: u.email || '',
          user_type: u.profile?.user_type ?? u.user_type,
          is_active: u.profile?.is_active ?? u.is_active
        };
      });

      console.log('Processed employee+admin list:', employeeList);
      setEmployees(employeeList);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const fetchAvailableRequests = async () => {
    try {
      console.log('Fetching available requests...'); // Debug log
      // Fetch only unassigned/new requests for assignment
      const response = await fetch('/api/requests?unassigned=true&status=pending,new&limit=100');
      if (response.ok) {
        const data = await response.json();
        console.log('Available requests response:', data); // Debug log
        setAvailableRequests(data.requests || []);
      } else {
        console.error('Failed to fetch requests:', response.status);
        setAvailableRequests([]);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      setAvailableRequests([]);
    }
  };

  const fetchAvailableCustomers = async () => {
    try {
      console.log('Fetching available customers...'); // Debug log
      const response = await fetch('/api/customers?status=active&limit=100');
      if (response.ok) {
        const data = await response.json();
        console.log('Available customers response:', data); // Debug log
        setCustomers(data.customers || []);
      } else {
        console.error('Failed to fetch customers:', response.status);
        setCustomers([]);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    }
  };

  // Refresh tasks function
  // Handle task updates from modal
  const handleTaskChanged = (updatedTask: TaskData) => {
    console.log('Task changed in modal:', updatedTask); // Debug log
    setSelectedTask(updatedTask);
    // Also update the task in the tasks list
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === updatedTask.id ? updatedTask : task
      )
    );
  };

  const refreshTasks = async () => {
    setLoading(true);
    try {
      console.log('Refreshing tasks...'); // Debug log
      const response = await fetch('/api/tasks?scope=all');
      console.log('Task refresh response status:', response.status); // Debug log
      if (response.ok) {
        const data = await response.json();
        console.log('Task refresh response data:', data); // Debug log
        // Handle different response structures
        const tasksData = data.tasks || data.data?.tasks || data.data || [];
        console.log('Extracted tasks data:', tasksData); // Debug log
        setTasks(tasksData);
      } else {
        console.error('Task refresh failed:', response.status, response.statusText);
        // Try without scope=all if admin call fails
        const fallbackResponse = await fetch('/api/tasks');
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          console.log('Fallback task data:', fallbackData); // Debug log
          const fallbackTasksData = fallbackData.tasks || fallbackData.data?.tasks || fallbackData.data || [];
          setTasks(fallbackTasksData);
        }
      }
    } catch (error) {
      console.error('Error refreshing tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle task detail modal
  const handleOpenTaskDetail = (task: TaskData) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleCloseTaskModal = () => {
    setSelectedTask(null);
    setShowTaskModal(false);
  };

  // Handle task deletion
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Aufgabe löschen möchten?')) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await refreshTasks();
      } else {
        alert('Fehler beim Löschen der Aufgabe');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Fehler beim Löschen der Aufgabe');
    }
  };

  // Handle quick actions
  const handleQuickAction = async (taskId: string, action: string) => {
    try {
      let updateData: any = {};

      switch (action) {
        case 'start':
          updateData.status = 'in_progress';
          break;
        case 'complete':
          updateData.status = 'done';
          updateData.progress_percentage = 100;
          break;
        case 'priority-high':
          updateData.priority = 'high';
          break;
        case 'priority-urgent':
          updateData.priority = 'urgent';
          break;
      }

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        await refreshTasks();
      }
    } catch (error) {
      console.error('Quick action error:', error);
    }
  };

  // Filter tasks based on search and filters
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchLower) ||
        (task.description && task.description.toLowerCase().includes(searchLower))
      );
    }

    // Assignment filter
    if (assignmentFilter === 'assigned') {
      filtered = filtered.filter(task => task.assigned_to);
    } else if (assignmentFilter === 'unassigned') {
      filtered = filtered.filter(task => !task.assigned_to);
    }

    // Priority filter
    if (priorityFilter) {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    return filtered;
  }, [tasks, searchTerm, assignmentFilter, priorityFilter]);

  // Calculate statistics from ALL tasks, not filtered
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(task => task.status === 'todo').length;
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress').length;
  const completedTasks = tasks.filter(task => task.status === 'done').length;
  const overdueTasks = tasks.filter(task =>
    task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'
  ).length;
  const highPriorityTasks = tasks.filter(task =>
    task.priority === 'high' || task.priority === 'urgent'
  ).length;

  const getTaskDisplayName = (task: TaskData) => {
    console.log('getTaskDisplayName called:', {
      taskId: task.id,
      assignedTo: task.assigned_to,
      employeesLength: employees.length,
      employees: employees
    });

    if (!task.assigned_to) {
      return 'Nicht zugewiesen';
    }

    const assignedEmployee = employees.find(emp => emp.id === task.assigned_to);
    console.log('Found employee:', assignedEmployee);
    return assignedEmployee ? assignedEmployee.name : 'Zugewiesen';
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'todo':
        return { label: 'Offen', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: Clock };
      case 'in_progress':
        return { label: 'In Bearbeitung', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: TrendingUp };
      case 'review':
        return { label: 'Review', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20', icon: FileText };
      case 'done':
        return { label: 'Abgeschlossen', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle };
      case 'cancelled':
        return { label: 'Abgebrochen', color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: AlertTriangle };
      case 'blocked':
        return { label: 'Blockiert', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', icon: AlertTriangle };
      default:
        return { label: 'Unbekannt', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20', icon: AlertTriangle };
    }
  };

  const getPriorityInfo = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { label: 'Dringend', color: 'bg-red-600/10 text-red-600 border-red-600/20', icon: AlertTriangle };
      case 'high':
        return { label: 'Hoch', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', icon: Flag };
      case 'medium':
        return { label: 'Mittel', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: Flag };
      case 'low':
        return { label: 'Niedrig', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: Flag };
      default:
        return { label: 'Unbekannt', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20', icon: Flag };
    }
  };

  const isOverdue = (dueDate?: string) => {
    return dueDate && new Date(dueDate) < new Date();
  };

  const getDaysUntilDue = (dueDate?: string) => {
    if (!dueDate) return null;
    const days = Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    return days;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">

        {/* Mobile-First Header */}
        <div className="flex flex-col space-y-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Aufgabenverwaltung</h1>
            <p className="text-gray-300 text-sm md:text-base">Verwaltung und Übersicht aller Aufgaben und Projekte</p>
          </div>
        </div>

        {/* Mobile-Responsive Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          <Card className="modern-card border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-white">Gesamt</CardTitle>
              <Target className="h-3 w-3 md:h-4 md:w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold text-white">{totalTasks}</div>
              <p className="text-xs text-gray-400">Aufgaben</p>
            </CardContent>
          </Card>

          <Card className="modern-card border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-white">Ausstehend</CardTitle>
              <Clock className="h-3 w-3 md:h-4 md:w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold text-yellow-400">{pendingTasks}</div>
              <p className="text-xs text-gray-400">Wartend</p>
            </CardContent>
          </Card>

          <Card className="modern-card border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-white">In Arbeit</CardTitle>
              <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold text-blue-400">{inProgressTasks}</div>
              <p className="text-xs text-gray-400">Aktiv</p>
            </CardContent>
          </Card>

          <Card className="modern-card border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-white">Erledigt</CardTitle>
              <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold text-green-400">{completedTasks}</div>
              <p className="text-xs text-gray-400">Abgeschlossen</p>
            </CardContent>
          </Card>

          <Card className="modern-card border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-white">Überfällig</CardTitle>
              <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold text-red-400">{overdueTasks}</div>
              <p className="text-xs text-gray-400">Verspätet</p>
            </CardContent>
          </Card>

          <Card className="modern-card border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-white">Hohe Priorität</CardTitle>
              <Flag className="h-3 w-3 md:h-4 md:w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold text-orange-400">{highPriorityTasks}</div>
              <p className="text-xs text-gray-400">Wichtig</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-3">
            <CreateTaskModal />
            <Button variant="outline" onClick={refreshTasks} disabled={loading}>
              {loading ? <Clock className="w-4 h-4 mr-2 animate-spin" /> : <Target className="w-4 h-4 mr-2" />}
              Aktualisieren
            </Button>
          </div>
          <div className="text-sm text-white/70">
            {filteredTasks.length} von {tasks.length} Aufgaben angezeigt
          </div>
        </div>

        {/* Task Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-5">
            <TabsTrigger value="all" className="text-xs md:text-sm">Alle</TabsTrigger>
            <TabsTrigger value="todo" className="text-xs md:text-sm">Offen</TabsTrigger>
            <TabsTrigger value="in_progress" className="text-xs md:text-sm">In Arbeit</TabsTrigger>
            <TabsTrigger value="done" className="text-xs md:text-sm">Erledigt</TabsTrigger>
            <TabsTrigger value="overdue" className="text-xs md:text-sm hidden md:block">Überfällig</TabsTrigger>
          </TabsList>

          {/* Search and Filter */}
          <Card className="modern-card border-0">
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col space-y-3 md:flex-row md:items-center md:space-y-0 md:space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Aufgaben suchen..."
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400 focus:ring-blue-500 text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex space-x-2 md:space-x-3">
                  <select
                    className="flex-1 md:flex-none px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    value={assignmentFilter}
                    onChange={(e) => setAssignmentFilter(e.target.value)}
                  >
                    <option value="">Alle Zuweisungen</option>
                    <option value="assigned">Zugewiesen</option>
                    <option value="unassigned">Nicht zugewiesen</option>
                  </select>
                  <select
                    className="flex-1 md:flex-none px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                  >
                    <option value="">Alle Prioritäten</option>
                    <option value="urgent">Dringend</option>
                    <option value="high">Hoch</option>
                    <option value="medium">Mittel</option>
                    <option value="low">Niedrig</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* All Tasks Tab */}
          <TabsContent value="all" className="space-y-4">
            <TasksList
              tasks={filteredTasks}
              employees={employees}
              onDelete={handleDeleteTask}
              onOpenDetail={handleOpenTaskDetail}
              onQuickAction={handleQuickAction}
            />
          </TabsContent>

          {/* Todo Tasks Tab */}
          <TabsContent value="todo" className="space-y-4">
            <TasksList
              tasks={filteredTasks.filter(task => task.status === 'todo')}
              employees={employees}
              onDelete={handleDeleteTask}
              onOpenDetail={handleOpenTaskDetail}
              onQuickAction={handleQuickAction}
            />
          </TabsContent>

          {/* In Progress Tasks Tab */}
          <TabsContent value="in_progress" className="space-y-4">
            <TasksList
              tasks={filteredTasks.filter(task => task.status === 'in_progress')}
              employees={employees}
              onDelete={handleDeleteTask}
              onOpenDetail={handleOpenTaskDetail}
              onQuickAction={handleQuickAction}
            />
          </TabsContent>

          {/* Done Tasks Tab */}
          <TabsContent value="done" className="space-y-4">
            <TasksList
              tasks={filteredTasks.filter(task => task.status === 'done')}
              employees={employees}
              onDelete={handleDeleteTask}
              onOpenDetail={handleOpenTaskDetail}
              onQuickAction={handleQuickAction}
            />
          </TabsContent>

          {/* Overdue Tasks Tab */}
          <TabsContent value="overdue" className="space-y-4">
            <TasksList
              tasks={filteredTasks.filter(task =>
                task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'
              )}
              employees={employees}
              onDelete={handleDeleteTask}
              onOpenDetail={handleOpenTaskDetail}
              onQuickAction={handleQuickAction}
            />
          </TabsContent>

        </Tabs>

        {/* Task Detail Modal */}
        <TaskDetailModal
          open={showTaskModal}
          onOpenChange={handleCloseTaskModal}
          task={selectedTask}
          employees={employees}
          onTaskUpdated={refreshTasks}
          onTaskChanged={handleTaskChanged}
        />

      </div>
    </div>
  );
}

// Tasks List Component
function TasksList({
  tasks,
  employees,
  onDelete,
  onOpenDetail,
  onQuickAction
}: {
  tasks: TaskData[];
  employees: Employee[];
  onDelete: (id: string) => void;
  onOpenDetail: (task: TaskData) => void;
  onQuickAction: (taskId: string, action: string) => void;
}) {
  const getTaskDisplayName = (task: TaskData) => {
    console.log('getTaskDisplayName called:', {
      taskId: task.id,
      assignedTo: task.assigned_to,
      employeesLength: employees.length,
      employees: employees
    });

    if (!task.assigned_to) {
      return 'Nicht zugewiesen';
    }

    const assignedEmployee = employees.find(emp => emp.id === task.assigned_to);
    console.log('Found employee:', assignedEmployee);
    return assignedEmployee ? assignedEmployee.name : 'Zugewiesen';
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'todo':
        return { label: 'Offen', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: Clock };
      case 'in_progress':
        return { label: 'In Bearbeitung', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: TrendingUp };
      case 'review':
        return { label: 'Review', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20', icon: FileText };
      case 'done':
        return { label: 'Abgeschlossen', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle };
      case 'cancelled':
        return { label: 'Abgebrochen', color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: AlertTriangle };
      case 'blocked':
        return { label: 'Blockiert', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', icon: AlertTriangle };
      default:
        return { label: 'Unbekannt', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20', icon: AlertTriangle };
    }
  };

  const getPriorityInfo = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { label: 'Dringend', color: 'bg-red-600/10 text-red-600 border-red-600/20', icon: AlertTriangle };
      case 'high':
        return { label: 'Hoch', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', icon: Flag };
      case 'medium':
        return { label: 'Mittel', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: Flag };
      case 'low':
        return { label: 'Niedrig', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: Flag };
      default:
        return { label: 'Unbekannt', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20', icon: Flag };
    }
  };

  const isOverdue = (dueDate?: string) => {
    return dueDate && new Date(dueDate) < new Date();
  };

  const getDaysUntilDue = (dueDate?: string) => {
    if (!dueDate) return null;
    const days = Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    return days;
  };

  return (
    <Card className="modern-card border-0">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2 text-lg md:text-xl">
          <Target className="w-5 h-5 text-blue-400" />
          Aufgaben ({tasks.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 md:p-6">
        {tasks.length > 0 ? (
          <div className="space-y-3 md:space-y-4">
            {tasks.map((task) => {
              const statusInfo = getStatusInfo(task.status);
              const priorityInfo = getPriorityInfo(task.priority);
              const StatusIcon = statusInfo.icon;
              const PriorityIcon = priorityInfo.icon;
              const overdue = isOverdue(task.due_date || undefined);
              const daysUntilDue = getDaysUntilDue(task.due_date || undefined);

              return (
                <div key={task.id} className={`bg-white/5 rounded-lg border ${overdue ? 'border-red-500/50' : 'border-white/10'} hover:bg-white/10 transition-colors p-3 md:p-4`}>

                  {/* Mobile Layout */}
                  <div className="block md:hidden">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => onOpenDetail(task)}
                          className="hover:text-blue-400 transition-colors text-left w-full"
                        >
                          <h3 className="text-white font-medium text-sm mb-2 truncate">
                            {task.title}
                          </h3>
                        </button>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge variant="outline" className={`${statusInfo.color} text-xs`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                          <Badge variant="outline" className={`${priorityInfo.color} text-xs`}>
                            <PriorityIcon className="w-3 h-3 mr-1" />
                            {priorityInfo.label}
                          </Badge>
                          {overdue && (
                            <Badge variant="destructive" className="text-xs">
                              Überfällig
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-400 text-xs truncate mb-2">
                          Zugewiesen an: {getTaskDisplayName(task)}
                        </p>
                        {task.due_date && (
                          <p className="text-gray-500 text-xs">
                            Fällig: {new Date(task.due_date as string).toLocaleDateString('de-DE')}
                            {daysUntilDue !== null && (
                              <span className={`ml-2 ${daysUntilDue < 0 ? 'text-red-400' : daysUntilDue <= 3 ? 'text-yellow-400' : 'text-gray-400'}`}>
                                ({daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} Tage überfällig` :
                                  daysUntilDue === 0 ? 'Heute fällig' :
                                  `${daysUntilDue} Tage verbleibend`})
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white p-1"
                        onClick={() => onOpenDetail(task)}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        {task.progress_percentage && (
                          <span>{task.progress_percentage}% abgeschlossen</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-400 hover:text-blue-300 text-xs"
                          onClick={() => onOpenDetail(task)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Bearbeiten
                        </Button>
                        {task.status === 'todo' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-400 hover:text-green-300 text-xs"
                            onClick={() => onQuickAction(task.id, 'start')}
                          >
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Start
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-2 h-16 rounded-full bg-gradient-to-b from-blue-500 to-purple-600 flex-shrink-0"></div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <button
                            onClick={() => onOpenDetail(task)}
                            className="hover:text-blue-400 transition-colors text-left"
                          >
                            <h3 className="text-white font-medium text-lg truncate">
                              {task.title}
                            </h3>
                          </button>
                          <Badge variant="outline" className={statusInfo.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                          <Badge variant="outline" className={priorityInfo.color}>
                            <PriorityIcon className="w-3 h-3 mr-1" />
                            {priorityInfo.label}
                          </Badge>
                          {overdue && (
                            <Badge variant="destructive">
                              Überfällig
                            </Badge>
                          )}
                        </div>

                        {task.description && (
                          <p className="text-gray-400 text-sm mb-2 truncate">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            <User className="w-3 h-3 inline mr-1" />
                            {getTaskDisplayName(task)}
                          </span>
                          {task.due_date && (
                            <span>
                              <Calendar className="w-3 h-3 inline mr-1" />
                              {new Date(task.due_date).toLocaleDateString('de-DE')}
                              {daysUntilDue !== null && (
                                <span className={`ml-2 ${daysUntilDue < 0 ? 'text-red-400' : daysUntilDue <= 3 ? 'text-yellow-400' : 'text-gray-400'}`}>
                                  ({daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} Tage überfällig` :
                                    daysUntilDue === 0 ? 'Heute fällig' :
                                    `${daysUntilDue} Tage verbleibend`})
                                </span>
                              )}
                            </span>
                          )}
                          {task.estimated_hours && (
                            <span>
                              <Clock className="w-3 h-3 inline mr-1" />
                              {task.estimated_hours}h geschätzt
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-center min-w-[120px]">
                        {task.progress_percentage !== undefined && (
                          <div className="mb-2">
                            <div className="text-sm font-medium text-white">
                              {task.progress_percentage}%
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all"
                                style={{ width: `${task.progress_percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                        <p className="text-gray-400 text-xs">Fortschritt</p>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                        onClick={() => onOpenDetail(task)}
                        title="Bearbeiten"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {task.status === 'todo' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-green-400"
                          onClick={() => onQuickAction(task.id, 'start')}
                          title="Starten"
                        >
                          <TrendingUp className="w-4 h-4" />
                        </Button>
                      )}
                      {task.status !== 'done' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-blue-400"
                          onClick={() => onQuickAction(task.id, 'complete')}
                          title="Erledigen"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-red-400"
                        onClick={() => onDelete(task.id)}
                        title="Löschen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 md:py-12">
            <Target className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-white text-lg font-medium mb-2">Keine Aufgaben gefunden</h3>
            <p className="text-gray-400 mb-4 text-sm md:text-base">
              Es wurden keine Aufgaben in dieser Kategorie gefunden.
            </p>
            <CreateTaskModal
              trigger={
                <Button className="mystery-button">
                  <Plus className="w-4 h-4 mr-2" />
                  Erste Aufgabe erstellen
                </Button>
              }
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
