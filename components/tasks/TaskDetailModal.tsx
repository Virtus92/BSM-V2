'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Target,
  Flag,
  Calendar,
  Clock,
  User,
  Users,
  Building,
  MessageSquare,
  Loader2,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  FileText,
  Edit,
  Save,
  X,
  Link as LinkIcon,
  Plus
} from 'lucide-react';
import { RequestDetailModal } from '@/components/requests/RequestDetailModal';
import { CustomerDetailModal } from '@/components/crm/CustomerDetailModal';

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

interface Employee {
  id: string;
  name: string;
  email: string;
}

interface Customer {
  id: string;
  company_name: string;
  contact_person: string;
}

interface ContactRequest {
  id: string;
  subject: string;
  status: string;
  priority: string;
}

interface TaskDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskData | null;
  employees: Employee[];
  onTaskUpdated: () => void;
  onTaskChanged?: (updatedTask: TaskData) => void;
}

export function TaskDetailModal({ open, onOpenChange, task, employees, onTaskUpdated, onTaskChanged }: TaskDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [requestModalId, setRequestModalId] = useState<string | null>(null);
  const [customerModalId, setCustomerModalId] = useState<string | null>(null);

  // Debug log when component receives props
  console.log('TaskDetailModal rendered with:', { open, task: task?.id || 'null', isEditing });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo' as TaskData['status'],
    priority: 'medium' as TaskData['priority'],
    due_date: '',
    assigned_to: null as string | null,
    estimated_hours: '',
    actual_hours: '',
    progress_percentage: '',
    customer_id: null as string | null,
    contact_request_id: null as string | null
  });

  // Load data when modal opens
  useEffect(() => {
    if (open && task) {
      try {
        const formatDueDate = (dateStr: string | null | undefined) => {
          if (!dateStr) return '';
          try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '';
            return date.toISOString().slice(0, 16);
          } catch {
            return '';
          }
        };

        setFormData({
          title: task.title || '',
          description: task.description || '',
          status: task.status,
          priority: task.priority,
          due_date: formatDueDate(task.due_date),
          assigned_to: task.assigned_to || null,
          estimated_hours: task.estimated_hours?.toString() || '',
          actual_hours: task.actual_hours?.toString() || '',
          progress_percentage: task.progress_percentage?.toString() || '',
          customer_id: task.customer_id || null,
          contact_request_id: task.contact_request_id || null
        });
        loadSelectOptions();
      } catch (error) {
        console.error('Error setting form data:', error);
      }
    }
  }, [open, task]);

  const loadSelectOptions = async () => {
    console.log('loadSelectOptions called'); // Debug log
    try {
      // Load current user info via admin API (will return current user among results)
      try {
        console.log('Loading current user...'); // Debug log
        const userResponse = await fetch('/api/admin/users?limit=1');
        console.log('User response status:', userResponse.status); // Debug log
        if (userResponse.ok) {
          const userData = await userResponse.json();
          console.log('User data:', userData); // Debug log
          // For now, we'll get the current user ID from the first admin/employee response
          // In a real app, this would come from an auth context
          if (userData.users && userData.users.length > 0) {
            setCurrentUserId(userData.users[0].id);
            console.log('Set current user ID:', userData.users[0].id); // Debug log
          }
        }
      } catch (userError) {
        console.error('Error loading current user:', userError);
      }

      // Employees are now passed as props, no need to load them here
      console.log('Modal received employees:', employees);

      // Load customers
      try {
        const custResponse = await fetch('/api/customers?limit=100');
        if (custResponse.ok) {
          const custData = await custResponse.json();
          console.log('Loaded customers:', custData); // Debug log
          setCustomers(custData.customers || []);
        }
      } catch (custError) {
        console.error('Error loading customers:', custError);
      }

      // Load all requests (simple query without complex joins) for display purposes
      try {
        // Use admin client directly to avoid complex joins
        const reqResponse = await fetch('/api/contact/simple?limit=100');
        if (reqResponse.ok) {
          const reqData = await reqResponse.json();
          console.log('Loaded requests:', reqData); // Debug log
          let list: ContactRequest[] = reqData.requests || [];
          // Ensure the currently linked request is present
          if (task?.contact_request_id && !list.some(r => r.id === task.contact_request_id)) {
            try {
              const detail = await fetch(`/api/requests/${task.contact_request_id}`);
              if (detail.ok) {
                const d = await detail.json();
                const cr = d.request ? { id: d.request.id, subject: d.request.subject, status: d.request.status, priority: d.request.priority } : null;
                if (cr) list = [cr, ...list];
              } else if (detail.status === 404) {
                const alt = await fetch(`/api/contact/${task.contact_request_id}`);
                if (alt.ok) {
                  const d = await alt.json();
                  const cr = d.request ? { id: d.request.id, subject: d.request.subject, status: d.request.status, priority: d.request.priority } : null;
                  if (cr) list = [cr, ...list];
                }
              }
            } catch {}
          }
          setRequests(list);
        } else {
          // Fallback: load unassigned requests only if simple endpoint doesn't exist
          console.log('Fallback: loading unassigned requests only');
          const fallbackResponse = await fetch('/api/requests?unassigned=true&limit=100');
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            let list: ContactRequest[] = fallbackData.requests || [];
            if (task?.contact_request_id && !list.some(r => r.id === task.contact_request_id)) {
              try {
                const detail = await fetch(`/api/requests/${task.contact_request_id}`);
                if (detail.ok) {
                  const d = await detail.json();
                  const cr = d.request ? { id: d.request.id, subject: d.request.subject, status: d.request.status, priority: d.request.priority } : null;
                  if (cr) list = [cr, ...list];
                }
              } catch {}
            }
            setRequests(list);
          }
        }
      } catch (reqError) {
        console.error('Error loading requests:', reqError);
      }
    } catch (error) {
      console.error('Error in loadSelectOptions:', error);
    }
  };

  const handleSave = async () => {
    if (!task) return;

    // Validate required fields
    if (!formData.title.trim()) {
      alert('Titel ist erforderlich');
      return;
    }

    setLoading(true);
    try {
      const updateData: any = {
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        status: formData.status,
        priority: formData.priority,
        due_date: formData.due_date || null,
        assigned_to: formData.assigned_to || null,
        estimated_hours: formData.estimated_hours ? Number(formData.estimated_hours) : null,
        actual_hours: formData.actual_hours ? Number(formData.actual_hours) : null,
        progress_percentage: formData.progress_percentage ? Number(formData.progress_percentage) : null,
        customer_id: formData.customer_id || null,
        contact_request_id: formData.contact_request_id || null
      };

      console.log('Saving task with data:', updateData); // Debug log

      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Task saved successfully:', result); // Debug log
        setIsEditing(false);
        // Update the parent with the new task data
        if (result.task && onTaskChanged) {
          onTaskChanged(result.task);
        }
        // Refresh the task list to show updated data
        onTaskUpdated();
        onOpenChange(false);
      } else {
        const errorData = await response.json();
        console.error('Save error response:', errorData); // Debug log
        alert('Fehler beim Speichern: ' + (errorData.error || 'Unbekannter Fehler'));
      }
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Fehler beim Speichern der Aufgabe: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (action: string, value?: string) => {
    if (!task) return;

    setLoading(true);
    try {
      let updateData: any = {};

      switch (action) {
        case 'assign-employee':
          if (!value) {
            setLoading(false);
            alert('Bitte wählen Sie einen Mitarbeiter aus');
            return;
          }
          updateData.assigned_to = value;
          break;
        case 'assign-customer':
          updateData.customer_id = value === 'none' ? null : value;
          break;
        case 'assign-request':
          updateData.contact_request_id = value === 'none' ? null : value;
          break;
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
        default:
          setLoading(false);
          console.error('Unknown action:', action);
          return;
      }

      console.log('Quick action:', action, 'with data:', updateData); // Debug log

      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Quick action successful:', result); // Debug log
        // Update the parent with the new task data
        if (result.task && onTaskChanged) {
          onTaskChanged(result.task);
        }
        // Refresh the task list to show updated data
        onTaskUpdated();
        // Keep modal open for quick actions, close only for status complete
        if (action === 'complete') {
          onOpenChange(false);
        }
      } else {
        const errorData = await response.json();
        console.error('Quick action error response:', errorData); // Debug log
        alert('Fehler bei der Aktion: ' + (errorData.error || 'Unbekannter Fehler'));
      }
    } catch (error) {
      console.error('Quick action error:', error);
      alert('Fehler bei der Aktion: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    } finally {
      setLoading(false);
    }
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

  if (!task) {
    console.log('TaskDetailModal: task is null, returning null');
    return null;
  }

  const statusInfo = getStatusInfo(task.status);
  const priorityInfo = getPriorityInfo(task.priority);
  const StatusIcon = statusInfo.icon;
  const PriorityIcon = priorityInfo.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            {isEditing ? 'Aufgabe bearbeiten' : task.title}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Bearbeiten Sie die Aufgabendetails und speichern Sie Ihre Änderungen.' : 'Aufgabendetails anzeigen und Quick Actions ausführen.'}
          </DialogDescription>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className={statusInfo.color}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusInfo.label}
            </Badge>
            <Badge variant="outline" className={priorityInfo.color}>
              <PriorityIcon className="w-3 h-3 mr-1" />
              {priorityInfo.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {!isEditing ? (
            /* View Mode */
            <div className="space-y-4">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    <Select onValueChange={(value) => handleQuickAction('assign-employee', value)}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Mitarbeiter zuweisen" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map(emp => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select onValueChange={(value) => handleQuickAction('assign-customer', value)}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Kunde zuweisen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Kein Kunde</SelectItem>
                        {customers.map(customer => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.company_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select onValueChange={(value) => handleQuickAction('assign-request', value)}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Anfrage zuweisen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Keine Anfrage</SelectItem>
                        {requests.map(request => (
                          <SelectItem key={request.id} value={request.id}>
                            {request.subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status and Priority Actions */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                    {task.status === 'todo' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickAction('start')}
                        disabled={loading}
                      >
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Starten
                      </Button>
                    )}
                    {task.status !== 'done' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickAction('complete')}
                        disabled={loading}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Erledigen
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAction('priority-high')}
                      disabled={loading}
                    >
                      <Flag className="w-3 h-3 mr-1" />
                      Priorität ↑
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      disabled={loading}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Bearbeiten
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Task Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {task.description && (
                    <div>
                      <Label className="text-sm font-medium">Beschreibung</Label>
                      <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {task.due_date && (
                      <div>
                        <Label className="text-sm font-medium">Fälligkeitsdatum</Label>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {new Date(task.due_date).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    )}

                    {task.estimated_hours && (
                      <div>
                        <Label className="text-sm font-medium">Geschätzte Stunden</Label>
                        <p className="mt-1 text-sm text-muted-foreground">{task.estimated_hours}h</p>
                      </div>
                    )}

                    {task.progress_percentage !== null && (
                      <div>
                        <Label className="text-sm font-medium">Fortschritt</Label>
                        <div className="mt-1">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${task.progress_percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground">{task.progress_percentage}%</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Linked Entities */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    Verknüpfungen
                  </CardTitle>
                </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Mitarbeiter</Label>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {task.assigned_to ? employees.find(emp => emp.id === task.assigned_to)?.name || 'Zugewiesen' : 'Nicht zugewiesen'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Kunde</Label>
                    {task.customer_id ? (
                      <button
                        type="button"
                        className="mt-1 text-sm text-blue-400 hover:text-blue-300 underline-offset-2 hover:underline"
                        onClick={(e) => { e.stopPropagation(); setCustomerModalId(task.customer_id!); }}
                      >
                        {(() => {
                          const found = customers.find(customer => customer.id === task.customer_id);
                          return found?.company_name || 'Kunde ansehen';
                        })()}
                      </button>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">Nicht verknüpft</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium">Anfrage</Label>
                    {task.contact_request_id ? (
                      <button
                        type="button"
                        className="mt-1 text-sm text-blue-400 hover:text-blue-300 underline-offset-2 hover:underline"
                        onClick={(e) => { e.stopPropagation(); setRequestModalId(task.contact_request_id!); }}
                      >
                        {(() => {
                          const found = requests.find(request => request.id === task.contact_request_id);
                          return found?.subject || 'Anfrage ansehen';
                        })()}
                      </button>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">Nicht verknüpft</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>
          ) : (
            /* Edit Mode */
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titel</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">Offen</SelectItem>
                      <SelectItem value="in_progress">In Bearbeitung</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="done">Abgeschlossen</SelectItem>
                      <SelectItem value="blocked">Blockiert</SelectItem>
                      <SelectItem value="cancelled">Abgebrochen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priorität</Label>
                  <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Niedrig</SelectItem>
                      <SelectItem value="medium">Mittel</SelectItem>
                      <SelectItem value="high">Hoch</SelectItem>
                      <SelectItem value="urgent">Dringend</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assigned_to">Zugewiesen an</Label>
                  <Select value={formData.assigned_to || "unassigned"} onValueChange={(value) => setFormData({ ...formData, assigned_to: value === "unassigned" ? null : value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Mitarbeiter auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Nicht zugewiesen</SelectItem>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer_id">Kunde</Label>
                  <Select value={formData.customer_id || "none"} onValueChange={(value) => setFormData({ ...formData, customer_id: value === "none" ? null : value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kunde auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Kein Kunde</SelectItem>
                      {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.company_name} - {customer.contact_person}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_request_id">Anfrage</Label>
                  <Select value={formData.contact_request_id || "none"} onValueChange={(value) => setFormData({ ...formData, contact_request_id: value === "none" ? null : value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Anfrage auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Keine Anfrage</SelectItem>
                      {requests.map(request => (
                        <SelectItem key={request.id} value={request.id}>
                          {request.subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="due_date">Fälligkeitsdatum</Label>
                  <Input
                    id="due_date"
                    type="datetime-local"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimated_hours">Geschätzte Stunden</Label>
                  <Input
                    id="estimated_hours"
                    type="number"
                    value={formData.estimated_hours}
                    onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actual_hours">Tatsächliche Stunden</Label>
                  <Input
                    id="actual_hours"
                    type="number"
                    value={formData.actual_hours}
                    onChange={(e) => setFormData({ ...formData, actual_hours: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="progress_percentage">Fortschritt (%)</Label>
                  <Input
                    id="progress_percentage"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.progress_percentage}
                    onChange={(e) => setFormData({ ...formData, progress_percentage: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {isEditing ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                <X className="w-4 h-4 mr-2" />
                Abbrechen
              </Button>
              <Button onClick={handleSave} disabled={loading || !formData.title.trim()}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Save className="w-4 h-4 mr-2" />
                Speichern
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Schließen
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
      <RequestDetailModal
        open={!!requestModalId}
        onOpenChange={(open) => !open && setRequestModalId(null)}
        requestId={requestModalId}
        onUpdated={() => { /* optional refresh callback */ }}
        canAssign={false}
      />
      <CustomerDetailModal
        open={!!customerModalId}
        onOpenChange={(open) => !open && setCustomerModalId(null)}
        customerId={customerModalId}
        onUpdated={() => { /* optional refresh callback */ }}
        canAssign={false}
      />
    </Dialog>
  );
}
