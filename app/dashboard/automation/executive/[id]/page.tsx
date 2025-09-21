import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Bot, Webhook, Activity } from "lucide-react";
import Link from "next/link";
import { n8nService } from '@/lib/services/n8n-service';
import { WorkflowAnalyzer, type WorkflowInsight } from '@/lib/services/workflow-analyzer';
import { ExecutionController, type LiveMonitoring } from '@/lib/services/execution-controller';
import { ExecutiveDetailView } from '@/components/automation/executive-detail-view';
import { analyzeWorkflow, type AnalyzedWorkflow } from '@/lib/services/workflow-introspector';

interface ExecutiveWorkflowPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function fetchExecutiveData(workflowId: string): Promise<{
  insight: WorkflowInsight | null
  monitoring: LiveMonitoring | null
  introspection: AnalyzedWorkflow | null
  error?: string
}> {
  try {
    // Fetch workflow and execution data in parallel
    const [workflowResult, executionsResult] = await Promise.allSettled([
      n8nService.getWorkflow(workflowId),
      n8nService.getExecutions(workflowId, 100)
    ])

    const workflow = workflowResult.status === 'fulfilled' && workflowResult.value.success
      ? workflowResult.value.data
      : null

    const executions = executionsResult.status === 'fulfilled' && executionsResult.value.success
      ? executionsResult.value.data || []
      : []

    if (!workflow) {
      return { insight: null, monitoring: null, introspection: null, error: 'Workflow not found' }
    }

    // Analyze workflow for executive insights
    const insight = WorkflowAnalyzer.analyzeWorkflow(workflow, executions)

    // Get live monitoring data
    const monitoring = await ExecutionController.getLiveMonitoring(workflowId)
    const introspection = analyzeWorkflow(workflow)

    return { insight, monitoring, introspection }
  } catch (error) {
    console.error('Error fetching executive data:', error)
    return {
      insight: null,
      monitoring: null,
      introspection: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export default async function ExecutiveWorkflowPage({ params }: ExecutiveWorkflowPageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { insight, monitoring, introspection, error } = await fetchExecutiveData(id);

  if (error || !insight || !monitoring || !introspection) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/automation">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück
            </Link>
          </Button>
        </div>
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="pt-6">
            <p className="text-red-600">
              {error || 'Workflow-Daten konnten nicht geladen werden'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { workflow, category, capabilities, businessMetrics } = insight
  const categoryIcon = category === 'ai_agent' ? Bot :
                      category === 'webhook_service' ? Webhook :
                      Activity

  return (
    <div className="space-y-8">
      {/* Header - Mobile Responsive */}
      <div className="space-y-4">
        {/* Back Button */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/automation">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück
            </Link>
          </Button>
        </div>

        {/* Title Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              {React.createElement(categoryIcon, { className: "w-6 h-6 text-primary" })}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold truncate">{workflow.name}</h1>
              <p className="text-muted-foreground text-sm sm:text-base">{businessMetrics.description}</p>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant={workflow.active ? "default" : "secondary"}>
              {workflow.active ? 'Aktiv' : 'Inaktiv'}
            </Badge>
            {monitoring.isRunning && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <div className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse" />
                Läuft
              </Badge>
            )}
          </div>
        </div>
      </div>

      <ExecutiveDetailView insight={insight} triggers={introspection.triggers} monitoring={monitoring} workflowId={id} />
    </div>
  )
}
