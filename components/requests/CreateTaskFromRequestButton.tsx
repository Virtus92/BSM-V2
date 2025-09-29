'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Target, Plus } from 'lucide-react';
import { TaskModal } from '@/components/tasks/TaskModal';
import { useToast } from '@/components/ui/use-toast';

interface CreateTaskFromRequestButtonProps {
  request: {
    id: string;
    subject: string;
    message: string;
    name: string;
    email: string;
  };
  customerId?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function CreateTaskFromRequestButton({
  request,
  customerId,
  variant = 'default',
  size = 'sm',
  className = ''
}: CreateTaskFromRequestButtonProps) {
  const { toast } = useToast();
  const [showTaskModal, setShowTaskModal] = useState(false);

  const handleTaskCreated = () => {
    setShowTaskModal(false);
    toast({
      title: 'Erfolg',
      description: 'Aufgabe wurde aus der Anfrage erstellt.',
    });
    // Optionally refresh or redirect
    window.location.reload();
  };

  // Pre-fill task data based on request
  const defaultTaskData = {
    title: `Bearbeitung: ${request.subject}`,
    description: `Aufgabe zur Bearbeitung der Kundenanfrage von ${request.name} (${request.email}).\n\nOriginal-Nachricht:\n${request.message}`,
    priority: 'medium' as const,
    contact_request_id: request.id,
    customer_id: customerId
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowTaskModal(true)}
        className={`${className}`}
      >
        <Target className="w-4 h-4 mr-2" />
        Aufgabe erstellen
      </Button>

      <TaskModal
        open={showTaskModal}
        onOpenChange={setShowTaskModal}
        onTaskCreated={handleTaskCreated}
        defaultValues={defaultTaskData}
      />
    </>
  );
}