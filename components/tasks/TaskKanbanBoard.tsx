'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  Plus,
  MoreVertical,
  Clock,
  Calendar,
  User,
  Building,
  Mail,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Flag,
  AlertTriangle,
  Users
} from 'lucide-react';
import { formatUserDate } from '@/lib/user-utils';
import { TaskDetailModal } from './TaskDetailModal';
import { CreateTaskModal } from './CreateTaskModal';
import { RequestDetailModal } from '@/components/requests/RequestDetailModal';
import { CustomerDetailModal } from '@/components/crm/CustomerDetailModal';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'pending' | 'in_progress' | 'completed' | 'done' | 'cancelled' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  created_by: string;
  customer_id?: string;
  contact_request_id?: string;
  due_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  progress_percentage?: number;
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
  assignee?: {
    first_name?: string;
    last_name?: string;
    email: string;
  };
  creator?: {
    first_name?: string;
    last_name?: string;
    email: string;
  };
}

interface TaskKanbanBoardProps {
  isWorkspace?: boolean;
}

const columns = [
  { id: 'todo', title: 'Zu erledigen', status: ['todo', 'pending'], color: 'bg-yellow-500' },
  { id: 'in_progress', title: 'In Bearbeitung', status: ['in_progress'], color: 'bg-blue-500' },
  { id: 'completed', title: 'Abgeschlossen', status: ['completed', 'done'], color: 'bg-green-500' },
  { id: 'cancelled', title: 'Abgebrochen', status: ['cancelled', 'blocked'], color: 'bg-red-500' }
];

const dropTargetToStatus: Record<string, Task['status']> = {
  todo: 'todo',
  in_progress: 'in_progress',
  completed: 'done',
  cancelled: 'cancelled',
};

