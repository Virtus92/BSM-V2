/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * 🎯 Executive Workflow Controller
 *
 * Provides executive-level controls for testing, monitoring, and operating N8N workflows.
 * Handles real-time execution, testing interfaces, and live monitoring capabilities.
 */

import { n8nService, N8NWorkflow, N8NExecution } from './n8n-service'

export interface ExecutionRequest {
  workflowId: string
  payload?: Record<string, any>
  executionType: 'manual' | 'webhook' | 'test'
}

export interface ExecutionResult {
  success: boolean
  executionId?: string
  data?: any
  error?: string
  duration?: number
  nodeResults?: Array<{
    nodeId: string
    nodeName: string
    status: 'success' | 'error' | 'running'
    output?: any
    error?: string
    duration?: number
  }>
}

export interface LiveMonitoring {
  workflowId: string
  isRunning: boolean
  currentExecution?: {
    id: string
    startedAt: Date
    currentNode?: string
    progress: number
  }
  recentExecutions: N8NExecution[]
  metrics: {
    executionsToday: number
    successRate: number
    averageResponseTime: number
    errorCount: number
  }
}

export interface TestScenario {
  name: string
  description: string
  payload: Record<string, any>
  preferredTriggerType?: 'chat' | 'webhook' | 'manual'
  expectedOutput?: any
}

export class ExecutionController {

  /**
   * Execute workflow manually with executive controls
   */
  static async executeWorkflow(request: ExecutionRequest): Promise<ExecutionResult> {
    const startTime = Date.now()

    try {
      let result

      switch (request.executionType) {
        case 'manual':
          result = await this.executeManual(request.workflowId, request.payload)
          break
        case 'webhook':
          result = await this.executeWebhook(request.workflowId, request.payload)
          break
        case 'test':
          result = await this.executeTest(request.workflowId, request.payload)
          break
        default:
          throw new Error(`Unknown execution type: ${request.executionType}`)
      }

      const duration = Date.now() - startTime

      return {
        success: true,
        executionId: result.executionId,
        data: result.data,
        duration,
        nodeResults: result.nodeResults
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      }
    }
  }

  // Public wrappers for explicit executions (without exposing internals)
  static async runManual(workflowId: string, payload?: Record<string, any>) {
    return this.executeManual(workflowId, payload)
  }

  static async runWebhook(
    workflowId: string,
    payload?: Record<string, any>,
    opts?: { triggerNodeId?: string }
  ) {
    return this.executeWebhook(workflowId, payload, opts)
  }

  /**
   * Execute workflow manually (for workflows with manual triggers)
   */
  private static async executeManual(workflowId: string, payload?: Record<string, any>) {
    // Use the n8nService wrapper for correct body shape and error handling
    const res = await n8nService.executeWorkflow(workflowId, payload)
    if (!res.success || !res.data) {
      throw new Error(`Manual execution failed: ${res.error || 'Unknown error'}`)
    }
    const result = res.data
    return {
      executionId: result.id,
      data: result,
      nodeResults: []
    }
  }

  /**
   * Execute webhook workflow (for webhook-triggered workflows)
   */
  private static async executeWebhook(
    workflowId: string,
    payload?: Record<string, any>,
    opts?: { triggerNodeId?: string }
  ) {
    // Get workflow details to find webhook URL
    const workflowResult = await n8nService.getWorkflow(workflowId)
    if (!workflowResult.success || !workflowResult.data) {
      throw new Error('Failed to get workflow details')
    }

    const workflow = workflowResult.data
    const nodes = workflow.nodes || []
    // Prefer the correct entrypoint based on intent
    const candidates = nodes.filter(n => !!n.webhookId)
    const hasChatTrigger = candidates.some(n => n.type === '@n8n/n8n-nodes-langchain.chatTrigger')
    const looksLikeChat = !!(payload && (payload.message || payload.text || payload.chatInput))
    const looksLikeApi = !!(payload && (payload.event || payload.data || payload.customer || payload.service))
    // If a specific trigger node is requested, use it if possible
    const specified = opts?.triggerNodeId ? candidates.find(n => n.id === opts?.triggerNodeId) : undefined
    const webhookNode = (
      specified ||
      // Prefer chat trigger if present and either payload looks like chat OR not clearly API-shaped
      (hasChatTrigger && !looksLikeApi && candidates.find(n => n.type === '@n8n/n8n-nodes-langchain.chatTrigger')) ||
      // Otherwise prefer classic webhook first (clear API intents)
      candidates.find(n => n.type === 'n8n-nodes-base.webhook') ||
      // If no classic webhook, fall back to chat trigger
      candidates.find(n => n.type === '@n8n/n8n-nodes-langchain.chatTrigger') ||
      // Finally any webhookId candidate
      candidates[0]
    )

    if (!webhookNode || !webhookNode.webhookId) {
      throw new Error('No webhook found in workflow')
    }

    // Execute via webhook (prefer explicit webhook base URL if provided). Choose live vs. test based on workflow active state.
    const isChatTrigger = webhookNode.type === '@n8n/n8n-nodes-langchain.chatTrigger'
    const baseRoot = (process.env.N8N_BASE_URL || '').replace(/\/$/, '')
    const liveBase = process.env.N8N_WEBHOOK_URL || (baseRoot ? `${baseRoot}/webhook` : '')
    const testBase = process.env.N8N_WEBHOOK_TEST_URL || (baseRoot ? `${baseRoot}/webhook-test` : '')
    if (!liveBase && !testBase) {
      throw new Error('N8N webhook base URLs not configured (set N8N_WEBHOOK_URL/N8N_WEBHOOK_TEST_URL or N8N_BASE_URL)')
    }
    const chosenBase = workflow.active ? liveBase : testBase
    // Prefer explicit path for Webhook node; fallback to webhookId
    const pathOrId = (!isChatTrigger ? ((webhookNode.parameters as any)?.path as string) : undefined) || webhookNode.webhookId || ''
    // Prefer non-/chat endpoint for synchronous responses; fallback handled by 404 branch below
    const webhookUrl = `${chosenBase}/${pathOrId}`
    console.log('Execute webhook URL:', webhookUrl)
    const basePayload = (payload || { test: true, source: 'executive-dashboard' }) as Record<string, any>
    const inferredMessage = (basePayload.message || basePayload.text || basePayload.input || '') as string
    const enrichedPayload = {
      ...basePayload,
      ...(isChatTrigger ? { chatInput: inferredMessage || 'Hello' } : {}),
      // add execution timestamp at execution time to avoid SSR hydration mismatches
      timestamp: new Date().toISOString()
    }
    const httpParam = (webhookNode.parameters as any)?.httpMethod
    const method = Array.isArray(httpParam)
      ? (httpParam.includes('POST') ? 'POST' : (httpParam[0]?.toUpperCase?.() || 'POST'))
      : ((httpParam as string)?.toUpperCase?.() || 'POST')
    const body = method === 'GET' ? undefined : JSON.stringify(enrichedPayload)
    let response = await fetch(webhookUrl, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body
    })

