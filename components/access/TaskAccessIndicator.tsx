'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAccessInfo } from '@/lib/hooks/useTaskAccess';
import {
  Shield,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface TaskAccessIndicatorProps {
  resourceType: 'customer' | 'contact_request';
  resourceId: string;
  resourceName?: string;
  compact?: boolean;
}

export function TaskAccessIndicator({
  resourceType,
  resourceId,
  resourceName,
  compact = false
}: TaskAccessIndicatorProps) {
  const { hasAccess, loading, accessMessage, accessTasks, accessReason } = useAccessInfo(
    resourceType,
    resourceId
  );

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        {!compact && <span className="text-sm text-muted-foreground">Prüfe Zugriff...</span>}
      </div>
    );
  }

  const getAccessIcon = () => {
    switch (accessReason) {
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'direct_assignment':
        return <User className="w-4 h-4" />;
      case 'task_access':
        return <Clock className="w-4 h-4" />;
      case 'no_access':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getAccessColor = () => {
    switch (accessReason) {
      case 'admin':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'direct_assignment':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'task_access':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'no_access':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-green-500/10 text-green-500 border-green-500/20';
    }
  };

  if (compact) {
    return (
      <Badge variant="outline" className={getAccessColor()}>
        {getAccessIcon()}
        <span className="ml-1">{hasAccess ? 'Zugriff' : 'Kein Zugriff'}</span>
      </Badge>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {getAccessIcon()}
          Zugriffsstatus
          {resourceName && (
            <span className="text-sm font-normal text-muted-foreground">
              - {resourceName}
            </span>
          )}
        </CardTitle>
        <CardDescription>
          {resourceType === 'customer' ? 'Kunde' : 'Kontaktanfrage'} Zugriffsberechtigung
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Badge variant="outline" className={getAccessColor()}>
            {getAccessIcon()}
            <span className="ml-2">{accessMessage}</span>
          </Badge>

          {accessReason === 'task_access' && accessTasks.length > 0 && (
            <div className="mt-3">
              <h4 className="text-sm font-medium mb-2">Aktive Aufgaben:</h4>
              <div className="space-y-1">
                {accessTasks.map((task) => (
                  <div
                    key={task.id}
                    className="text-sm p-2 bg-muted rounded-md flex items-center gap-2"
                  >
                    <Clock className="w-3 h-3" />
                    <span className="flex-1">{task.title}</span>
                    <Badge variant="secondary" className="text-xs">
                      {task.status === 'in_progress' ? 'In Bearbeitung' : task.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {accessReason === 'task_access' && (
            <div className="text-xs text-muted-foreground p-2 bg-orange-50 rounded-md border border-orange-200">
              💡 <strong>Temporärer Zugriff:</strong> Sie haben nur solange Zugriff auf diese{' '}
              {resourceType === 'customer' ? 'Kundendaten' : 'Kontaktanfrage'},
              wie Sie an der/den verknüpften Aufgabe(n) arbeiten.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}