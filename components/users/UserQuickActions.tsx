'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  Target,
  UserPlus,
  MessageSquare,
  Mail,
  Phone,
  Calendar,
  ExternalLink,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { TaskModal } from '@/components/tasks/TaskModal';

interface UserQuickActionsProps {
  user: any;
  canCreateTasks?: boolean;
  canAssignRequests?: boolean;
}

export function UserQuickActions({
  user,
  canCreateTasks = true,
  canAssignRequests = true
}: UserQuickActionsProps) {
  const { toast } = useToast();
  const [showTaskModal, setShowTaskModal] = useState(false);

  const handleTaskCreated = () => {
    setShowTaskModal(false);
    toast({
      title: 'Erfolg',
      description: 'Aufgabe wurde erstellt und zugewiesen.',
    });
    // Refresh the page to show new task
    window.location.reload();
  };

  return (
    <Card className="modern-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Schnellaktionen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Create Task for User */}
        {canCreateTasks && (
          <Button
            onClick={() => setShowTaskModal(true)}
            className="w-full justify-start mystery-button"
            size="sm"
          >
            <Target className="w-4 h-4 mr-2" />
            Neue Aufgabe zuweisen
          </Button>
        )}

        {/* Email User */}
        <a href={`mailto:${user.email}`} target="_blank" rel="noreferrer" className="block">
          <Button variant="outline" className="w-full justify-start" size="sm">
            <Mail className="w-4 h-4 mr-2" />
            E-Mail senden
          </Button>
        </a>

        {/* Phone User */}
        {user.profile?.phone && (
          <a href={`tel:${user.profile.phone}`} target="_blank" rel="noreferrer" className="block">
            <Button variant="outline" className="w-full justify-start" size="sm">
              <Phone className="w-4 h-4 mr-2" />
              Anrufen
            </Button>
          </a>
        )}

        {/* View User Tasks */}
        <Link href={`/dashboard/tasks?assignee=${user.id}`}>
          <Button variant="outline" className="w-full justify-start" size="sm">
            <Target className="w-4 h-4 mr-2" />
            Aufgaben anzeigen
            <ExternalLink className="w-3 h-3 ml-auto" />
          </Button>
        </Link>

        {/* View Managed Customers (for employees) */}
        {user.profile?.user_type === 'employee' && (
          <Link href={`/dashboard/crm?manager=${user.id}`}>
            <Button variant="outline" className="w-full justify-start" size="sm">
              <UserPlus className="w-4 h-4 mr-2" />
              Verwaltete Kunden
              <ExternalLink className="w-3 h-3 ml-auto" />
            </Button>
          </Link>
        )}

        {/* Chat with Customer (for customers) */}
        {user.profile?.user_type === 'customer' && (
          <Link href={`/portal/chat`}>
            <Button variant="outline" className="w-full justify-start" size="sm">
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat öffnen
              <ExternalLink className="w-3 h-3 ml-auto" />
            </Button>
          </Link>
        )}
      </CardContent>

      {/* Task Creation Modal */}
      <TaskModal
        open={showTaskModal}
        onOpenChange={setShowTaskModal}
        onTaskCreated={handleTaskCreated}
        // Pre-fill with user assignment
        defaultValues={{
          assigned_to: user.id
        }}
      />
    </Card>
  );
}