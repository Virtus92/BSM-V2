import { NextRequest, NextResponse } from 'next/server'
import { ExecutionController } from '@/lib/services/execution-controller'

export async function POST(request: NextRequest) {
  try {
    const { workflowId, type, payload } = await request.json()

    if (!workflowId) {
      return NextResponse.json(
        { error: 'Workflow ID is required' },
        { status: 400 }
      )
    }

    const executionType = type || 'test'
    if (!['manual', 'webhook', 'test'].includes(executionType)) {
      return NextResponse.json(
        { error: 'Invalid execution type. Must be manual, webhook, or test' },
        { status: 400 }
      )
    }

    // Execute the workflow
    const result = await ExecutionController.executeWorkflow({
      workflowId,
      executionType,
      payload
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Workflow execution error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown execution error'
      },
      { status: 500 }
    )
  }
}