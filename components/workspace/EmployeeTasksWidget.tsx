'use client';

import { useState, useEffect } from 'react';
import { ModernCard } from '@/components/shared/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Plus, Clock, Calendar, AlertCircle } from 'lucide-react';
import { formatUserDate } from '@/lib/user-utils';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  estimated_hours?: number;
  progress_percentage?: number;
  created_at: string;
  created_by: string;
  assigned_to?: string;
}

export function EmployeeTasksWidget() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const fetchMyTasks = async () => {
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

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Update local state
        setTasks(prev =>
          prev.map(task =>
            task.id === taskId ? { ...task, status: newStatus as Task['status'] } : task
          )
        );
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Fehler beim Aktualisieren der Aufgabe');
    }
  };

  const activeTasks = tasks.filter(t => ['todo', 'in_progress', 'review', 'blocked'].includes(t.status));
  const urgentTasks = tasks.filter(t => t.priority === 'urgent' && !['done', 'cancelled'].includes(t.status));

  if (loading) {
    return (
      <ModernCard
        title="Meine Aufgaben"
        description="Laden..."
      >
        <p className="text-sm text-white/70">Aufgaben werden geladen...</p>
      </ModernCard>
    );
  }

  return (
    <ModernCard
      title="Meine Aufgaben"
      description="Ihre zugewiesenen und erstellten Aufgaben"
      actions={
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
            {activeTasks.length}
          </Badge>
          {urgentTasks.length > 0 && (
            <Badge variant="destructive">{urgentTasks.length} dringend</Badge>
          )}
        </div>
      }
    >
        {tasks.length === 0 ? (
          <div className="text-center py-6">
            <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">Keine Aufgaben</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Sie haben noch keine Aufgaben zugewiesen bekommen oder erstellt.
            </p>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Erste Aufgabe erstellen
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTasks.slice(0, 5).map((task) => (
              <div key={task.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium truncate">{task.title}</h4>
                      <Badge
                        variant={
                          task.priority === 'urgent' ? 'destructive' :
                          task.priority === 'high' ? 'default' : 'outline'
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
                      <span className="flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{formatUserDate(task.created_at)}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    {task.status === 'todo' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateTaskStatus(task.id, 'in_progress')}
                      >
                        Starten
                      </Button>
                    ) : task.status === 'in_progress' ? (
                      <Button
                        size="sm"
                        onClick={() => updateTaskStatus(task.id, 'done')}
                      >
                        Abschließen
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}

            {activeTasks.length > 5 && (
              <div className="text-center pt-2">
                <Button variant="outline" size="sm">
                  {activeTasks.length - 5} weitere Aufgaben anzeigen
                </Button>
              </div>
            )}

            {activeTasks.length === 0 && tasks.length > 0 && (
              <div className="text-center py-4">
                <CheckSquare className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Alle Aufgaben abgeschlossen! 🎉
                </p>
              </div>
            )}
          </div>
        )}
    </ModernCard>
  );
}
