import { NextRequest, NextResponse } from 'next/server'
import { ExecutionController } from '@/lib/services/execution-controller'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Stop the execution
    const success = await ExecutionController.stopExecution(id)

    if (success) {
      return NextResponse.json({ success: true, message: 'Execution stopped' })
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to stop execution' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Stop execution API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to stop execution' },
      { status: 500 }
    )
  }
}