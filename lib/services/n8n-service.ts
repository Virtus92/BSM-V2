/**
 * 🎯 N8N API Service
 *
 * Clean integration with n8n.dinel.at for workflow management.
 * No mocks, no bullshit - real API calls only.
 */

import { logApiError } from '@/lib/utils/error-handler'

// === N8N Types ===
export interface N8NWorkflow {
  id: string
  name: string
  active: boolean
  tags: string[]
  createdAt: string
  updatedAt: string
  nodes?: N8NNode[]
  connections?: Record<string, unknown>
}

export interface N8NExecution {
  id: string
  workflowId: string
  mode: 'webhook' | 'cron' | 'trigger' | 'manual'
  status: 'success' | 'error' | 'running' | 'waiting' | 'canceled'
  startedAt: string
  stoppedAt?: string
  executionTime?: number
  data?: Record<string, unknown>
  error?: string
}

export interface N8NNode {
  id: string
  name: string
  type: string
  typeVersion: number
  position: [number, number]
  parameters: Record<string, unknown>
  webhookId?: string
}

export interface N8NCredential {
  id: string
  name: string
  type: string
  data?: Record<string, unknown>
}

// === API Response Types ===
export interface N8NApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface N8NListResponse<T> {
  data: T[]
  nextCursor?: string
}

// === Service Configuration ===
const N8N_CONFIG = {
  baseUrl: process.env.N8N_BASE_URL || 'https://n8n.dinel.at',
  apiKey: process.env.N8N_API_KEY,
  webhookUrl: process.env.N8N_WEBHOOK_URL,
  timeout: 10000
} as const

// Runtime environment guard
const IS_BROWSER = typeof window !== 'undefined'

// === N8N Service Class ===
export class N8NService {
  private readonly baseUrl: string
  private readonly apiKey: string
  private readonly headers: HeadersInit

  constructor() {
    // In server runtime, enforce API key presence. In browser, don't crash —
    // this service is server-only and client calls will be short-circuited.
    if (!N8N_CONFIG.apiKey && !IS_BROWSER) {
      throw new Error('N8N_API_KEY environment variable is required')
    }

    this.baseUrl = N8N_CONFIG.baseUrl
    this.apiKey = N8N_CONFIG.apiKey || ''
    this.headers = {
      'Content-Type': 'application/json',
      ...(this.apiKey ? { 'X-N8N-API-KEY': this.apiKey } : {}),
      'User-Agent': 'BSM-V2/1.0'
    }
  }