const priorityConfig = {
  urgent: { label: 'Dringend', color: 'bg-red-600/10 text-red-600 border-red-600/20', icon: AlertTriangle },
  high: { label: 'Hoch', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', icon: Flag },
  medium: { label: 'Mittel', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: Flag },
  low: { label: 'Niedrig', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: Flag }
};

export function TaskKanbanBoard({ isWorkspace = true }: TaskKanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  // Creation is handled by CreateTaskModal
  const [actioningTask, setActioningTask] = useState<string | null>(null);
  const [requestModalId, setRequestModalId] = useState<string | null>(null);
  const [customerModalId, setCustomerModalId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Array<{ id: string; name: string; email: string }>>([]);

  useEffect(() => {
    fetchTasks();
    // Load employees (for assignment in detail quick actions)
    (async () => {
      try {
        const [empRes, adminRes] = await Promise.all([
          fetch('/api/users?role=employee&limit=100'),
          fetch('/api/users?role=admin&limit=100'),
        ]);
        const list: any[] = [];
        if (empRes.ok) { const d = await empRes.json(); list.push(...(d.users || d.data?.users || (Array.isArray(d.data) ? d.data : []) || [])); }
        if (adminRes.ok) { const d = await adminRes.json(); list.push(...(d.users || d.data?.users || (Array.isArray(d.data) ? d.data : []) || [])); }
        const mapped = list.map((u: any) => ({
          id: u.id,
          email: u.email,
          name: [u.first_name ?? u.profile?.first_name, u.last_name ?? u.profile?.last_name].filter(Boolean).join(' ') || u.email || 'Unbekannt'
        }));
        setEmployees(mapped);
      } catch {}
    })();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks?scope=mine');
      if (response.ok) {
        const data = await response.json();
        const tasks = data.tasks || data.data?.tasks || (Array.isArray(data.data) ? data.data : []) || [];
        setTasks(tasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    setActioningTask(taskId);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const { task } = await response.json();
        setTasks(prev =>
          prev.map(t => t.id === taskId ? { ...t, ...task } : t)
        );
      } else {
        const error = await response.json();
        alert('Fehler beim Update: ' + error.error);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Fehler beim Aktualisieren der Aufgabe');
    } finally {
      setActioningTask(null);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Aufgabe wirklich löschen?')) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        setSelectedTask(null);
        setShowTaskModal(false);
      } else {
        const error = await response.json();
        alert('Fehler beim Löschen: ' + error.error);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Fehler beim Löschen der Aufgabe');
    }
  };

  const getTasksByColumn = (columnStatus: string[]) => {
    return tasks.filter(task => columnStatus.includes(task.status));
  };

  const getUserName = (user?: { first_name?: string; last_name?: string; email: string }) => {
    if (!user) return 'Unbekannt';
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.email;
  };

  const getStatusActions = (task: Task) => {
    switch (task.status) {
      case 'todo':
      case 'pending':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => updateTaskStatus(task.id, 'in_progress')}
            disabled={actioningTask === task.id}
            className="bg-blue-500/10 border-blue-500/20 text-blue-500 hover:bg-blue-500/20"
          >
            <Play className="w-3 h-3 mr-1" />
            Starten
          </Button>
        );
      case 'in_progress':
        return (
          <div className="flex gap-1">
            <Button
              size="sm"
              onClick={() => updateTaskStatus(task.id, 'done')}
              disabled={actioningTask === task.id}
              className="bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500/20"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Fertig
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateTaskStatus(task.id, 'todo')}
              disabled={actioningTask === task.id}
              className="bg-yellow-500/10 border-yellow-500/20 text-yellow-500 hover:bg-yellow-500/20"
            >
              <Pause className="w-3 h-3" />
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((column) => (
          <Card key={column.id} className="modern-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-white">
                <div className={`w-3 h-3 rounded-full ${column.color}`} />
                {column.title}
                <div className="w-6 h-4 bg-white/10 rounded animate-pulse" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white/5 rounded-lg p-3 animate-pulse">
                  <div className="h-4 bg-white/10 rounded mb-2" />
                  <div className="h-3 bg-white/5 rounded mb-2" />
                  <div className="flex gap-2">
                    <div className="h-4 w-12 bg-white/10 rounded" />
                    <div className="h-4 w-8 bg-white/10 rounded" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((column) => {
          const columnTasks = getTasksByColumn(column.status);

          return (
            <Card
              key={column.id}
              className="modern-card border-0"
              onDragOver={(e) => {
                // Allow dropping tasks onto column
                e.preventDefault();
              }}
              onDrop={async (e) => {
                e.preventDefault();
                const taskId = e.dataTransfer.getData('text/plain');
                if (!taskId) return;
                const newStatus = dropTargetToStatus[column.id as keyof typeof dropTargetToStatus];
                if (!newStatus) return;
                await updateTaskStatus(taskId, newStatus);
              }}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${column.color}`} />
                    {column.title}
                    <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                      {columnTasks.length}
                    </Badge>
                  </div>
                  {column.id === 'todo' && (
                    <CreateTaskModal
                      trigger={
                        <Button size="sm" variant="ghost" className="text-white/70 hover:text-white">
                          <Plus className="w-4 h-4" />
                        </Button>
                      }
                    />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                {columnTasks.map((task) => {
                  const priority = priorityConfig[task.priority];
                  const PriorityIcon = priority.icon;
                  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !['completed', 'done'].includes(task.status);

                  return (
                    <Card
                      key={task.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', task.id);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      className={`bg-white/5 border-white/10 transition-all cursor-pointer ${
                        isOverdue ? 'border-red-500/50' : ''
                      }`}
                      onClick={() => {
                        setSelectedTask(task);
                        setShowTaskModal(true);
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="space-y-3">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium text-white text-sm line-clamp-2 flex-1">
                              {task.title}
                            </h4>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm" className="text-white/50 hover:text-white h-6 w-6 p-0">
                                  <MoreVertical className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTask(task);
                                    setShowTaskModal(true);
                                  }}
                                  className="text-white hover:bg-gray-800"
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Bearbeiten
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-gray-700" />
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteTask(task.id);
                                  }}
                                  className="text-red-400 hover:bg-gray-800"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Löschen
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Priority & Due Date */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={`${priority.color} text-xs`}>
                              <PriorityIcon className="w-3 h-3 mr-1" />
                              {priority.label}
                            </Badge>
                            {isOverdue && (
                              <Badge variant="destructive" className="text-xs">
                                Überfällig
                              </Badge>
                            )}
                          </div>

                          {/* Description */}
                          {task.description && (
                            <p className="text-xs text-white/70 line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          {/* Customer/Request */}
                          {(task.customers || task.contact_requests) && (
                            <div className="space-y-1">
                              {task.customers && (
                                <button
                                  type="button"
                                  className="flex items-center gap-1 text-xs text-white/60 hover:text-white/90 underline-offset-2 hover:underline"
                                  onClick={(e) => { e.stopPropagation(); setCustomerModalId(task.customers!.id); }}
                                >
                                  <Building className="w-3 h-3" />
                                  <span className="truncate">{task.customers.company_name}</span>
                                </button>
                              )}
                              {task.contact_requests && (
                                <button
                                  type="button"
                                  className="flex items-center gap-1 text-xs text-white/60 hover:text-white/90 underline-offset-2 hover:underline"
                                  onClick={(e) => { e.stopPropagation(); setRequestModalId(task.contact_requests!.id); }}
                                >
                                  <Mail className="w-3 h-3" />
                                  <span className="truncate">{task.contact_requests.subject}</span>
                                </button>
                              )}
                            </div>
                          )}

                          {/* Meta Info */}
                          <div className="flex items-center justify-between text-xs text-white/50">
                            <div className="flex items-center gap-2">
                              {task.due_date && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{formatUserDate(task.due_date)}</span>
                                </div>
                              )}
                              {task.estimated_hours && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{task.estimated_hours}h</span>
                                </div>
                              )}
                            </div>
                            {task.assignee && (
                              <div className="flex items-center gap-1">
                                <Avatar className="w-4 h-4">
                                  <AvatarFallback className="text-xs bg-white/20 text-white">
                                    {getUserName(task.assignee).charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div onClick={(e) => e.stopPropagation()}>
                            {getStatusActions(task)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {columnTasks.length === 0 && (
                  <div className="text-center py-8 text-white/50">
                    <div className="text-xs">Keine Aufgaben</div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          open={showTaskModal}
          onOpenChange={(open) => { if (!open) { setShowTaskModal(false); setSelectedTask(null); } }}
          task={selectedTask as any}
          employees={employees}
          onTaskUpdated={fetchTasks}
          onTaskChanged={(updated) => {
            setTasks(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t));
            setSelectedTask(prev => prev && prev.id === updated.id ? ({ ...prev, ...updated }) : prev);
          }}
        />
      )}

      {/* Request View Modal from task card */}
      <RequestDetailModal
        open={!!requestModalId}
        onOpenChange={(open) => !open && setRequestModalId(null)}
        requestId={requestModalId}
        onUpdated={fetchTasks}
        canAssign={false}
      />
      <CustomerDetailModal
        open={!!customerModalId}
        onOpenChange={(open) => !open && setCustomerModalId(null)}
        customerId={customerModalId}
        onUpdated={fetchTasks}
        canAssign={false}
      />

      {/* Create Task Modal handled via CreateTaskModal triggers in UI */}
    </>
  );
}
