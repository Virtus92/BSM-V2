import { NextRequest, NextResponse } from 'next/server'
import { ExecutionController } from '@/lib/services/execution-controller'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get detailed execution logs
    const result = await ExecutionController.getExecutionLogs(id)

    if (result.success) {
      return NextResponse.json(result.data)
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch execution logs' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Execution logs API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch execution logs' },
      { status: 500 }
    )
  }
}