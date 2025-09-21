import { NextRequest, NextResponse } from 'next/server'
import { n8nService } from '@/lib/services/n8n-service'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Get execution details
    const execution = await n8nService.getExecution(id)
    if (!execution.success || !execution.data) {
      return NextResponse.json(
        { error: 'Execution not found' },
        { status: 404 }
      )
    }

    // Extract AI agent results from execution data
    const aiResults: any[] = []

    const resultPayload: any = (execution.data as any)?.data
    const resultData: any = resultPayload?.resultData

    if (resultData && typeof resultData === 'object') {

      // Look for AI model nodes and their outputs
      const runData: Record<string, any> = (resultData as any).runData || {}
      Object.keys(runData).forEach(nodeName => {
        const nodeData = runData[nodeName]

        if (nodeData && Array.isArray(nodeData) && nodeData[0]) {
          const nodeResult = nodeData[0]

          // Check if this looks like an AI model output
          const nodeResultData = nodeResult.data
          if (nodeResultData && nodeResultData.main && nodeResultData.main[0]) {
            const outputs = nodeResultData.main[0]

            outputs.forEach((output: any, index: number) => {
              if (output.json && (output.json.response || output.json.text || output.json.message)) {
                aiResults.push({
                  id: `${nodeName}-${index}`,
                  nodeId: nodeName,
                  nodeName: nodeName,
                  type: 'text_response',
                  content: output.json.response || output.json.text || output.json.message,
                  timestamp: execution.data?.startedAt ?? new Date().toISOString(),
                  metadata: {
                    model: output.json.model || 'unknown',
                    confidence: output.json.confidence || 0.8,
                    executionTime: nodeResult.executionTime || 0,
                    tokens: output.json.tokens || undefined
                  }
                })
              }
            })
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      results: aiResults,
      executionId: id,
      metadata: {
        totalResults: aiResults.length,
        executionStatus: execution.data?.status ?? 'unknown',
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('AI results fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AI results' },
      { status: 500 }
    )
  }
}
