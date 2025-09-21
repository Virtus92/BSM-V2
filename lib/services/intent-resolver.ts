/* eslint-disable @typescript-eslint/no-explicit-any */
import type { N8NWorkflow, N8NNode } from '@/lib/services/n8n-service'
import type { AnalyzedWorkflow, WorkflowTriggerInfo } from '@/lib/services/workflow-introspector'

export type TriggerKind = 'chat' | 'webhook' | 'manual'

export interface IntentInput {
  explicitType?: TriggerKind
  explicitNodeId?: string
  payload?: Record<string, any>
}

export interface ResolveResult {
  kind: TriggerKind
  node?: WorkflowTriggerInfo
  reason: string
}

function looksLikeChat(payload?: Record<string, any>): boolean {
  if (!payload) return false
  const msg = (payload as any).message || (payload as any).text || (payload as any).chatInput || (payload as any).input
  return typeof msg === 'string' && msg.trim().length > 0
}

function looksLikeApi(payload?: Record<string, any>): boolean {
  if (!payload) return false
  return !!((payload as any).event || (payload as any).data || (payload as any).customer || (payload as any).service)
}

export function resolveTrigger(
  workflow: N8NWorkflow,
  analysis: AnalyzedWorkflow,
  input: IntentInput
): ResolveResult {
  const triggers = analysis.triggers || []

  // 1) Explicit type wins
  if (input.explicitType) {
    const node = input.explicitNodeId
      ? triggers.find(t => t.nodeId === input.explicitNodeId)
      : triggers.find(t => t.type === input.explicitType)
    return {
      kind: input.explicitType,
      node,
      reason: `explicit:${input.explicitType}${input.explicitNodeId ? `#${input.explicitNodeId}` : ''}`
    }
  }

  // 2) Explicit node id implies its type
  if (input.explicitNodeId) {
    const node = triggers.find(t => t.nodeId === input.explicitNodeId)
    if (node) {
      const type = node.type === 'chat' ? 'chat' : node.type === 'webhook' ? 'webhook' : 'manual'
      return { kind: type, node, reason: `node:${node.type}` }
    }
  }

  // 3) Payload heuristics
  if (looksLikeChat(input.payload) && analysis.hasChat) {
    return { kind: 'chat', node: triggers.find(t => t.type === 'chat'), reason: 'heuristic:chat' }
  }
  if (looksLikeApi(input.payload) && analysis.hasWebhook) {
    return { kind: 'webhook', node: triggers.find(t => t.type === 'webhook'), reason: 'heuristic:api' }
  }

  // 4) Analysis defaults
  if (analysis.hasChat) return { kind: 'chat', node: triggers.find(t => t.type === 'chat'), reason: 'analysis:chat' }
  if (analysis.hasWebhook) return { kind: 'webhook', node: triggers.find(t => t.type === 'webhook'), reason: 'analysis:webhook' }
  if (triggers.some(t => t.type === 'manual')) return { kind: 'manual', node: triggers.find(t => t.type === 'manual'), reason: 'analysis:manual' }

  // 5) Fallback
  return { kind: 'manual', reason: 'fallback:manual' }
}

