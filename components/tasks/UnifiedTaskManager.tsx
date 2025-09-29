'use client';

import { useState, useEffect, useMemo } from 'react';
import { PageLayout, ModernCard } from '@/components/shared/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  CheckSquare,
  Clock,
  Calendar,
  AlertCircle,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Filter,
  Target,
  TrendingUp,
  User
} from 'lucide-react';
import { formatUserDate } from '@/lib/user-utils';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'blocked';
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

interface UnifiedTaskManagerProps {
  isWorkspace?: boolean;
  userId?: string;
  showAllTasks?: boolean;
  noLayout?: boolean;
}

export function UnifiedTaskManager({
  isWorkspace = false,
  userId,
  showAllTasks = false,
  noLayout = false
}: UnifiedTaskManagerProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actioningTask, setActioningTask] = useState<string | null>(null);

  // Task creation form state
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    due_date: '',
    estimated_hours: 0,
    assigned_to: userId || ''
  });

  useEffect(() => {
    fetchTasks();
  }, [showAllTasks, userId]);

  const fetchTasks = async () => {
    try {
      let url = '/api/tasks?scope=mine';
      if (showAllTasks && !userId) {
        url = '/api/tasks?scope=all';
      } else if (userId) {
        url = `/api/tasks?assigned_to=${userId}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async () => {
    if (!newTask.title.trim()) return;

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTask.title,
          description: newTask.description,
          priority: newTask.priority,
          dueDate: newTask.due_date,
          assignedTo: newTask.assigned_to,
          estimatedHours: newTask.estimated_hours
        }),
      });

      if (response.ok) {
        setNewTask({
          title: '',
          description: '',
          priority: 'medium',
          due_date: '',
          estimated_hours: 0,
          assigned_to: userId || ''
        });
        setShowCreateModal(false);
        fetchTasks();
      } else {
        const error = await response.json();
        alert('Fehler beim Erstellen: ' + error.error);
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Fehler beim Erstellen der Aufgabe');
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
        setTasks(prev =>
          prev.map(task =>
            task.id === taskId ? { ...task, status: newStatus } : task
          )
        );
      } else {
        alert('Fehler beim Aktualisieren der Aufgabe');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Fehler beim Aktualisieren der Aufgabe');
    } finally {
      setActioningTask(null);
    }
  };

  // Filter and search logic
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          task.title.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower) ||
          task.customers?.company_name.toLowerCase().includes(searchLower) ||
          task.assignee?.first_name?.toLowerCase().includes(searchLower) ||
          task.assignee?.last_name?.toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter === 'active') {
        if (!['todo', 'pending', 'in_progress'].includes(task.status)) return false;
      } else if (statusFilter === 'completed') {
        if (task.status !== 'completed') return false;
      } else if (statusFilter !== 'all') {
        if (task.status !== statusFilter) return false;
      }

      // Priority filter
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false;
      }

      return true;
    });
  }, [tasks, searchTerm, statusFilter, priorityFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const active = tasks.filter(t => ['todo', 'pending', 'in_progress'].includes(t.status)).length;
    const urgent = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length;
    const overdue = tasks.filter(t =>
      t.due_date &&
      new Date(t.due_date) < new Date() &&
      t.status !== 'completed'
    ).length;

    return { total, completed, active, urgent, overdue };
  }, [tasks]);

  // Helper functions
  const getStatusInfo = (status: Task['status']) => {
    const statusMap = {
      todo: { label: 'Offen', variant: 'outline' as const, color: 'text-yellow-400' },
      pending: { label: 'Ausstehend', variant: 'outline' as const, color: 'text-yellow-400' },
      in_progress: { label: 'In Bearbeitung', variant: 'secondary' as const, color: 'text-blue-400' },
      completed: { label: 'Abgeschlossen', variant: 'default' as const, color: 'text-green-400' },
      cancelled: { label: 'Abgebrochen', variant: 'destructive' as const, color: 'text-red-400' },
      blocked: { label: 'Blockiert', variant: 'destructive' as const, color: 'text-orange-400' }
    };
    return statusMap[status] || statusMap.todo;
  };

  const getPriorityInfo = (priority: Task['priority']) => {
    const priorityMap = {
      low: { label: 'Niedrig', variant: 'outline' as const, color: 'text-green-400' },
      medium: { label: 'Mittel', variant: 'secondary' as const, color: 'text-blue-400' },
      high: { label: 'Hoch', variant: 'default' as const, color: 'text-orange-400' },
      urgent: { label: 'Dringend', variant: 'destructive' as const, color: 'text-red-400' }
    };
    return priorityMap[priority] || priorityMap.medium;
  };

  const getUserDisplayName = (user?: { first_name?: string; last_name?: string; email: string }) => {
    if (!user) return 'Unbekannt';
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.email;
  };

  const pageTitle = isWorkspace ? 'Meine Aufgaben' : 'Task Management';
  const pageDescription = isWorkspace
    ? 'Verwalten Sie Ihre zugewiesenen und erstellten Aufgaben'
    : 'Zentrale Aufgabenverwaltung für alle Projekte und Teams';

  const content = (
    <>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <ModernCard gradient={false}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70">Gesamt</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <CheckSquare className="w-8 h-8 text-blue-400" />
          </div>
        </ModernCard>

        <ModernCard gradient={false}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70">Aktiv</p>
              <p className="text-2xl font-bold text-white">{stats.active}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </ModernCard>

        <ModernCard gradient={false}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70">Abgeschlossen</p>
              <p className="text-2xl font-bold text-white">{stats.completed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <div className="mt-2">
            <Progress
              value={stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}
              className="h-2"
            />
          </div>
        </ModernCard>

        <ModernCard gradient={false}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70">Dringend</p>
              <p className="text-2xl font-bold text-red-400">{stats.urgent}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
        </ModernCard>

        <ModernCard gradient={false}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70">Überfällig</p>
              <p className="text-2xl font-bold text-orange-400">{stats.overdue}</p>
            </div>
            <Calendar className="w-8 h-8 text-orange-400" />
          </div>
        </ModernCard>
      </div>

      {/* Filters */}
      <ModernCard title="Filter & Ansicht" gradient={false}>
        <div className="flex flex-wrap gap-4">
          <div className="space-y-2">
            <Label className="text-white/70">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="active">Aktive</SelectItem>
                <SelectItem value="todo">Offen</SelectItem>
                <SelectItem value="in_progress">In Bearbeitung</SelectItem>
                <SelectItem value="completed">Abgeschlossen</SelectItem>
                <SelectItem value="cancelled">Abgebrochen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-white/70">Priorität</Label>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-48 bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                <SelectItem value="all">Alle Prioritäten</SelectItem>
                <SelectItem value="urgent">Dringend</SelectItem>
                <SelectItem value="high">Hoch</SelectItem>
                <SelectItem value="medium">Mittel</SelectItem>
                <SelectItem value="low">Niedrig</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </ModernCard>

      {/* Tasks List */}
      <ModernCard
        title={`Aufgaben (${filteredTasks.length})`}
        gradient={false}
      >
        {loading ? (
          <div className="text-center py-8">
            <p className="text-white/70">Laden...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <CheckSquare className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              {searchTerm ? 'Keine Aufgaben gefunden' : 'Keine Aufgaben vorhanden'}
            </h3>
            <p className="text-white/70 mb-6">
              {searchTerm
                ? 'Versuchen Sie andere Suchbegriffe oder passen Sie die Filter an.'
                : 'Erstellen Sie Ihre erste Aufgabe, um loszulegen.'
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Erste Aufgabe erstellen
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => {
              const statusInfo = getStatusInfo(task.status);
              const priorityInfo = getPriorityInfo(task.priority);
              const isOverdue = task.due_date && new Date(task.due_date) < new Date();

              return (
                <div key={task.id} className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Title and badges */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-medium text-white truncate">{task.title}</h3>
                        <Badge variant={statusInfo.variant} className="text-xs">
                          {statusInfo.label}
                        </Badge>
                        <Badge variant={priorityInfo.variant} className="text-xs">
                          {priorityInfo.label}
                        </Badge>
                        {isOverdue && (
                          <Badge variant="destructive" className="text-xs">
                            Überfällig
                          </Badge>
                        )}
                      </div>

                      {/* Description */}
                      {task.description && (
                        <p className="text-sm text-white/70 mb-3 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {/* Meta information */}
                      <div className="flex items-center gap-4 text-xs text-white/50 flex-wrap">
                        {task.assignee && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{getUserDisplayName(task.assignee)}</span>
                          </div>
                        )}
                        {task.customers && (
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{task.customers.company_name}</span>
                          </div>
                        )}
                        {task.due_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatUserDate(task.due_date)}</span>
                          </div>
                        )}
                        {task.estimated_hours && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{task.estimated_hours}h geschätzt</span>
                          </div>
                        )}
                      </div>

                      {/* Progress bar */}
                      {task.progress_percentage !== undefined && task.progress_percentage > 0 && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-white/70 mb-1">
                            <span>Fortschritt</span>
                            <span>{task.progress_percentage}%</span>
                          </div>
                          <Progress value={task.progress_percentage} className="h-2" />
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      {/* Quick status change buttons */}
                      {task.status === 'todo' || task.status === 'pending' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateTaskStatus(task.id, 'in_progress')}
                          disabled={actioningTask === task.id}
                          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Starten
                        </Button>
                      ) : task.status === 'in_progress' ? (
                        <Button
                          size="sm"
                          onClick={() => updateTaskStatus(task.id, 'completed')}
                          disabled={actioningTask === task.id}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Abschließen
                        </Button>
                      ) : null}

                      {/* More actions menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700">
                          <DropdownMenuItem className="text-white hover:bg-gray-800">
                            <Edit className="w-4 h-4 mr-2" />
                            Bearbeiten
                          </DropdownMenuItem>
                          {task.status === 'in_progress' && (
                            <DropdownMenuItem
                              onClick={() => updateTaskStatus(task.id, 'todo')}
                              className="text-white hover:bg-gray-800"
                            >
                              <Pause className="w-4 h-4 mr-2" />
                              Pausieren
                            </DropdownMenuItem>
                          )}
                          {task.status !== 'completed' && (
                            <DropdownMenuItem
                              onClick={() => updateTaskStatus(task.id, 'cancelled')}
                              className="text-white hover:bg-gray-800"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Abbrechen
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator className="bg-gray-700" />
                          <DropdownMenuItem className="text-red-400 hover:bg-gray-800">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ModernCard>

      {/* Create Task Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Neue Aufgabe erstellen</DialogTitle>
            <DialogDescription className="text-white/70">
              Erstellen Sie eine neue Aufgabe mit allen relevanten Details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Titel *</Label>
              <Input
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                placeholder="Was muss erledigt werden?"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <div>
              <Label>Beschreibung</Label>
              <Textarea
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                placeholder="Zusätzliche Details zur Aufgabe..."
                className="bg-white/10 border-white/20 text-white"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priorität</Label>
                <Select value={newTask.priority} onValueChange={(value: Task['priority']) => setNewTask({...newTask, priority: value})}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="low">Niedrig</SelectItem>
                    <SelectItem value="medium">Mittel</SelectItem>
                    <SelectItem value="high">Hoch</SelectItem>
                    <SelectItem value="urgent">Dringend</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Geschätzte Stunden</Label>
                <Input
                  type="number"
                  value={newTask.estimated_hours}
                  onChange={(e) => setNewTask({...newTask, estimated_hours: parseInt(e.target.value) || 0})}
                  min="0"
                  step="0.5"
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
            </div>

            <div>
              <Label>Fälligkeitsdatum</Label>
              <Input
                type="datetime-local"
                value={newTask.due_date}
                onChange={(e) => setNewTask({...newTask, due_date: e.target.value})}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Abbrechen
            </Button>
            <Button onClick={createTask} disabled={!newTask.title.trim()}>
              Aufgabe erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  if (noLayout) {
    return content;
  }

  return (
    <PageLayout
      title={pageTitle}
      description={pageDescription}
      showSearch
      searchPlaceholder="Aufgaben durchsuchen..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      showFilter
      metadata={{
        count: filteredTasks.length,
        label: 'Aufgaben',
        status: stats.urgent > 0 ? `${stats.urgent} dringend` : 'Alle aktuell'
      }}
      actions={[
        {
          icon: Plus,
          label: 'Neue Aufgabe',
          onClick: () => setShowCreateModal(true)
        }
      ]}
    >
      {content}
    </PageLayout>
  );
}