    // Fallback to the other base if 404 (switch live<->test)
    if (response.status === 404) {
      // Try /chat variant, then switch base
      const chatVariant = `${chosenBase}/${pathOrId}/chat`
      response = await fetch(chatVariant, { method, headers: { 'Content-Type': 'application/json' }, body })
      if (response.status === 404) {
        const otherBase = (chosenBase === liveBase ? testBase : liveBase)
        if (otherBase) {
          const altUrl = `${otherBase}/${pathOrId}`
          console.log('Execute webhook ALT URL:', altUrl)
          response = await fetch(altUrl, { method, headers: { 'Content-Type': 'application/json' }, body })
          if (response.status === 404) {
            const altChat = `${otherBase}/${pathOrId}/chat`
            response = await fetch(altChat, { method, headers: { 'Content-Type': 'application/json' }, body })
          }
        }
      }
    }

    if (!response.ok) {
      throw new Error(`Webhook execution failed: ${response.statusText}`)
    }

    const result = await response.json()

    // Get the latest execution to get execution ID
    const executionsResult = await n8nService.getExecutions(workflowId, 1)
    const latestExecution = executionsResult.success && executionsResult.data?.[0]

    return {
      executionId: latestExecution ? latestExecution.id : undefined,
      data: result,
      nodeResults: []
    }
  }

  /**
   * Execute test scenario
   */
  private static async executeTest(workflowId: string, payload?: Record<string, any>) {
    // Generate test data based on workflow type
    const testPayload = payload || await this.generateTestData(workflowId)

    // Try webhook execution first, fall back to manual
    try {
      return await this.executeWebhook(workflowId, testPayload)
    } catch (webhookError) {
      try {
        return await this.executeManual(workflowId, testPayload)
      } catch (manualError) {
        const wErr = webhookError instanceof Error ? webhookError.message : String(webhookError)
        const mErr = manualError instanceof Error ? manualError.message : String(manualError)
        throw new Error(`Execution failed. Webhook: ${wErr}. Manual: ${mErr}`)
      }
    }
  }

  /**
   * Get live monitoring data for a workflow
   */
  static async getLiveMonitoring(workflowId: string): Promise<LiveMonitoring> {
    try {
      // Get recent executions
      const executionsResult = await n8nService.getExecutions(workflowId, 50)
      const executions = executionsResult.success ? executionsResult.data || [] : []

      // Check if currently running
      const runningExecution = executions.find(e => e.status === 'running')

      // Calculate today's metrics
      const today = new Date().toDateString()
      const todayExecutions = executions.filter(e =>
        new Date(e.startedAt).toDateString() === today
      )

      const successfulToday = todayExecutions.filter(e => e.status === 'success').length
      const failedToday = todayExecutions.filter(e => e.status === 'error').length

      // Calculate average response time
      const completedExecutions = executions.filter(e => e.startedAt && e.stoppedAt)
      const totalDuration = completedExecutions.reduce((sum, e) => {
        const duration = new Date(e.stoppedAt!).getTime() - new Date(e.startedAt).getTime()
        return sum + duration
      }, 0)
      const averageResponseTime = completedExecutions.length > 0
        ? Math.round(totalDuration / completedExecutions.length)
        : 0

      return {
        workflowId,
        isRunning: !!runningExecution,
        currentExecution: runningExecution ? {
          id: runningExecution.id,
          startedAt: new Date(runningExecution.startedAt),
          progress: 50 // Would need execution details to calculate actual progress
        } : undefined,
        recentExecutions: executions.slice(0, 10),
        metrics: {
          executionsToday: todayExecutions.length,
          successRate: todayExecutions.length > 0
            ? Math.round((successfulToday / todayExecutions.length) * 100)
            : 0,
          averageResponseTime,
          errorCount: failedToday
        }
      }
    } catch (error) {
      throw new Error(`Failed to get monitoring data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate appropriate test scenarios for different workflow types
   */
  static generateTestScenarios(workflow: N8NWorkflow): TestScenario[] {
    const scenarios: TestScenario[] = []

    const nodes = workflow.nodes || []
    const hasChat = nodes.some(n => n.type === '@n8n/n8n-nodes-langchain.chatTrigger')
    const hasWebhook = nodes.some(n => n.type === 'n8n-nodes-base.webhook' || !!(n as any).webhookId)
    const hasManual = nodes.some(n => n.type === 'n8n-nodes-base.manualTrigger')

    if (hasChat) {
      scenarios.push({
        name: 'Chat Test',
        description: 'Minimal chat input',
        payload: { chatInput: 'Hallo' },
        preferredTriggerType: 'chat'
      })
    }

    if (hasWebhook) {
      scenarios.push({
        name: 'Webhook Test',
        description: 'Minimal payload',
        payload: {},
        preferredTriggerType: 'webhook'
      })
    }

    if (hasManual) {
      scenarios.push({
        name: 'Manual Test',
        description: 'Basic manual execution',
        payload: {},
        preferredTriggerType: 'manual'
      })
    }

    if (scenarios.length === 0) {
      scenarios.push({ name: 'Basic Test', description: 'Fallback execution', payload: {}, preferredTriggerType: 'manual' })
    }

    return scenarios
  }

  /**
   * Generate test data based on workflow analysis
   */
  private static async generateTestData(workflowId: string): Promise<Record<string, any>> {
    try {
      const workflowResult = await n8nService.getWorkflow(workflowId)
      if (!workflowResult.success || !workflowResult.data) {
        return { test: true, source: 'executive-dashboard' }
      }

      const scenarios = this.generateTestScenarios(workflowResult.data)
      return scenarios[0]?.payload || { test: true, source: 'executive-dashboard' }

    } catch (error) {
      return { test: true, source: 'executive-dashboard', error: 'Failed to generate test data' }
    }
  }

  /**
   * Parse node execution results from N8N response
   */
  private static parseNodeResults(executionData: any) {
    // This would parse the detailed execution data to show individual node results
    // N8N API may provide this data in different formats depending on the endpoint
    if (!executionData.nodeExecutions) {
      return []
    }

    return Object.entries(executionData.nodeExecutions).map(([nodeId, data]: [string, any]) => ({
      nodeId,
      nodeName: data.name || nodeId,
      status: (data.error ? 'error' : 'success') as 'error' | 'success' | 'running',
      output: data.output,
      error: data.error,
      duration: data.executionTime
    }))
  }

  /**
   * Stop a running execution
   */
  static async stopExecution(executionId: string): Promise<boolean> {
    try {
      const response = await fetch(`${process.env.N8N_BASE_URL}/api/v1/executions/${executionId}/stop`, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': process.env.N8N_API_KEY!
        }
      })

      return response.ok
    } catch (error) {
      console.error('Failed to stop execution:', error)
      return false
    }
  }

  /**
   * Get detailed execution logs with result data
   */
  static async getExecutionLogs(executionId: string) {
    try {
      // Try to get execution with result data using includeData parameter
      let response = await fetch(`${process.env.N8N_BASE_URL}/api/v1/executions/${executionId}?includeData=true`, {
        headers: {
          'X-N8N-API-KEY': process.env.N8N_API_KEY!
        }
      })

      // If that doesn't work, try without the parameter
      if (!response.ok) {
        response = await fetch(`${process.env.N8N_BASE_URL}/api/v1/executions/${executionId}`, {
          headers: {
            'X-N8N-API-KEY': process.env.N8N_API_KEY!
          }
        })
      }

      if (!response.ok) {
        throw new Error(`Failed to get execution logs: ${response.statusText}`)
      }

      const execution = await response.json()

      // If no result data, try to get it from a separate endpoint
      if (!execution.data || !execution.data.resultData) {
        try {
          const dataResponse = await fetch(`${process.env.N8N_BASE_URL}/api/v1/executions/${executionId}/results`, {
            headers: {
              'X-N8N-API-KEY': process.env.N8N_API_KEY!
            }
          })

          if (dataResponse.ok) {
            const resultData = await dataResponse.json()
            execution.data = { ...execution.data, resultData }
          }
        } catch (dataError) {
          console.log('Could not fetch separate result data:', dataError)
        }
      }

      return {
        success: true,
        data: execution
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