  /**
   * Make authenticated API request to N8N
   */
  private async apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<N8NApiResponse<T>> {
    // Never attempt real N8N calls from the browser
    if (IS_BROWSER) {
      return {
        success: false,
        error: 'N8NService is server-only',
        message: 'N8N API cannot be called from the browser'
      }
    }
    const url = `${this.baseUrl}/api/v1${endpoint}`

    try {
      // Log API request for debugging
      console.log(`N8N API Request: ${options.method || 'GET'} ${endpoint}`)

      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.headers,
          ...options.headers
        },
        signal: AbortSignal.timeout(N8N_CONFIG.timeout)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`N8N API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      return { success: true, data: data as T }

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logApiError('N8NService.apiRequest', err, {
        metadata: { endpoint, url, method: options.method || 'GET' }
      })

      return {
        success: false,
        error: err.message,
        message: `Failed to call N8N API: ${endpoint}`
      }
    }
  }

  /**
   * Get all workflows
   */
  async getWorkflows(): Promise<N8NApiResponse<N8NWorkflow[]>> {
    const response = await this.apiRequest<N8NListResponse<N8NWorkflow>>('/workflows')

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error,
        message: response.message
      }
    }

    return {
      success: true,
      data: response.data.data
    }
  }

  /**
   * Get specific workflow by ID
   */
  async getWorkflow(workflowId: string): Promise<N8NApiResponse<N8NWorkflow>> {
    return this.apiRequest<N8NWorkflow>(`/workflows/${workflowId}`)
  }

  /**
   * Get workflow executions
   */
  async getExecutions(
    workflowId?: string,
    limit: number = 20
  ): Promise<N8NApiResponse<N8NExecution[]>> {
    const params = new URLSearchParams()
    if (workflowId) params.set('workflowId', workflowId)
    params.set('limit', limit.toString())

    const endpoint = `/executions?${params.toString()}`
    const response = await this.apiRequest<N8NListResponse<N8NExecution>>(endpoint)

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error,
        message: response.message
      }
    }

    return {
      success: true,
      data: response.data.data
    }
  }

  /**
   * Get specific execution by ID
   */
  async getExecution(executionId: string): Promise<N8NApiResponse<N8NExecution>> {
    return this.apiRequest<N8NExecution>(`/executions/${executionId}`)
  }

  /**
   * Activate/Deactivate workflow
   */
  async toggleWorkflow(workflowId: string, active: boolean): Promise<N8NApiResponse<N8NWorkflow>> {
    return this.apiRequest<N8NWorkflow>(`/workflows/${workflowId}/activate`, {
      method: 'POST',
      body: JSON.stringify({ active })
    })
  }

  /**
   * Execute workflow manually
   */
  async executeWorkflow(
    workflowId: string,
    inputData?: Record<string, unknown>
  ): Promise<N8NApiResponse<N8NExecution>> {
    return this.apiRequest<N8NExecution>(`/workflows/${workflowId}/execute`, {
      method: 'POST',
      body: JSON.stringify({ data: inputData || {} })
    })
  }

  /**
   * Get workflow statistics
   */
  async getWorkflowStats(workflowId: string): Promise<N8NApiResponse<{
    totalExecutions: number
    successfulExecutions: number
    failedExecutions: number
    averageExecutionTime: number
    lastExecution?: string
  }>> {
    const executionsResponse = await this.getExecutions(workflowId, 100)

    if (!executionsResponse.success || !executionsResponse.data) {
      return {
        success: false,
        error: 'Failed to fetch execution data for statistics'
      }
    }

    const executions = executionsResponse.data
    const totalExecutions = executions.length
    const successfulExecutions = executions.filter(e => e.status === 'success').length
    const failedExecutions = executions.filter(e => e.status === 'error').length
    const averageExecutionTime = executions
      .filter(e => e.executionTime)
      .reduce((acc, e) => acc + (e.executionTime || 0), 0) / Math.max(executions.length, 1)
    const lastExecution = executions[0]?.startedAt

    return {
      success: true,
      data: {
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        averageExecutionTime: Math.round(averageExecutionTime),
        lastExecution
      }
    }
  }

  /**
   * Health check for N8N instance
   */
  async healthCheck(): Promise<N8NApiResponse<{ status: string; version?: string }>> {
    try {
      const workflowsResult = await this.apiRequest<N8NListResponse<N8NWorkflow>>('/workflows?limit=1')

      if (workflowsResult.success) {
        return {
          success: true,
          data: {
            status: 'healthy',
            version: 'connected'
          }
        }
      } else {
        return {
          success: false,
          error: 'N8N API not responding',
          message: 'Health check failed'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Health check failed'
      }
    }
  }

  /**
   * Get credentials (for admin use)
   */
  async getCredentials(): Promise<N8NApiResponse<N8NCredential[]>> {
    const response = await this.apiRequest<N8NListResponse<N8NCredential>>('/credentials')

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error,
        message: response.message
      }
    }

    return {
      success: true,
      data: response.data.data
    }
  }
}

// === Singleton Instance ===
export const n8nService = new N8NService()

// === Utility Functions ===
export function getExecutionStatusColor(status: N8NExecution['status']): string {
  switch (status) {
    case 'success': return 'text-green-500 bg-green-500/10 border-green-500/20'
    case 'error': return 'text-red-500 bg-red-500/10 border-red-500/20'
    case 'running': return 'text-blue-500 bg-blue-500/10 border-blue-500/20'
    case 'waiting': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
    case 'canceled': return 'text-gray-500 bg-gray-500/10 border-gray-500/20'
    default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20'
  }
}

export function formatExecutionTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${Math.round(ms / 1000)}s`
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.round((ms % 60000) / 1000)
  return `${minutes}m ${seconds}s`
}

export function getWorkflowTags(workflow: N8NWorkflow): string[] {
  // Extract meaningful tags from workflow name and nodes
  const tags: string[] = [...(workflow.tags || [])]

  // Add automatic tags based on workflow content
  const name = workflow.name.toLowerCase()
  if (name.includes('customer')) tags.push('crm')
  if (name.includes('email')) tags.push('email')
  if (name.includes('slack')) tags.push('notifications')
  if (name.includes('webhook')) tags.push('api')
  if (name.includes('schedule')) tags.push('automation')

  return [...new Set(tags)] // Remove duplicates
}
