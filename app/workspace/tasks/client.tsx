'use client';

import { PageLayout } from '@/components/shared/PageLayout';
import { TaskKanbanBoard } from '@/components/tasks/TaskKanbanBoard';
import { Plus } from 'lucide-react';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';

export function WorkspaceTasksPageClient() {
  return (
    <PageLayout
      title="Aufgaben"
      description="Kanban Board für Ihre Aufgaben mit Kunden- und Anfragenverwaltung"
      backHref="/workspace"
      actions={[]}
    >
      <div className="mb-4">
        <CreateTaskModal />
      </div>
      <TaskKanbanBoard isWorkspace={true} />
    </PageLayout>
  );
}
