import {
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  FileText,
  Flag,
  User,
  Calendar,
  Timer
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskData {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string | null;
  created_at: string;
  updated_at?: string | null;
  assigned_to?: string | null;
  created_by: string;
  estimated_hours?: number | null;
  actual_hours?: number | null;
  progress_percentage?: number | null;
  tags?: string[] | null;
}

export interface TaskAssignee {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  avatar_url?: string;
}

export interface StatusInfo {
  label: string;
  color: string;
  icon: LucideIcon;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
}

export interface PriorityInfo {
  label: string;
  color: string;
  icon: LucideIcon;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  urgencyLevel: number; // 1-4 für Sortierung
}

// ============================================================================
// STATUS UTILITIES
// ============================================================================

export const STATUS_CONFIG: Record<TaskStatus, StatusInfo> = {
  todo: {
    label: 'Offen',
    color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    icon: Clock,
    variant: 'outline'
  },
  in_progress: {
    label: 'In Bearbeitung',
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    icon: TrendingUp,
    variant: 'default'
  },
  review: {
    label: 'Review',
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    icon: FileText,
    variant: 'secondary'
  },
  done: {
    label: 'Abgeschlossen',
    color: 'bg-green-500/10 text-green-500 border-green-500/20',
    icon: CheckCircle,
    variant: 'outline'
  },
  cancelled: {
    label: 'Abgebrochen',
    color: 'bg-red-500/10 text-red-500 border-red-500/20',
    icon: AlertTriangle,
    variant: 'destructive'
  },
  blocked: {
    label: 'Blockiert',
    color: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    icon: AlertTriangle,
    variant: 'destructive'
  }
};

export const getStatusInfo = (status: TaskStatus): StatusInfo => {
  return STATUS_CONFIG[status] || STATUS_CONFIG.todo;
};

export const getStatusList = (): Array<{ value: TaskStatus; label: string }> => {
  return Object.entries(STATUS_CONFIG).map(([value, config]) => ({
    value: value as TaskStatus,
    label: config.label
  }));
};

// ============================================================================
// PRIORITY UTILITIES
// ============================================================================

export const PRIORITY_CONFIG: Record<TaskPriority, PriorityInfo> = {
  low: {
    label: 'Niedrig',
    color: 'bg-green-500/10 text-green-500 border-green-500/20',
    icon: Flag,
    variant: 'outline',
    urgencyLevel: 1
  },
  medium: {
    label: 'Mittel',
    color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    icon: Flag,
    variant: 'outline',
    urgencyLevel: 2
  },
  high: {
    label: 'Hoch',
    color: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    icon: Flag,
    variant: 'destructive',
    urgencyLevel: 3
  },
  urgent: {
    label: 'Dringend',
    color: 'bg-red-600/10 text-red-600 border-red-600/20',
    icon: AlertTriangle,
    variant: 'destructive',
    urgencyLevel: 4
  }
};

export const getPriorityInfo = (priority: TaskPriority): PriorityInfo => {
  return PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
};

export const getPriorityList = (): Array<{ value: TaskPriority; label: string }> => {
  return Object.entries(PRIORITY_CONFIG).map(([value, config]) => ({
    value: value as TaskPriority,
    label: config.label
  }));
};

// ============================================================================
// DATE UTILITIES
// ============================================================================

export const isOverdue = (dueDate?: string | null): boolean => {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
};

export const getDaysUntilDue = (dueDate?: string | null): number | null => {
  if (!dueDate) return null;
  const now = new Date();
  const due = new Date(dueDate);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

export const getDueDateStatus = (dueDate?: string | null) => {
  if (!dueDate) return null;

  const daysUntil = getDaysUntilDue(dueDate);
  if (daysUntil === null) return null;

  if (daysUntil < 0) {
    return {
      label: `${Math.abs(daysUntil)} Tage überfällig`,
      color: 'text-red-400',
      urgent: true
    };
  }

  if (daysUntil === 0) {
    return {
      label: 'Heute fällig',
      color: 'text-orange-400',
      urgent: true
    };
  }

  if (daysUntil <= 3) {
    return {
      label: `${daysUntil} Tage verbleibend`,
      color: 'text-yellow-400',
      urgent: true
    };
  }

  return {
    label: `${daysUntil} Tage verbleibend`,
    color: 'text-gray-400',
    urgent: false
  };
};

export const formatTaskDate = (dateString?: string | null, includeTime = false): string => {
  if (!dateString) return 'Kein Datum';

  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }

  return new Date(dateString).toLocaleDateString('de-DE', options);
};

// ============================================================================
// ASSIGNMENT UTILITIES
// ============================================================================

export const getTaskAssigneeDisplayName = (assignee?: TaskAssignee | null): string => {
  if (!assignee) return 'Nicht zugewiesen';

  if (assignee.first_name || assignee.last_name) {
    return `${assignee.first_name || ''} ${assignee.last_name || ''}`.trim();
  }

  return assignee.email || 'Unbekannt';
};

export const getTaskAssigneeInitials = (assignee?: TaskAssignee | null): string => {
  if (!assignee) return '?';

  const name = getTaskAssigneeDisplayName(assignee);
  if (name === 'Nicht zugewiesen' || name === 'Unbekannt') return '?';

  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// ============================================================================
// PROGRESS UTILITIES
// ============================================================================

export const getProgressColor = (percentage?: number | null): string => {
  if (!percentage) return 'bg-gray-200';

  if (percentage < 25) return 'bg-red-500';
  if (percentage < 50) return 'bg-orange-500';
  if (percentage < 75) return 'bg-yellow-500';
  if (percentage < 100) return 'bg-blue-500';
  return 'bg-green-500';
};

export const getProgressText = (percentage?: number | null): string => {
  if (!percentage) return 'Nicht begonnen';

  if (percentage < 25) return 'Begonnen';
  if (percentage < 50) return 'In Arbeit';
  if (percentage < 75) return 'Fortgeschritten';
  if (percentage < 100) return 'Fast fertig';
  return 'Abgeschlossen';
};

// ============================================================================
// TASK STATISTICS
// ============================================================================

export const getTaskStats = (tasks: TaskData[]) => {
  const total = tasks.length;
  const byStatus = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as Record<TaskStatus, number>);

  const byPriority = tasks.reduce((acc, task) => {
    acc[task.priority] = (acc[task.priority] || 0) + 1;
    return acc;
  }, {} as Record<TaskPriority, number>);

  const overdue = tasks.filter(task => isOverdue(task.due_date)).length;
  const dueToday = tasks.filter(task => getDaysUntilDue(task.due_date) === 0).length;
  const dueSoon = tasks.filter(task => {
    const days = getDaysUntilDue(task.due_date);
    return days !== null && days > 0 && days <= 3;
  }).length;

  return {
    total,
    byStatus,
    byPriority,
    overdue,
    dueToday,
    dueSoon,
    completed: byStatus.done || 0,
    inProgress: byStatus.in_progress || 0,
    pending: byStatus.todo || 0
  };
};

// ============================================================================
// SORTING UTILITIES
// ============================================================================

export const sortTasksByPriority = (tasks: TaskData[]): TaskData[] => {
  return [...tasks].sort((a, b) => {
    const priorityA = getPriorityInfo(a.priority).urgencyLevel;
    const priorityB = getPriorityInfo(b.priority).urgencyLevel;
    return priorityB - priorityA; // Höhere Priorität zuerst
  });
};

export const sortTasksByDueDate = (tasks: TaskData[]): TaskData[] => {
  return [...tasks].sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1; // Tasks ohne Datum ans Ende
    if (!b.due_date) return -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });
};

