'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Clock,
  Calendar,
  User,
  Building,
  Mail,
  Flag,
  Target,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Link as LinkIcon,
  TrendingUp,
  FileText,
  Plus,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { TaskModal } from './TaskModal';
import { TaskCommentSection } from './TaskCommentSection';
import { formatUserDate, getUserDisplayName } from '@/lib/user-utils';

interface TaskDetailViewProps {
  task: any;
  currentUser: any;
  currentUserProfile: any;
  comments: any[];
  relatedTasks: any[];
  activityLogs: any[];
  availableUsers: any[];
  availableCustomers: any[];
  availableRequests: any[];
  canEdit: boolean;
  canDelete: boolean;
}

export function TaskDetailView({
  task,
  currentUser,
  currentUserProfile,
  comments,
  relatedTasks,
  activityLogs,
  availableUsers,
  availableCustomers,
  availableRequests,
  canEdit,
  canDelete
}: TaskDetailViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Task status mapping
  const getTaskStatusInfo = (status: string) => {
    switch (status) {
      case 'todo':
        return { label: 'Offen', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: Clock };
      case 'in_progress':
        return { label: 'In Bearbeitung', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: TrendingUp };
      case 'done':
        return { label: 'Abgeschlossen', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle };
      case 'cancelled':
        return { label: 'Abgebrochen', color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: AlertTriangle };
      default:
        return { label: 'Unbekannt', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20', icon: AlertTriangle };
    }
  };

  const getTaskPriorityInfo = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { label: 'Dringend', color: 'bg-red-600/10 text-red-600 border-red-600/20', icon: Flag };
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

  const statusInfo = getTaskStatusInfo(task.status);
  const priorityInfo = getTaskPriorityInfo(task.priority);
  const StatusIcon = statusInfo.icon;
  const PriorityIcon = priorityInfo.icon;

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
  const daysUntilDue = task.due_date
    ? Math.ceil((new Date(task.due_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
    : null;

  const handleDelete = async () => {
    if (!confirm('Aufgabe wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Erfolg',
          description: 'Aufgabe wurde gelöscht.',
        });
        router.push('/dashboard/tasks');
      } else {
        const error = await response.json();
        toast({
          title: 'Fehler',
          description: error.error || 'Fehler beim Löschen der Aufgabe.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Fehler',
        description: 'Fehler beim Löschen der Aufgabe.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleTaskUpdated = () => {
    // Refresh the page to get updated data
    router.refresh();
    setEditModalOpen(false);
    toast({
      title: 'Erfolg',
      description: 'Aufgabe wurde aktualisiert.',
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="fade-in-up">
        <div className="flex items-center justify-between mb-4">
          <Link href="/dashboard/tasks">
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Zurück zu Aufgaben
            </Button>
          </Link>

          {canEdit && (
            <div className="flex gap-2">
              <Button
                onClick={() => setEditModalOpen(true)}
                size="sm"
                className="mystery-button h-8"
              >
                <Edit className="w-4 h-4 mr-2" />
                Bearbeiten
              </Button>
              {canDelete && (
                <Button
                  onClick={handleDelete}
                  disabled={deleting}
                  variant="destructive"
                  size="sm"
                  className="h-8"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleting ? 'Löschen...' : 'Löschen'}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Title Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight break-words">
                {task.title}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Aufgabe #{task.id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={statusInfo.color}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusInfo.label}
            </Badge>
            <Badge variant="outline" className={priorityInfo.color}>
              <PriorityIcon className="w-3 h-3 mr-1" />
              {priorityInfo.label}
            </Badge>
            {isOverdue && (
              <Badge variant="destructive">
                Überfällig
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 fade-in-up">
        <Card className="modern-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Erstellt</div>
                <div className="text-xs text-muted-foreground">{formatUserDate(task.created_at)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {task.due_date && (
          <Card className="modern-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Fällig</div>
                  <div className={`text-xs ${isOverdue ? 'text-red-400' : daysUntilDue && daysUntilDue <= 3 ? 'text-yellow-400' : 'text-muted-foreground'}`}>
                    {formatUserDate(task.due_date)}
                    {daysUntilDue !== null && (
                      <span className="ml-1">
                        ({daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} Tage überfällig` :
                          daysUntilDue === 0 ? 'Heute' :
                          `${daysUntilDue} Tage`})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {task.estimated_hours && (
          <Card className="modern-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Geschätzt</div>
                  <div className="text-xs text-muted-foreground">{task.estimated_hours}h</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {task.progress_percentage !== null && (
          <Card className="modern-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm font-medium">Fortschritt</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={task.progress_percentage} className="flex-1 h-2" />
                    <span className="text-xs text-muted-foreground">{task.progress_percentage}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in-up">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">

          {/* Description */}
          {task.description && (
            <Card className="modern-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Beschreibung
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-foreground">
                  <p className="whitespace-pre-wrap leading-relaxed">{task.description}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Linked Entities */}
          {(task.customers || task.contact_requests) && (
            <Card className="modern-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="w-5 h-5" />
                  Verknüpfte Elemente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {task.customers && (
                  <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{task.customers.company_name}</div>
                        <div className="text-sm text-muted-foreground">{task.customers.contact_person}</div>
                      </div>
                    </div>
                    <Link href={`/dashboard/crm/${task.customers.id}`}>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                )}

                {task.contact_requests && (
                  <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{task.contact_requests.subject}</div>
                        <div className="text-sm text-muted-foreground">
                          Anfrage von {task.contact_requests.name}
                        </div>
                      </div>
                    </div>
                    <Link href={`/dashboard/requests/${task.contact_requests.id}`}>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Comments Section */}
          <TaskCommentSection
            taskId={task.id}
            comments={comments}
            currentUser={currentUser}
          />

        </div>

        {/* Sidebar */}
        <div className="space-y-6">

          {/* Assignment Info */}
          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Zuständigkeit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium mb-2">Erstellt von</div>
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs">
                      {getUserDisplayName(task.creator).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{getUserDisplayName(task.creator)}</span>
                </div>
              </div>

              <Separator />

              <div>
                <div className="text-sm font-medium mb-2">Zugewiesen an</div>
                {task.assignee ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">
                        {getUserDisplayName(task.assignee).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{getUserDisplayName(task.assignee)}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Nicht zugewiesen</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Related Tasks */}
          {relatedTasks.length > 0 && (
            <Card className="modern-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Ähnliche Aufgaben
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {relatedTasks.slice(0, 5).map((relatedTask) => (
                  <Link key={relatedTask.id} href={`/dashboard/tasks/${relatedTask.id}`}>
                    <div className="p-2 rounded-lg border hover:bg-background/50 transition-colors">
                      <div className="font-medium text-sm truncate">{relatedTask.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" size="sm" className={getTaskStatusInfo(relatedTask.status).color}>
                          {getTaskStatusInfo(relatedTask.status).label}
                        </Badge>
                        {relatedTask.due_date && (
                          <span className="text-xs text-muted-foreground">
                            {formatUserDate(relatedTask.due_date)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

        </div>
      </div>

      {/* Edit Modal */}
      <TaskModal
        task={task}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onTaskUpdated={handleTaskUpdated}
      />
    </div>
  );
}