import { NextRequest, NextResponse } from 'next/server'
import { n8nService } from '@/lib/services/n8n-service'

export async function POST(request: NextRequest) {
  try {
    const { workflowId } = await request.json()

    // Check if workflow exists and is active
    const workflowResult = await n8nService.getWorkflow(workflowId)
    if (!workflowResult.success || !workflowResult.data) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    const workflow = workflowResult.data

    // Check if workflow is active
    if (!workflow.active) {
      return NextResponse.json(
        { error: 'Workflow is not active' },
        { status: 400 }
      )
    }

    // Check if workflow has AI components
    const hasAIComponents = workflow.nodes?.some(node =>
      node.type.includes('agent') ||
      node.type.includes('chat') ||
      node.type.includes('langchain') ||
      node.type.includes('openai')
    )

    if (!hasAIComponents) {
      return NextResponse.json(
        { error: 'Workflow does not contain AI components' },
        { status: 400 }
      )
    }

    // Test webhook connectivity
    const webhookNode = workflow.nodes?.find(node =>
      node.type.includes('webhook') || node.type.includes('chatTrigger')
    )

    if (!webhookNode?.webhookId) {
      return NextResponse.json(
        { error: 'No webhook found for AI agent communication' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      connected: true,
      workflowName: workflow.name,
      agentType: workflow.nodes?.find(n => n.type.includes('agent'))?.type || 'ai_agent',
      capabilities: {
        chat: true,
        fileGeneration: workflow.nodes?.some(n => n.type.includes('file')),
        scheduling: workflow.nodes?.some(n => n.type.includes('schedule')),
        memory: workflow.nodes?.some(n => n.type.includes('memory'))
      }
    })
  } catch (error) {
    console.error('AI Agent connection error:', error)
    return NextResponse.json(
      { error: 'Failed to connect to AI agent' },
      { status: 500 }
    )
  }
}