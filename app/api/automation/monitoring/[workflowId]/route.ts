import { NextRequest, NextResponse } from 'next/server'
import { ExecutionController } from '@/lib/services/execution-controller'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  try {
    const { workflowId } = await params

    // Get fresh live monitoring data
    const monitoring = await ExecutionController.getLiveMonitoring(workflowId)

    return NextResponse.json(monitoring)
  } catch (error) {
    console.error('Monitoring API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch monitoring data' },
      { status: 500 }
    )
  }
}