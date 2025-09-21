import { NextResponse } from 'next/server'
import { n8nService } from '@/lib/services/n8n-service'
import { WorkflowAnalyzer } from '@/lib/services/workflow-analyzer'
import { analyzeWorkflow as introspect } from '@/lib/services/workflow-introspector'

export async function GET() {
  try {
    // Parallel API calls for better performance
    const [workflowsResult, executionsResult] = await Promise.allSettled([
      n8nService.getWorkflows(),
      n8nService.getExecutions(undefined, 200)
    ])

    const workflows = workflowsResult.status === 'fulfilled' && workflowsResult.value.success
      ? workflowsResult.value.data || []
      : []

    const executions = executionsResult.status === 'fulfilled' && executionsResult.value.success
      ? executionsResult.value.data || []
      : []

    // Analyze each workflow with real data
    const insights = workflows.map(workflow => {
      const workflowExecutions = executions.filter(e => e.workflowId === workflow.id)
      const insight = WorkflowAnalyzer.analyzeWorkflow(workflow, workflowExecutions)
      const ix = introspect(workflow)
      return { ...insight, triggers: ix.triggers }
    })

    return NextResponse.json({
      insights,
      totalWorkflows: workflows.length,
      activeWorkflows: workflows.filter(w => w.active).length,
      totalExecutions: executions.length
    })
  } catch (error) {
    console.error('Error fetching automation workflows:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch workflows',
        insights: [],
        totalWorkflows: 0,
        activeWorkflows: 0,
        totalExecutions: 0
      },
      { status: 500 }
    )
  }
}
