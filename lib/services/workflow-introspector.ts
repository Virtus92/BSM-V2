import type { N8NWorkflow, N8NNode } from '@/lib/services/n8n-service'

export type TriggerType =
  | 'chat'
  | 'webhook'
  | 'telegram'
  | 'slack'
  | 'discord'
  | 'whatsapp'
  | 'email'
  | 'manual'
  | 'cron'
  | 'unknown'

export interface WorkflowTriggerInfo {
  nodeId: string
  nodeName: string
  type: TriggerType
  webhookId?: string
  isPublic?: boolean
  requiresExternalClient?: boolean
  promptField?: string // for chat triggers; default 'chatInput'
}

export interface AnalyzedWorkflow {
  workflowId: string
  name: string
  triggers: WorkflowTriggerInfo[]
  hasChat: boolean
  hasWebhook: boolean
  hasTelegram: boolean
}

const has = (t: string, s: string) => t.toLowerCase().includes(s.toLowerCase())

function isChatTrigger(node: N8NNode): boolean {
  return node.type === '@n8n/n8n-nodes-langchain.chatTrigger'
}

function isWebhook(node: N8NNode): boolean {
  return node.type === 'n8n-nodes-base.webhook'
}

function isTelegramTrigger(node: N8NNode): boolean {
  const t = node.type || ''
  return has(t, 'telegramtrigger')
}

function isSlackTrigger(node: N8NNode): boolean {
  const t = node.type || ''
  return has(t, 'slacktrigger')
}

function isDiscordTrigger(node: N8NNode): boolean {
  const t = node.type || ''
  return has(t, 'discordtrigger')
}

function isWhatsAppTrigger(node: N8NNode): boolean {
  const t = node.type || ''
  // Prefer explicit whatsapp triggers; avoid broad twilio assumption
  return has(t, 'whatsapptrigger') || has(t, 'meta-whatsapp-trigger')
}

function isEmailTrigger(node: N8NNode): boolean {
  const t = node.type || ''
  // IMAP/Email read triggers typically end with Trigger in n8n community nodes
  return has(t, 'emailtrigger') || has(t, 'imaptrigger')
}

function getPromptField(node: N8NNode): string | undefined {
  // Try common parameter names; fallback is handled by caller
  const p = node.parameters as any
  return p?.promptField || p?.prompt || p?.promptVariable || undefined
}

export function analyzeWorkflow(workflow: N8NWorkflow): AnalyzedWorkflow {
  const nodes = workflow.nodes || []
  const triggers: WorkflowTriggerInfo[] = []

  for (const node of nodes) {
    if (isChatTrigger(node)) {
      triggers.push({
        nodeId: node.id,
        nodeName: node.name,
        type: 'chat',
        webhookId: node.webhookId,
        isPublic: Boolean((node.parameters as any)?.public),
        requiresExternalClient: false,
        promptField: getPromptField(node) || 'chatInput'
      })
      continue
    }
    if (isWebhook(node)) {
      triggers.push({
        nodeId: node.id,
        nodeName: node.name,
        type: 'webhook',
        webhookId: node.webhookId,
        isPublic: true,
        requiresExternalClient: false
      })
      continue
    }
    if (isTelegramTrigger(node)) {
      triggers.push({
        nodeId: node.id,
        nodeName: node.name,
        type: 'telegram',
        isPublic: false,
        requiresExternalClient: true
      })
      continue
    }
    if (isSlackTrigger(node)) {
      triggers.push({
        nodeId: node.id,
        nodeName: node.name,
        type: 'slack',
        isPublic: false,
        requiresExternalClient: true
      })
      continue
    }
    if (isDiscordTrigger(node)) {
      triggers.push({
        nodeId: node.id,
        nodeName: node.name,
        type: 'discord',
        isPublic: false,
        requiresExternalClient: true
      })
      continue
    }
    if (isWhatsAppTrigger(node)) {
      triggers.push({
        nodeId: node.id,
        nodeName: node.name,
        type: 'whatsapp',
        isPublic: false,
        requiresExternalClient: true
      })
      continue
    }
    if (isEmailTrigger(node)) {
      triggers.push({
        nodeId: node.id,
        nodeName: node.name,
        type: 'email',
        isPublic: false,
        requiresExternalClient: true
      })
      continue
    }
    if (node.type === 'n8n-nodes-base.manualTrigger') {
      triggers.push({
        nodeId: node.id,
        nodeName: node.name,
        type: 'manual'
      })
      continue
    }
    if (node.type === 'n8n-nodes-base.cron') {
      triggers.push({
        nodeId: node.id,
        nodeName: node.name,
        type: 'cron'
      })
      continue
    }
  }

  return {
    workflowId: workflow.id,
    name: workflow.name,
    triggers,
    hasChat: triggers.some(t => t.type === 'chat'),
    hasWebhook: triggers.some(t => t.type === 'webhook'),
    hasTelegram: triggers.some(t => t.type === 'telegram')
  }
}
