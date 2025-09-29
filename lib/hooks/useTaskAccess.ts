import { useState, useEffect } from 'react';

interface TaskAccessResult {
  hasAccess: boolean;
  reason: 'admin' | 'direct_assignment' | 'task_access' | 'no_access';
  activeTasks?: Array<{
    id: string;
    title: string;
    status: string;
    customer_id?: string | null;
    contact_request_id?: string | null;
  }>;
  accessibleResources?: {
    customerIds: string[];
    requestIds: string[];
    activeTasks: any[];
  };
}

/**
 * Hook to check if current user has access to a specific resource through task assignments
 */
export function useTaskAccess(
  resourceType: 'customer' | 'contact_request' | null,
  resourceId: string | null
) {
  const [accessResult, setAccessResult] = useState<TaskAccessResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!resourceType || !resourceId) {
      setAccessResult(null);
      return;
    }

    const checkAccess = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/users/task-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resourceType, resourceId })
        });

        if (response.ok) {
          const result = await response.json();
          setAccessResult(result);
        } else {
          setError('Failed to check access');
        }
      } catch (err) {
        setError('Error checking access');
        console.error('Task access check error:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [resourceType, resourceId]);

  return { accessResult, loading, error };
}

/**
 * Hook to get all resources accessible to the current user through task assignments
 */
export function useAccessibleResources() {
  const [accessibleResources, setAccessibleResources] = useState<{
    customerIds: string[];
    requestIds: string[];
    activeTasks: any[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAccessibleResources = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/users/task-access');

        if (response.ok) {
          const result = await response.json();
          setAccessibleResources(result.accessibleResources);
        } else {
          setError('Failed to load accessible resources');
        }
      } catch (err) {
        setError('Error loading accessible resources');
        console.error('Accessible resources load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAccessibleResources();
  }, []);

  return { accessibleResources, loading, error, refresh: () => loadAccessibleResources() };
}

/**
 * Hook to check if user has access and provide access reason information
 */
export function useAccessInfo(
  resourceType: 'customer' | 'contact_request' | null,
  resourceId: string | null
) {
  const { accessResult, loading, error } = useTaskAccess(resourceType, resourceId);

  const getAccessMessage = () => {
    if (!accessResult) return null;

    switch (accessResult.reason) {
      case 'admin':
        return 'Vollzugriff als Administrator';
      case 'direct_assignment':
        return 'Direkter Zugriff durch Zuweisung';
      case 'task_access':
        return `Temporärer Zugriff durch aktive Aufgabe${accessResult.activeTasks?.length === 1 ? '' : 'n'}`;
      case 'no_access':
        return 'Kein Zugriff';
      default:
        return 'Unbekannter Zugriffsstatus';
    }
  };

  const getAccessTaskInfo = () => {
    if (accessResult?.reason === 'task_access' && accessResult.activeTasks) {
      return accessResult.activeTasks.map(task => ({
        id: task.id,
        title: task.title,
        status: task.status
      }));
    }
    return [];
  };

  return {
    hasAccess: accessResult?.hasAccess || false,
    loading,
    error,
    accessMessage: getAccessMessage(),
    accessTasks: getAccessTaskInfo(),
    accessReason: accessResult?.reason || 'no_access'
  };
}