export const sortTasksByStatus = (tasks: TaskData[]): TaskData[] => {
  const statusOrder: TaskStatus[] = ['todo', 'in_progress', 'review', 'blocked', 'done', 'cancelled'];

  return [...tasks].sort((a, b) => {
    const indexA = statusOrder.indexOf(a.status);
    const indexB = statusOrder.indexOf(b.status);
    return indexA - indexB;
  });
};

// ============================================================================
// FILTER UTILITIES
// ============================================================================

export const filterTasksByStatus = (tasks: TaskData[], statuses: TaskStatus[]): TaskData[] => {
  if (statuses.length === 0) return tasks;
  return tasks.filter(task => statuses.includes(task.status));
};

export const filterTasksByPriority = (tasks: TaskData[], priorities: TaskPriority[]): TaskData[] => {
  if (priorities.length === 0) return tasks;
  return tasks.filter(task => priorities.includes(task.priority));
};

export const filterTasksByAssignee = (tasks: TaskData[], assigneeIds: string[]): TaskData[] => {
  if (assigneeIds.length === 0) return tasks;
  return tasks.filter(task =>
    task.assigned_to && assigneeIds.includes(task.assigned_to)
  );
};

export const filterTasksBySearch = (tasks: TaskData[], searchTerm: string): TaskData[] => {
  if (!searchTerm.trim()) return tasks;

  const term = searchTerm.toLowerCase();
  return tasks.filter(task =>
    task.title.toLowerCase().includes(term) ||
    task.description?.toLowerCase().includes(term) ||
    task.tags?.some(tag => tag.toLowerCase().includes(term))
  );
};

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

export const validateTaskData = (data: Partial<TaskData>) => {
  const errors: string[] = [];

  if (!data.title?.trim()) {
    errors.push('Titel ist erforderlich');
  }

  if (data.title && data.title.length > 255) {
    errors.push('Titel darf maximal 255 Zeichen lang sein');
  }

  if (data.estimated_hours && (data.estimated_hours < 0 || data.estimated_hours > 999)) {
    errors.push('Geschätzte Stunden müssen zwischen 0 und 999 liegen');
  }

  if (data.progress_percentage && (data.progress_percentage < 0 || data.progress_percentage > 100)) {
    errors.push('Fortschritt muss zwischen 0 und 100% liegen');
  }

  if (data.due_date && new Date(data.due_date) < new Date('1900-01-01')) {
    errors.push('Fälligkeitsdatum ist ungültig');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};