'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Calendar,
  Clock,
  User,
  Building,
  Mail,
  Flag,
  Trash2,
  Save,
  X
} from 'lucide-react';
import { formatUserDate } from '@/lib/user-utils';

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

interface Customer {
  id: string;
  company_name: string;
  contact_person: string;
}

interface ContactRequest {
  id: string;
  subject: string;
  status: string;
}

interface User {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
}

interface TaskModalProps {
  task?: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated?: (task: Task) => void;
  onTaskCreated?: (task: Task) => void;
  onTaskDeleted?: () => void;
}

export function TaskModal({
  task,
  open,
  onOpenChange,
  onTaskUpdated,
  onTaskCreated,
  onTaskDeleted
}: TaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    status: 'todo' as Task['status'],
    assigned_to: '',
    customer_id: '',
    contact_request_id: '',
    due_date: '',
    estimated_hours: '',
    actual_hours: '',
    progress_percentage: ''
  });

  const isEditing = !!task;

  useEffect(() => {
    if (open) {
      loadSelectOptions();
      if (task) {
        setFormData({
          title: task.title,
          description: task.description || '',
          priority: task.priority,
          status: task.status,
          assigned_to: task.assigned_to || '',
          customer_id: task.customer_id || '',
          contact_request_id: task.contact_request_id || '',
          due_date: task.due_date ? task.due_date.split('T')[0] : '',
          estimated_hours: task.estimated_hours?.toString() || '',
          actual_hours: task.actual_hours?.toString() || '',
          progress_percentage: task.progress_percentage?.toString() || ''
        });
      } else {
        // Reset form for new task
        setFormData({
          title: '',
          description: '',
          priority: 'medium',
          status: 'todo',
          assigned_to: '',
          customer_id: '',
          contact_request_id: '',
          due_date: '',
          estimated_hours: '',
          actual_hours: '',
          progress_percentage: ''
        });
      }
    }
  }, [open, task]);

  const loadSelectOptions = async () => {
    try {
      const [customersRes, requestsRes, employeesRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/requests/unassigned'),
        fetch('/api/users?role=employee')
      ]);

      if (customersRes.ok) {
        const { customers } = await customersRes.json();
        setCustomers(customers || []);
      }

      if (requestsRes.ok) {
        const { requests } = await requestsRes.json();
        setRequests(requests || []);
      }

      if (employeesRes.ok) {
        const { users } = await employeesRes.json();
        setEmployees(users || []);
      }
    } catch (error) {
      console.error('Error loading select options:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setLoading(true);
    try {
      const submitData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        priority: formData.priority,
        status: formData.status,
        assigned_to: formData.assigned_to || undefined,
        customer_id: formData.customer_id || undefined,
        contact_request_id: formData.contact_request_id || undefined,
        due_date: formData.due_date || undefined,
        estimated_hours: formData.estimated_hours ? Number(formData.estimated_hours) : undefined,
        actual_hours: formData.actual_hours ? Number(formData.actual_hours) : undefined,
        progress_percentage: formData.progress_percentage ? Number(formData.progress_percentage) : undefined
      };

      if (isEditing && task) {
        // Update existing task
        const response = await fetch(`/api/tasks/${task.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData),
        });

        if (response.ok) {
          const { task: updatedTask } = await response.json();
          onTaskUpdated?.(updatedTask);
          onOpenChange(false);
        } else {
          const error = await response.json();
          alert('Fehler beim Aktualisieren: ' + error.error);
        }
      } else {
        // Create new task
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData),
        });

        if (response.ok) {
          const { id } = await response.json();
          // Fetch the created task with relations
          const taskResponse = await fetch(`/api/tasks/${id}`);
          if (taskResponse.ok) {
            const { task: newTask } = await taskResponse.json();
            onTaskCreated?.(newTask);
            onOpenChange(false);
          }
        } else {
          const error = await response.json();
          alert('Fehler beim Erstellen: ' + error.error);
        }
      }
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Fehler beim Speichern der Aufgabe');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task || !confirm('Aufgabe wirklich löschen?')) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onTaskDeleted?.();
      } else {
        const error = await response.json();
        alert('Fehler beim Löschen: ' + error.error);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Fehler beim Löschen der Aufgabe');
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (user: User) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.email;
  };

  const priorityOptions = [
    { value: 'low', label: 'Niedrig', color: 'text-green-500' },
    { value: 'medium', label: 'Mittel', color: 'text-yellow-500' },
    { value: 'high', label: 'Hoch', color: 'text-orange-500' },
    { value: 'urgent', label: 'Dringend', color: 'text-red-500' }
  ];

  const statusOptions = [
    { value: 'todo', label: 'Zu erledigen' },
    { value: 'pending', label: 'Ausstehend' },
    { value: 'in_progress', label: 'In Bearbeitung' },
    { value: 'completed', label: 'Abgeschlossen' },
    { value: 'done', label: 'Fertig' },
    { value: 'cancelled', label: 'Abgebrochen' },
    { value: 'blocked', label: 'Blockiert' }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-gray-900 border-gray-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{isEditing ? 'Aufgabe bearbeiten' : 'Neue Aufgabe erstellen'}</span>
            {isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={loading}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </DialogTitle>
          {isEditing && task && (
            <DialogDescription className="text-gray-400">
              Erstellt {formatUserDate(task.created_at)}
              {task.creator && (
                <span> von {getUserName(task.creator)}</span>
              )}
            </DialogDescription>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="title" className="text-white">Titel *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Aufgabentitel eingeben..."
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                required
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-white">Beschreibung</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detaillierte Beschreibung..."
                rows={3}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
          </div>

          {/* Priority and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white">Priorität</Label>
              <Select value={formData.priority} onValueChange={(value) =>
                setFormData(prev => ({ ...prev, priority: value as Task['priority'] }))
              }>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  {priorityOptions.map(option => (
                    <SelectItem key={option.value} value={option.value} className="text-white hover:bg-gray-800">
                      <div className="flex items-center gap-2">
                        <Flag className={`w-3 h-3 ${option.color}`} />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isEditing && (
              <div>
                <Label className="text-white">Status</Label>
                <Select value={formData.status} onValueChange={(value) =>
                  setFormData(prev => ({ ...prev, status: value as Task['status'] }))
                }>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value} className="text-white hover:bg-gray-800">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Assignment */}
          <div>
            <Label className="text-white">Zugewiesen an</Label>
            <Select value={formData.assigned_to || 'none'} onValueChange={(value) =>
              setFormData(prev => ({ ...prev, assigned_to: value === 'none' ? '' : value }))
            }>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Mitarbeiter auswählen..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                <SelectItem value="none" className="text-white hover:bg-gray-800">
                  Nicht zugewiesen
                </SelectItem>
                {employees.map(employee => (
                  <SelectItem key={employee.id} value={employee.id} className="text-white hover:bg-gray-800">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-4 h-4">
                        <AvatarFallback className="text-xs bg-white/20 text-white">
                          {getUserName(employee).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {getUserName(employee)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Customer and Request Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-white">Kunde</Label>
              <Select value={formData.customer_id || 'none'} onValueChange={(value) =>
                setFormData(prev => ({ ...prev, customer_id: value === 'none' ? '' : value }))
              }>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Kunde auswählen..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="none" className="text-white hover:bg-gray-800">
                    Kein Kunde
                  </SelectItem>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id} className="text-white hover:bg-gray-800">
                      <div className="flex items-center gap-2">
                        <Building className="w-3 h-3" />
                        {customer.company_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white">Verknüpfte Anfrage</Label>
              <Select value={formData.contact_request_id || 'none'} onValueChange={(value) =>
                setFormData(prev => ({ ...prev, contact_request_id: value === 'none' ? '' : value }))
              }>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Anfrage auswählen..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="none" className="text-white hover:bg-gray-800">
                    Keine Anfrage
                  </SelectItem>
                  {requests.map(request => (
                    <SelectItem key={request.id} value={request.id} className="text-white hover:bg-gray-800">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{request.subject}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Time and Progress */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="due_date" className="text-white">Fälligkeitsdatum</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <div>
              <Label htmlFor="estimated_hours" className="text-white">Geschätzte Stunden</Label>
              <Input
                id="estimated_hours"
                type="number"
                min="0"
                step="0.5"
                value={formData.estimated_hours}
                onChange={(e) => setFormData(prev => ({ ...prev, estimated_hours: e.target.value }))}
                placeholder="0"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            {isEditing && (
              <div>
                <Label htmlFor="actual_hours" className="text-white">Tatsächliche Stunden</Label>
                <Input
                  id="actual_hours"
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.actual_hours}
                  onChange={(e) => setFormData(prev => ({ ...prev, actual_hours: e.target.value }))}
                  placeholder="0"
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
            )}
          </div>

          {isEditing && (
            <div>
              <Label htmlFor="progress_percentage" className="text-white">Fortschritt (%)</Label>
              <Input
                id="progress_percentage"
                type="number"
                min="0"
                max="100"
                value={formData.progress_percentage}
                onChange={(e) => setFormData(prev => ({ ...prev, progress_percentage: e.target.value }))}
                placeholder="0"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <X className="w-4 h-4 mr-2" />
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.title.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Speichern...' : (isEditing ? 'Aktualisieren' : 'Erstellen')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
