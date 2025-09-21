import type { WorkflowInsight } from '@/lib/services/workflow-analyzer'

export type ExecutiveView = 'digital_employee' | 'process'

// Classify into the two mental models - ALWAYS prioritize digital_employee if available
export function classifyView(insight: WorkflowInsight, externalTriggers?: any[]): ExecutiveView {
  // Use external triggers if provided, fallback to insight.triggers, then empty array
  const triggers = externalTriggers || insight.triggers || []
  const chatLike = ['chat','telegram','slack','discord','whatsapp','email']
  const hasInteractive = triggers.some((t: any) => chatLike.includes(t.type))

  // ALWAYS prioritize digital_employee if chat-like triggers exist
  if (hasInteractive) return 'digital_employee'

  // Check if this could be an AI agent without chat triggers
  if (insight.capabilities.hasAIComponents) return 'digital_employee'

  return 'process'
}

export function getAvailableViews(insight: WorkflowInsight, externalTriggers?: any[]): ExecutiveView[] {
  // Use external triggers if provided, fallback to insight.triggers, then empty array
  const triggers = externalTriggers || insight.triggers || []
  const chatLike = ['chat','telegram','slack','discord','whatsapp','email']
  const hasInteractive = triggers.some((t: any) => chatLike.includes(t.type))
  const hasProcess = insight.capabilities.hasWebhookTrigger || insight.capabilities.hasScheduledTrigger || insight.capabilities.hasDataProcessing || !hasInteractive
  const views: ExecutiveView[] = []
  if (hasInteractive) views.push('digital_employee')
  if (hasProcess) views.push('process')
  return views.length ? views : [classifyView(insight, externalTriggers)]
}

export function getViewTheme(view: ExecutiveView) {
  if (view === 'digital_employee') {
    return {
      tint: 'text-purple-500',
      bgSoft: 'bg-purple-500/10',
      borderSoft: 'border-purple-500/20',
      header: 'from-black to-purple-950/40',
    }
  }
  return {
    tint: 'text-orange-500',
    bgSoft: 'bg-orange-500/10',
    borderSoft: 'border-orange-500/20',
    header: 'from-black to-orange-950/40',
  }
}

export interface ExecutiveStatus {
  label: string
  tone: 'good' | 'warn' | 'bad' | 'idle'
  details?: string
}

// Map technical history to a manager-friendly status line
export function getExecutiveStatus(insight: WorkflowInsight): ExecutiveStatus {
  const { executionHistory, workflow } = insight
  const total = executionHistory.total || 0
  const ok = executionHistory.successful || 0
  const failed = executionHistory.failed || 0
  const successRate = total > 0 ? (ok / total) * 100 : 0
  const last = executionHistory.lastExecution ? new Date(executionHistory.lastExecution) : null

  if (!workflow.active) {
    return { label: 'Offline', tone: 'idle', details: 'Deaktiviert' }
  }

  if (failed > 0 && successRate < 80) {
    return { label: 'Problem', tone: 'bad', details: 'Mehrere Fehler erkannt' }
  }

  if (last) {
    const minutes = Math.round((Date.now() - last.getTime()) / 60000)
    if (minutes <= 5) {
      return { label: 'Aktiv', tone: 'good', details: 'Vor Kurzem ausgeführt' }
    }
    if (minutes <= 120) {
      return { label: 'Bereit', tone: 'idle', details: `Zuletzt vor ${minutes} Min.` }
    }
  }

  // Webhook services are often idle until called
  if (insight.capabilities.hasWebhookTrigger) {
    return { label: 'Bereit', tone: 'idle', details: 'Wartet auf Anfragen' }
  }

  // Fallback
  return { label: successRate >= 95 ? 'Stabil' : successRate >= 80 ? 'Zuverlässig' : 'Auffällig', tone: successRate >= 80 ? 'good' : 'warn' }
}
