/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 🎯 Real Workflow Analysis Engine
 *
 * Analyzes actual N8N workflows to determine their type, capabilities, and UI requirements.
 * Maps real node structures to specific dashboard components and executive controls.
 */

import { N8NWorkflow, N8NExecution, N8NNode } from './n8n-service'
import type { WorkflowTriggerInfo } from '@/lib/services/workflow-introspector'

export type WorkflowCategory =
  | 'ai_agent'
  | 'webhook_service'
  | 'data_processor'
  | 'automation_pipeline'
  | 'notification_system'

export type NodeCategory =
  | 'trigger'
  | 'ai_model'
  | 'tool'
  | 'data_source'
  | 'notification'
  | 'control_flow'

export interface NodeAnalysis {
  id: string
  name: string
  type: string
  category: NodeCategory
  description: string
  isExecutable: boolean
  hasOutput: boolean
  connections: string[]
  executionData?: any
}

export interface WorkflowCapabilities {
  canExecuteManually: boolean
  hasWebhookTrigger: boolean
  hasScheduledTrigger: boolean
  hasAIComponents: boolean
  hasDataProcessing: boolean
  hasNotifications: boolean
  hasExternalAPIs: boolean
  requiresInput: boolean
}

export interface ExecutiveControl {
  type: 'execute' | 'test' | 'monitor' | 'configure'
  label: string
  description: string
  available: boolean
  endpoint?: string
  payload?: Record<string, any>
}

export interface WorkflowInsight {
  workflow: N8NWorkflow
  category: WorkflowCategory
  capabilities: WorkflowCapabilities
  nodes: NodeAnalysis[]
  controls: ExecutiveControl[]
  triggers?: WorkflowTriggerInfo[]
  executionHistory: {
    total: number
    successful: number
    failed: number
    averageDuration: number
    lastExecution?: Date
  }
  businessMetrics: {
    description: string
    kpis: Array<{
      label: string
      value: string | number
      trend?: 'up' | 'down' | 'stable'
    }>
  }
}

export class WorkflowAnalyzer {

  /**
   * Analyze a workflow and determine its executive dashboard requirements
   */
  static analyzeWorkflow(
    workflow: N8NWorkflow,
    executions: N8NExecution[] = []
  ): WorkflowInsight {
    const nodes = workflow.nodes || []
    const nodeAnalyses = nodes.map(node => this.analyzeNode(node))

    const category = this.determineCategory(workflow, nodeAnalyses)
    const capabilities = this.analyzeCapabilities(nodeAnalyses)
    const controls = this.generateExecutiveControls(workflow, capabilities)
    const executionHistory = this.analyzeExecutionHistory(executions)
    const businessMetrics = this.generateBusinessMetrics(category, workflow, executionHistory)

    return {
      workflow,
      category,
      capabilities,
      nodes: nodeAnalyses,
      controls,
      executionHistory,
      businessMetrics
    }
  }

  /**
   * Analyze individual nodes to understand their function and UI requirements
   */
  private static analyzeNode(node: N8NNode): NodeAnalysis {
    const category = this.categorizeNode(node.type)
    const description = this.getNodeDescription(node.type, node.name)

    return {
      id: node.id,
      name: node.name,
      type: node.type,
      category,
      description,
      isExecutable: this.isExecutableNode(node.type),
      hasOutput: this.hasOutputData(node.type),
      connections: [] // Will be populated from workflow connections
    }
  }

  /**
   * Categorize node types for UI grouping
   */
  private static categorizeNode(nodeType: string): NodeCategory {
    // Trigger nodes
    if (nodeType.includes('trigger') || nodeType.includes('webhook') || nodeType.includes('schedule')) {
      return 'trigger'
    }

    // AI/LLM nodes
    if (nodeType.includes('langchain') || nodeType.includes('openai') || nodeType.includes('agent')) {
      return 'ai_model'
    }

    // Tool nodes (HTTP requests, databases, etc.)
    if (nodeType.includes('http') || nodeType.includes('tool') || nodeType.includes('api')) {
      return 'tool'
    }

    // Data processing
    if (nodeType.includes('set') || nodeType.includes('split') || nodeType.includes('merge') ||
        nodeType.includes('transform') || nodeType.includes('filter')) {
      return 'data_source'
    }

    // Notifications
    if (nodeType.includes('telegram') || nodeType.includes('email') || nodeType.includes('slack')) {
      return 'notification'
    }

    return 'control_flow'
  }

  /**
   * Generate human-readable node descriptions
   */
  private static getNodeDescription(nodeType: string, nodeName: string): string {
    const descriptions: Record<string, string> = {
      'chatTrigger': 'Chat interface for AI agent conversations',
      'agent': 'AI agent for automated conversations and task execution',
      'vectorStore': 'Knowledge base storage and retrieval system',
      'httpRequestTool': 'External API integration tool',
      'webhook': 'Incoming data receiver from external systems',
      'telegram': 'Telegram messaging and notifications',
      'memoryPostgresChat': 'Conversation memory and context storage',
      'respondToWebhook': 'Response handler for incoming requests'
    }

    const key = nodeType.split('.').pop() || nodeType
    return descriptions[key] || `${nodeName} - ${nodeType}`
  }

