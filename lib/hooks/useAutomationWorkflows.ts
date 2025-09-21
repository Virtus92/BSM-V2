/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { WorkflowInsight, WorkflowCategory } from '@/lib/services/workflow-analyzer';

export interface AutomationStats {
  totalWorkflows: number;
  activeWorkflows: number;
  totalExecutions: number;
  successfulExecutions: number;
  avgSuccessRate: number;
  categoryCounts: Record<WorkflowCategory, number>;
  liveSystems: number;
}

export type StatusFilter = 'all' | 'active' | 'inactive';
export type PerformanceFilter = 'all' | 'excellent' | 'good' | 'poor';
export type CategoryFilter = 'all' | WorkflowCategory;

export function useAutomationWorkflows() {
  // Core data
  const [workflows, setWorkflows] = useState<WorkflowInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [executing, setExecuting] = useState<string[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [performanceFilter, setPerformanceFilter] = useState<PerformanceFilter>('all');

  // Fetch workflows data
  const fetchWorkflows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/automation/workflows');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setWorkflows(data.insights || []);
    } catch (err) {
      console.error('Failed to fetch workflows:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch workflows');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  // Filtered workflows
  const filteredWorkflows = useMemo(() => {
    return workflows.filter(workflow => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (
          !workflow.workflow.name.toLowerCase().includes(searchLower) &&
          !workflow.businessMetrics.description.toLowerCase().includes(searchLower) &&
          !workflow.category.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter !== 'all' && workflow.category !== categoryFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'active' && !workflow.workflow.active) return false;
      if (statusFilter === 'inactive' && workflow.workflow.active) return false;

      // Performance filter
      if (performanceFilter !== 'all') {
        const successRate = workflow.executionHistory.total > 0
          ? (workflow.executionHistory.successful / workflow.executionHistory.total) * 100
          : 0;

        switch (performanceFilter) {
          case 'excellent':
            if (successRate < 95) return false;
            break;
          case 'good':
            if (successRate < 80 || successRate >= 95) return false;
            break;
          case 'poor':
            if (successRate >= 80) return false;
            break;
        }
      }

      return true;
    });
  }, [workflows, searchTerm, categoryFilter, statusFilter, performanceFilter]);

  // Calculate stats
  const stats = useMemo((): AutomationStats => {
    const totalWorkflows = workflows.length;
    const activeWorkflows = workflows.filter(w => w.workflow.active).length;
    const totalExecutions = workflows.reduce((sum, w) => sum + w.executionHistory.total, 0);
    const successfulExecutions = workflows.reduce((sum, w) => sum + w.executionHistory.successful, 0);
    const avgSuccessRate = totalExecutions > 0 ? Math.round((successfulExecutions / totalExecutions) * 100) : 0;

    const categoryCounts = workflows.reduce((acc, workflow) => {
      acc[workflow.category] = (acc[workflow.category] || 0) + 1;
      return acc;
    }, {} as Record<WorkflowCategory, number>);

    const liveSystems = workflows.filter(w => w.workflow.active && w.executionHistory.total > 0).length;

    return {
      totalWorkflows,
      activeWorkflows,
      totalExecutions,
      successfulExecutions,
      avgSuccessRate,
      categoryCounts,
      liveSystems
    };
  }, [workflows]);

  // Execute workflow
  const executeWorkflow = useCallback(async (
    workflowId: string,
    type: 'manual' | 'webhook' | 'test',
    payload?: any,
    opts?: { triggerType?: 'chat' | 'webhook' | 'manual', triggerNodeId?: string }
  ) => {
    setExecuting(prev => [...prev, workflowId]);

    try {
      const response = await fetch(`/api/automation/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, payload, ...opts })
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result?.error || 'Failed to execute workflow' };
      }

      // Refresh workflows data after execution
      if (result.success) {
        setTimeout(() => {
          fetchWorkflows();
        }, 2000);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      setExecuting(prev => prev.filter(id => id !== workflowId));
    }
  }, [fetchWorkflows]);

  return {
    // Data
    workflows,
    filteredWorkflows,
    stats,
    loading,
    error,
    executing,

    // Filters
    searchTerm,
    categoryFilter,
    statusFilter,
    performanceFilter,
    setSearchTerm,
    setCategoryFilter,
    setStatusFilter,
    setPerformanceFilter,

    // Actions
    executeWorkflow,
    refetch: fetchWorkflows
  };
}
