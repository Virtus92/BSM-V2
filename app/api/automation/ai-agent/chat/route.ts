import { NextRequest, NextResponse } from 'next/server'
import { sendChatToAgent } from '@/lib/services/ai-agent'

export async function POST(request: NextRequest) {
  try {
    const { workflowId, message, userId, timestamp, triggerNodeId } = await request.json()
    const r = await sendChatToAgent({ workflowId, message, userId, timestamp, triggerNodeId, waitForResultMs: 60000 })
    return NextResponse.json({ success: true, status: 'completed', response: r.response, metadata: r.metadata, raw: r.raw })
  } catch (error) {
    console.error('AI Agent chat error:', error)
    return NextResponse.json(
      { error: 'Failed to communicate with AI agent' },
      { status: 500 }
    )
  }
}
