'use client';

import { ModernUserDetailView } from '@/components/users/ModernUserDetailView';
import { CompleteUserData } from '@/lib/user-utils';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  created_by: string;
  customer_id?: string;
  contact_request_id?: string;
  due_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
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
}

interface Customer {
  id: string;
  user_id?: string;
  company_name: string;
  contact_person: string;
  email?: string;
  phone?: string;
  industry?: string;
  assigned_employee_id?: string;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
}

interface ContactRequest {
  id: string;
  customer_user_id?: string;
  subject: string;
  message: string;
  status: 'new' | 'in_progress' | 'responded' | 'converted' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  created_at: string;
  request_assignments?: {
    id: string;
    assigned_at: string;
    priority: string;
    estimated_hours?: number;
    notes?: string;
  }[];
}

interface ChatMessage {
  id: string;
  customer_id: string;
  sender_type: 'customer' | 'employee' | 'system';
  message: string;
  created_at: string;
  customers?: {
    company_name: string;
    contact_person: string;
    assigned_employee_id?: string;
  };
}

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: any;
  created_at: string;
}

interface EmployeeProfile {
  id: string;
  user_id: string;
  employee_id?: string;
  department_id?: string;
  job_title?: string;
  employment_type?: string;
  direct_phone?: string;
  hire_date?: string;
  working_hours_per_week?: number;
  skills?: string[];
  certifications?: string[];
  manager_id?: string;
  departments?: {
    id: string;
    name: string;
    manager_id?: string;
  };
  managers?: {
    id: string;
    user_profiles: {
      first_name?: string;
      last_name?: string;
      email?: string;
    }[];
  };
}

interface UserDetailPageClientProps {
  user: CompleteUserData;
  employeeProfile?: EmployeeProfile | null;
  tasks?: Task[];
  managedCustomers?: Customer[];
  assignedRequests?: ContactRequest[];
  recentChats?: ChatMessage[];
  activityLogs?: ActivityLog[];
  userId: string;
}

export function UserDetailPageClient({
  user,
  employeeProfile,
  tasks = [],
  managedCustomers = [],
  assignedRequests = [],
  recentChats = [],
  activityLogs = [],
  userId
}: UserDetailPageClientProps) {

  // Task management handlers
  const handleTaskCreate = async (taskData: any) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          dueDate: taskData.due_date,
          assignedTo: userId, // Assign to the user being viewed
          estimatedHours: taskData.estimated_hours
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create task');
      }

      // Refresh the page to show the new task
      window.location.reload();
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Fehler beim Erstellen der Aufgabe: ' + (error as Error).message);
    }
  };

  const handleTaskUpdate = async (taskId: string, updates: any) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update task');
      }

      // Refresh the page to show the updated task
      window.location.reload();
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Fehler beim Aktualisieren der Aufgabe: ' + (error as Error).message);
    }
  };

  const handleCustomerAssign = async (customerId: string, employeeId: string) => {
    try {
      const response = await fetch(`/api/customers/${customerId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employeeId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign customer');
      }

      // Refresh the page to show the updated assignment
      window.location.reload();
    } catch (error) {
      console.error('Error assigning customer:', error);
      alert('Fehler beim Zuweisen des Kunden: ' + (error as Error).message);
    }
  };

  const handleRequestAssign = async (requestId: string, employeeId: string) => {
    try {
      const response = await fetch(`/api/requests/${requestId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employeeId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign request');
      }

      // Refresh the page to show the updated assignment
      window.location.reload();
    } catch (error) {
      console.error('Error assigning request:', error);
      alert('Fehler beim Zuweisen der Anfrage: ' + (error as Error).message);
    }
  };

  const handleRequestStatusUpdate = async (requestId: string, status: ContactRequest['status']) => {
    try {
      const response = await fetch(`/api/requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update request status');
      }

      window.location.reload();
    } catch (error) {
      console.error('Error updating request status:', error);
      alert('Fehler beim Aktualisieren der Anfrage: ' + (error as Error).message);
    }
  };

  const handleRequestUnassign = async (requestId: string) => {
    try {
      const response = await fetch(`/api/requests/${requestId}/assign`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to unassign request');
      }

      window.location.reload();
    } catch (error) {
      console.error('Error unassigning request:', error);
      alert('Fehler beim Entfernen der Zuweisung: ' + (error as Error).message);
    }
  };

  return (
    <ModernUserDetailView
      user={user}
      employeeProfile={employeeProfile}
      tasks={tasks}
      managedCustomers={managedCustomers}
      assignedRequests={assignedRequests}
      recentChats={recentChats}
      activityLogs={activityLogs}
      onTaskCreate={handleTaskCreate}
      onTaskUpdate={handleTaskUpdate}
      onCustomerAssign={handleCustomerAssign}
      onRequestAssign={handleRequestAssign}
      onRequestStatusUpdate={handleRequestStatusUpdate}
      onRequestUnassign={handleRequestUnassign}
    />
  );
}
