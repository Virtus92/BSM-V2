import { NextRequest, NextResponse } from 'next/server'
import { ExecutionController } from '@/lib/services/execution-controller'
import { n8nService } from '@/lib/services/n8n-service'
import { analyzeWorkflow } from '@/lib/services/workflow-introspector'
import { resolveTrigger } from '@/lib/services/intent-resolver'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({})) as {
      type?: 'manual' | 'webhook' | 'test'
      payload?: Record<string, unknown>
      triggerType?: 'chat' | 'webhook' | 'manual'
      triggerNodeId?: string
    }

    const executionType = body.type || 'test'
    const payload = body.payload || {}
    const triggerType = body.triggerType
    const triggerNodeId = body.triggerNodeId

    // Analyze triggers first to choose valid entrypoint and reduce 404s
    const wf = await n8nService.getWorkflow(id)
    if (!wf.success || !wf.data) {
      return NextResponse.json({ success: false, error: 'Workflow not found' }, { status: 404 })
    }
    const ix = analyzeWorkflow(wf.data)
    const hasWebhook = ix.triggers.some(t => t.type === 'webhook' && t.webhookId)
    const hasManual = ix.triggers.some(t => t.type === 'manual')
    const hasChat = ix.triggers.some(t => t.type === 'chat' && t.webhookId)

    const looksLikeChat = (p: Record<string, unknown>) => {
      const msg = (p as any)?.message || (p as any)?.text || (p as any)?.chatInput
      return typeof msg === 'string' && msg.trim().length > 0
    }

    // Explicit type requests
    if (executionType === 'webhook') {
      if (!hasWebhook) return NextResponse.json({ success: false, error: 'No webhook trigger found' }, { status: 400 })
      const r = await ExecutionController.runWebhook(id, payload, { triggerNodeId })
      return NextResponse.json({ success: true, ...r }, { status: 200 })
    }
    if (executionType === 'manual') {
      if (!hasManual) return NextResponse.json({ success: false, error: 'No manual trigger found' }, { status: 400 })
      const r = await ExecutionController.runManual(id, payload)
      return NextResponse.json({ success: true, ...r }, { status: 200 })
    }

    // Test: intelligent routing using resolver
    const resolved = resolveTrigger(wf.data, ix, {
      explicitType: triggerType,
      explicitNodeId: triggerNodeId,
      payload: payload as Record<string, unknown>
    })

    // 1) Chat: proxy to AI chat route
    if (resolved.kind === 'chat' && hasChat) {
      const { sendChatToAgent } = await import('@/lib/services/ai-agent')
      const r = await sendChatToAgent({
        workflowId: id,
        message: (payload as any)?.message || (payload as any)?.text || (payload as any)?.chatInput || 'Hallo',
        userId: 'executive-dashboard',
        timestamp: new Date().toISOString(),
        triggerNodeId: resolved.node?.nodeId || triggerNodeId,
        waitForResultMs: 9000
      })
      if (r.status === 'pending') {
        return NextResponse.json({ success: true, status: 'pending', executionId: r.metadata.executionId })
      }
      return NextResponse.json({ success: true, status: 'completed', data: r, executionId: r.metadata.executionId })
    }

    // 2) Webhook
    if (resolved.kind === 'webhook' && hasWebhook) {
      try {
        const r = await ExecutionController.runWebhook(id, payload, { triggerNodeId: resolved.node?.nodeId || triggerNodeId })
        return NextResponse.json({ success: true, ...r }, { status: 200 })
      } catch (e) {
        if (hasManual) {
          try {
            const r2 = await ExecutionController.runManual(id, payload)
            return NextResponse.json({ success: true, ...r2 }, { status: 200 })
          } catch (e2) {
            const wErr = e instanceof Error ? e.message : String(e)
            const mErr = e2 instanceof Error ? e2.message : String(e2)
            return NextResponse.json({ success: false, error: `Execution failed. Webhook: ${wErr}. Manual: ${mErr}` }, { status: 500 })
          }
        }
        const wErr = e instanceof Error ? e.message : String(e)
        return NextResponse.json({ success: false, error: `Webhook execution failed: ${wErr}` }, { status: 500 })
      }
    }
    // 3) Manual
    if (resolved.kind === 'manual' && hasManual) {
      try {
        const r = await ExecutionController.runManual(id, payload)
        return NextResponse.json({ success: true, ...r }, { status: 200 })
      } catch (e) {
        const mErr = e instanceof Error ? e.message : String(e)
        return NextResponse.json({ success: false, error: `Manual execution failed: ${mErr}` }, { status: 500 })
      }
    }
    return NextResponse.json({ success: false, error: 'No triggerable entrypoint (chat/webhook/manual) found' }, { status: 400 })
  } catch (error) {
    console.error('Execute workflow API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to execute workflow' },
      { status: 500 }
    )
  }
}
