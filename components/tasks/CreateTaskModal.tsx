'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Plus,
  Target,
  Flag,
  Calendar,
  Clock,
  User,
  Loader2,
  AlertTriangle
} from 'lucide-react';

interface CreateTaskModalProps {
  trigger?: React.ReactNode;
}

export function CreateTaskModal({ trigger }: CreateTaskModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    dueDate: '',
    assignedTo: '',
    estimatedHours: '',
    tags: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
          priority: formData.priority,
          dueDate: formData.dueDate || undefined,
          assignedTo: formData.assignedTo || undefined,
          estimatedHours: formData.estimatedHours || undefined,
          tags: formData.tags || undefined,
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Aufgabe konnte nicht erstellt werden');
      }

      // Reset form and close modal
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        assignedTo: '',
        estimatedHours: '',
        tags: '',
      });
      setOpen(false);

      // Refresh page or update task list
      window.location.reload();
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.title.trim() !== '';

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'high':
        return <Flag className="w-4 h-4 text-orange-500" />;
      case 'medium':
        return <Flag className="w-4 h-4 text-yellow-500" />;
      case 'low':
        return <Flag className="w-4 h-4 text-green-500" />;
      default:
        return <Flag className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="mystery-button text-sm w-full md:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Neue Aufgabe
          </Button>
        )}
      </DialogTrigger>
      {/* Load employees when dialog opens */}
      {open && (
        <EmployeesLoader onLoad={setEmployees} />
      )}
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Neue Aufgabe erstellen
          </DialogTitle>
          <DialogDescription>
            Erstellen Sie eine neue Aufgabe und weisen Sie sie einem Mitarbeiter zu.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">

          {/* Basic Task Information */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Aufgabendetails</CardTitle>
              <CardDescription>
                Grundlegende Informationen zur Aufgabe.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Aufgabentitel *</Label>
                <Input
                  id="title"
                  placeholder="Beschreibender Titel der Aufgabe"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  placeholder="Detaillierte Beschreibung der Aufgabe, Anforderungen und erwartete Ergebnisse..."
                  className="min-h-[120px]"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priorität</Label>
                  <Select value={formData.priority} onValueChange={(value: any) => handleInputChange('priority', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Priorität auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">
                        <div className="flex items-center gap-2">
                          <Flag className="w-4 h-4 text-green-500" />
                          <span>Niedrig</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center gap-2">
                          <Flag className="w-4 h-4 text-yellow-500" />
                          <span>Mittel</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="high">
                        <div className="flex items-center gap-2">
                          <Flag className="w-4 h-4 text-orange-500" />
                          <span>Hoch</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="critical">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <span>Kritisch</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedHours">Geschätzte Stunden</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="estimatedHours"
                      type="number"
                      placeholder="8"
                      className="pl-10"
                      value={formData.estimatedHours}
                      onChange={(e) => handleInputChange('estimatedHours', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignment and Timeline */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Zuweisung und Zeitplan</CardTitle>
              <CardDescription>
                Verantwortlichkeiten und Fristen festlegen.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Zugewiesen an</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Select value={formData.assignedTo || 'none'} onValueChange={(value) => handleInputChange('assignedTo', value === 'none' ? '' : value)}>
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="Mitarbeiter auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nicht zugewiesen</SelectItem>
                        {employees.map(e => (
                          <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Fälligkeitsdatum</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="dueDate"
                      type="date"
                      className="pl-10"
                      value={formData.dueDate}
                      onChange={(e) => handleInputChange('dueDate', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (optional)</Label>
                <Input
                  id="tags"
                  placeholder="z.B. frontend, bug-fix, feature"
                  value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Trennen Sie mehrere Tags mit Kommas
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Priority Preview */}
          {formData.priority && (
            <Card className={`border-2 ${getPriorityColor(formData.priority)}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  {getPriorityIcon(formData.priority)}
                  <div className="flex-1">
                    <h4 className="font-medium">
                      Priorität: {
                        formData.priority === 'critical' ? 'Kritisch' :
                        formData.priority === 'high' ? 'Hoch' :
                        formData.priority === 'medium' ? 'Mittel' : 'Niedrig'
                      }
                    </h4>
                    <p className="text-sm opacity-80">
                      {formData.priority === 'critical' && 'Erfordert sofortige Aufmerksamkeit und höchste Priorität.'}
                      {formData.priority === 'high' && 'Wichtige Aufgabe mit hoher Dringlichkeit.'}
                      {formData.priority === 'medium' && 'Normale Geschäftspriorität.'}
                      {formData.priority === 'low' && 'Kann bearbeitet werden, wenn Zeit verfügbar ist.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || loading}
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Aufgabe erstellen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EmployeesLoader({ onLoad }: { onLoad: (v: { id: string; name: string }[]) => void }) {
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch('/api/users?role=employee&limit=100');
        if (!res.ok) return;
        const data = await res.json();
        if (ignore) return;
        const list = data.users || data.data?.users || (Array.isArray(data.data) ? data.data : []);
        const employees = (list || []).map((u: any) => ({
          id: u.id,
          name: [u.first_name ?? u.profile?.first_name, u.last_name ?? u.profile?.last_name].filter(Boolean).join(' ') || u.email || 'Unbekannt'
        }));
        onLoad(employees);
      } catch {
        // ignore
      }
    })();
    return () => { ignore = true };
  }, [onLoad]);
  return null;
}
