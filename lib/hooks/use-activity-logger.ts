'use client';

import type { ActivityAction, ResourceType } from '@/lib/utils/activity-logger';

/**
 * Client-side activity logger hook
 */
export function useActivityLogger() {
  const logClientActivity = async (
    action: ActivityAction,
    resourceType: ResourceType,
    resourceId?: string,
    details?: Record<string, any>
  ) => {
    try {
      await fetch('/api/activity/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          additional_context: details
        }),
      });
    } catch (error) {
      console.error('Failed to log client activity:', error);
    }
  };

  return { logClientActivity };
}