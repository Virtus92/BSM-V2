/* eslint-disable @typescript-eslint/no-explicit-any */
import { n8nService } from '@/lib/services/n8n-service'
import { analyzeWorkflow } from '@/lib/services/workflow-introspector'

export async function sendChatToAgent(opts: {
  workflowId: string
  message: string
  userId?: string
  timestamp?: string
  triggerNodeId?: string
  waitForResultMs?: number
}) {
  const { workflowId, message, userId = 'executive-dashboard', timestamp = new Date().toISOString(), triggerNodeId, waitForResultMs = 8000 } = opts

  const workflowResult = await n8nService.getWorkflow(workflowId)
  if (!workflowResult.success || !workflowResult.data) {
    throw new Error('Workflow not found')
  }

  const workflow = workflowResult.data
  const analysis = analyzeWorkflow(workflow)

  const chatTrigger = (triggerNodeId
    ? analysis.triggers.find(t => t.nodeId === triggerNodeId && (t.type === 'chat' || t.type === 'webhook') && t.webhookId)
    : undefined)
    || analysis.triggers.find(t => t.type === 'chat' && t.webhookId)
    || analysis.triggers.find(t => t.type === 'webhook' && t.webhookId)

  if (!chatTrigger?.webhookId) {
    throw new Error('No suitable trigger found for chat')
  }

  const isChatTrigger = chatTrigger.type === 'chat'
  const baseRoot = (process.env.N8N_BASE_URL || '').replace(/\/$/, '')
  const liveBase = process.env.N8N_WEBHOOK_URL || (baseRoot ? `${baseRoot}/webhook` : '')
  const testBase = process.env.N8N_WEBHOOK_TEST_URL || (baseRoot ? `${baseRoot}/webhook-test` : '')
  const chosenBase = workflow.active ? liveBase : testBase
  if (!chosenBase) {
    throw new Error('N8N webhook base URLs not configured')
  }

  // Prefer non-/chat endpoint for synchronous Respond nodes; fallback to /chat for special setups
  const primaryUrl = `${chosenBase}/${chatTrigger.webhookId}`
  const altUrl = `${chosenBase}/${chatTrigger.webhookId}/chat`

  const bodyPayload: Record<string, any> = {
    [(chatTrigger.promptField || 'chatInput')]: message,
    message,
    text: message,
    input: message,
    user: userId,
    timestamp,
    source: 'automation-dashboard',
    sessionId: `exec-${Date.now()}`
  }

  const send = async (url: string) => fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bodyPayload)
  })

  let response = await send(primaryUrl)
  if (response.status === 404) {
    // Try /chat variant
    response = await send(altUrl)
    if (response.status === 404) {
      // Try switching base (live<->test)
      const otherBase = chosenBase === liveBase ? testBase : liveBase
      if (otherBase) {
        const fallbackPrimary = `${otherBase}/${chatTrigger.webhookId}`
        const fallbackAlt = `${otherBase}/${chatTrigger.webhookId}/chat`
        response = await send(fallbackPrimary)
        if (response.status === 404) {
          response = await send(fallbackAlt)
        }
      }
    }
  }

  const rawText = await response.text().catch(() => '')
  if (!response.ok) {
    const reason = rawText || response.statusText || 'Unknown error'
    throw new Error(`AI Agent webhook failed: ${reason}`)
  }

  let result: any = rawText
  try { result = rawText ? JSON.parse(rawText) : {} } catch {}

  // Try to resolve an AI response by polling recent execution
  let responseText: string | undefined
  let executionId: string | undefined
  const deadline = Date.now() + Math.max(0, waitForResultMs)

  while (Date.now() < deadline && !responseText) {
    const executionsResult = await n8nService.getExecutions(workflowId, 1)
    const latest = executionsResult.success ? executionsResult.data?.[0] : undefined
    if (latest?.id) {
      executionId = latest.id
      const exec = await n8nService.getExecution(latest.id)
      if (exec.success && exec.data) {
        // Parse runData for AI text responses
        try {
          const payload: any = (exec.data as any)?.data
          const runData: Record<string, any> | undefined = payload?.resultData?.runData
          if (runData) {
            for (const nodeName of Object.keys(runData)) {
              const nodeArr = runData[nodeName]
              if (Array.isArray(nodeArr) && nodeArr[0]?.data?.main?.[0]) {
                const outputs = nodeArr[0].data.main[0]
                for (const output of outputs) {
                  const txt = output?.json?.response || output?.json?.text || output?.json?.message || output?.json?.output
                  if (typeof txt === 'string' && txt.trim()) {
                    responseText = txt
                    break
                  }
                }
              }
              if (responseText) break
            }
          }
          // If execution finished and no text found, break
          if ((exec.data as any)?.status && (exec.data as any)?.status !== 'running' && !responseText) {
            break
          }
        } catch { /* ignore parse errors */ }
      }
    }
    if (!responseText) {
      await new Promise(r => setTimeout(r, 700))
    }
  }

  const immediateText = (typeof result === 'string' ? result : (result.response || result.message || result.text || result.output || result.data?.response || result.data?.message || result.data?.output))
  const finalResponse = responseText || immediateText

  if (!finalResponse) {
    // No meaningful text found within wait window → throw error
    throw new Error(`AI Agent did not respond within ${waitForResultMs}ms. Please check the N8N workflow has a "Respond to Webhook" node.`)
  }

  return {
    status: 'completed' as const,
    response: finalResponse,
    metadata: {
      executionId,
      workflowName: workflow.name,
      timestamp: new Date().toISOString()
    },
    raw: result
  }
}