  /**
   * Determine overall workflow category
   */
  private static determineCategory(workflow: N8NWorkflow, nodes: NodeAnalysis[]): WorkflowCategory {
    const hasAI = nodes.some(n => n.category === 'ai_model')
    const hasWebhook = nodes.some(n => n.type.includes('webhook'))
    const hasTrigger = nodes.some(n => n.category === 'trigger')
    const hasNotifications = nodes.some(n => n.category === 'notification')

    // AI Agent with chat capabilities
    if (hasAI && nodes.some(n => n.type.includes('chat'))) {
      return 'ai_agent'
    }

    // Webhook-based service
    if (hasWebhook && !hasAI) {
      return 'webhook_service'
    }

    // Notification system
    if (hasNotifications && hasTrigger) {
      return 'notification_system'
    }

    // Data processing pipeline
    if (nodes.some(n => n.category === 'data_source')) {
      return 'data_processor'
    }

    return 'automation_pipeline'
  }

  /**
   * Analyze workflow capabilities for executive controls
   */
  private static analyzeCapabilities(nodes: NodeAnalysis[]): WorkflowCapabilities {
    return {
      canExecuteManually: nodes.some(n => n.type.includes('manual')),
      hasWebhookTrigger: nodes.some(n => n.type.includes('webhook')),
      hasScheduledTrigger: nodes.some(n => n.type.includes('schedule')),
      hasAIComponents: nodes.some(n => n.category === 'ai_model'),
      hasDataProcessing: nodes.some(n => n.category === 'data_source'),
      hasNotifications: nodes.some(n => n.category === 'notification'),
      hasExternalAPIs: nodes.some(n => n.category === 'tool'),
      requiresInput: nodes.some(n => n.type.includes('webhook') || n.type.includes('manual'))
    }
  }

  /**
   * Generate executive controls based on workflow capabilities
   */
  private static generateExecutiveControls(
    workflow: N8NWorkflow,
    capabilities: WorkflowCapabilities
  ): ExecutiveControl[] {
    const controls: ExecutiveControl[] = []

    // Manual execution control
    if (capabilities.canExecuteManually) {
      controls.push({
        type: 'execute',
        label: 'Run Workflow',
        description: 'Execute workflow manually with test data',
        available: true,
        endpoint: `/workflows/${workflow.id}/execute`,
        payload: {}
      })
    }

    // Webhook testing
    if (capabilities.hasWebhookTrigger) {
      controls.push({
        type: 'test',
        label: 'Test Webhook',
        description: 'Send test payload to webhook endpoint',
        available: true,
        endpoint: `/workflows/${workflow.id}/webhook-test`
      })
    }

    // AI Agent testing
    if (capabilities.hasAIComponents) {
      controls.push({
        type: 'test',
        label: 'Test AI Agent',
        description: 'Send test message to AI agent',
        available: true,
        endpoint: `/workflows/${workflow.id}/agent-test`
      })
    }

    // Live monitoring
    controls.push({
      type: 'monitor',
      label: 'Live Monitor',
      description: 'Real-time execution monitoring and logs',
      available: true,
      endpoint: `/workflows/${workflow.id}/monitor`
    })

    return controls
  }

  /**
   * Analyze execution history for metrics
   */
  private static analyzeExecutionHistory(executions: N8NExecution[]) {
    const successful = executions.filter(e => e.status === 'success').length
    const failed = executions.filter(e => e.status === 'error').length

    const durations = executions
      .filter(e => e.startedAt && e.stoppedAt)
      .map(e => new Date(e.stoppedAt!).getTime() - new Date(e.startedAt).getTime())

    const averageDuration = durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0

    const lastExecution = executions.length > 0
      ? new Date(executions[0].startedAt)
      : undefined

    return {
      total: executions.length,
      successful,
      failed,
      averageDuration,
      lastExecution
    }
  }

  /**
   * Generate business metrics for executive dashboard
   */
  private static generateBusinessMetrics(
    category: WorkflowCategory,
    workflow: N8NWorkflow,
    executionHistory: any
  ) {
    const successRate = executionHistory.total > 0
      ? Math.round((executionHistory.successful / executionHistory.total) * 100)
      : 0

    switch (category) {
      case 'ai_agent':
        return {
          description: 'Digitaler Mitarbeiter für Kundeninteraktion (Chat/Assistenz)',
          kpis: [
            { label: 'Erfolgsrate', value: `${successRate}%`, trend: (successRate >= 90 ? 'up' : 'down') as 'up' | 'down' | 'stable' },
            { label: 'Ø Antwortzeit', value: `${Math.max(1, Math.round(executionHistory.averageDuration / 1000))}s` },
            { label: 'Interaktionen (heute/gesamt)', value: executionHistory.total },
            { label: 'Fehler', value: executionHistory.failed }
          ]
        }

      case 'webhook_service':
        return {
          description: 'API Service / Webhook-Integration',
          kpis: [
            { label: 'Anfragen gesamt', value: executionHistory.total },
            { label: 'Fehlerquote', value: `${executionHistory.total > 0 ? Math.round((executionHistory.failed / executionHistory.total) * 100) : 0}%` },
            { label: 'Ø Verarbeitungszeit', value: `${Math.round(executionHistory.averageDuration)}ms` },
            { label: 'Erfolgsrate', value: `${successRate}%` }
          ]
        }

      default:
        return {
          description: 'Automatisierter Geschäftsprozess',
          kpis: [
            { label: 'Erfolgsrate', value: `${successRate}%` },
            { label: 'Ausführungen', value: executionHistory.total },
            { label: 'Ø Dauer', value: `${Math.max(1, Math.round(executionHistory.averageDuration / 1000))}s` }
          ]
        }
    }
  }

  /**
   * Check if node can be executed independently
   */
  private static isExecutableNode(nodeType: string): boolean {
    return nodeType.includes('http') ||
           nodeType.includes('agent') ||
           nodeType.includes('tool')
  }

  /**
   * Check if node produces output data
   */
  private static hasOutputData(nodeType: string): boolean {
    return !nodeType.includes('respondTo') &&
           !nodeType.includes('notification')
  }
}
