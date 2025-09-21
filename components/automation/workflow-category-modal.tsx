'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Bot,
  Webhook,
  Database,
  Workflow,
  Bell,
  Play,
  TestTube,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight
} from "lucide-react"
import { type WorkflowInsight, type WorkflowCategory } from '@/lib/services/workflow-analyzer'
import Link from 'next/link'

interface WorkflowCategoryModalProps {
  category: WorkflowCategory
  workflows: WorkflowInsight[]
  isOpen: boolean
  onClose: () => void
}

const categoryConfig = {
  ai_agent: {
    icon: Bot,
    title: 'AI Agents',
    description: 'Intelligente Konversations-Assistenten',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20'
  },
  webhook_service: {
    icon: Webhook,
    title: 'API Services',
    description: 'Webhook-basierte Integrationen',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20'
  },
  data_processor: {
    icon: Database,
    title: 'Data Processing',
    description: 'Datenverarbeitung und -transformation',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20'
  },
  automation_pipeline: {
    icon: Workflow,
    title: 'Automation',
    description: 'Geschäftsprozess-Automatisierung',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20'
  },
  notification_system: {
    icon: Bell,
    title: 'Notifications',
    description: 'Benachrichtigungs-Systeme',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20'
  }
}

export function WorkflowCategoryModal({ category, workflows, isOpen, onClose }: WorkflowCategoryModalProps) {
  const config = categoryConfig[category]
  const Icon = config.icon

  // Calculate category statistics
  const totalExecutions = workflows.reduce((sum, w) => sum + w.executionHistory.total, 0)
  const avgSuccessRate = workflows.length > 0
    ? Math.round(workflows.reduce((sum, w) => {
        const rate = w.executionHistory.total > 0
          ? (w.executionHistory.successful / w.executionHistory.total) * 100
          : 0
        return sum + rate
      }, 0) / workflows.length)
    : 0
  const activeWorkflows = workflows.filter(w => w.workflow.active).length

  const executeWorkflow = async (workflow: WorkflowInsight) => {
    // Quick execution for testing
    try {
      const response = await fetch('/api/automation/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: workflow.workflow.id,
          type: 'test'
        })
      })

      if (response.ok) {
        const result = await response.json()
        // Show result notification or update UI
        console.log('Execution result:', result)
      }
    } catch (error) {
      console.error('Execution failed:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${config.bgColor} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold">{config.title}</h2>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 py-4">
          <Card className={`${config.bgColor} ${config.borderColor} border`}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{workflows.length}</p>
              <p className="text-xs text-muted-foreground">Workflows</p>
            </CardContent>
          </Card>
          <Card className={`${config.bgColor} ${config.borderColor} border`}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-500">{activeWorkflows}</p>
              <p className="text-xs text-muted-foreground">Aktiv</p>
            </CardContent>
          </Card>
          <Card className={`${config.bgColor} ${config.borderColor} border`}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{avgSuccessRate}%</p>
              <p className="text-xs text-muted-foreground">Erfolgsrate</p>
            </CardContent>
          </Card>
        </div>

        {/* Workflow List */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {workflows.map((workflow) => (
            <Card key={workflow.workflow.id} className="modern-card hover:shadow-lg transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold">{workflow.workflow.name}</h3>
                        <p className="text-sm text-muted-foreground">{workflow.businessMetrics.description}</p>
                      </div>
                    </div>

                    {/* Quick Metrics */}
                    <div className="grid grid-cols-4 gap-3 mb-3">
                      {workflow.businessMetrics.kpis.slice(0, 4).map((kpi, index) => (
                        <div key={index} className="text-center p-2 rounded bg-white/[0.02]">
                          <p className="text-sm font-bold">{kpi.value}</p>
                          <p className="text-xs text-muted-foreground">{kpi.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Status & Last Execution */}
                    <div className="flex items-center gap-4 text-sm">
                      <Badge variant={workflow.workflow.active ? "default" : "secondary"}>
                        {workflow.workflow.active ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                      {workflow.executionHistory.lastExecution && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>Zuletzt: {workflow.executionHistory.lastExecution.toLocaleString('de-DE')}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        {workflow.executionHistory.total > 0 && (
                          <>
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span className="text-green-500">{workflow.executionHistory.successful}</span>
                            <XCircle className="w-3 h-3 text-red-500 ml-2" />
                            <span className="text-red-500">{workflow.executionHistory.failed}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    {/* Context-specific Quick Action */}
                    {category === 'ai_agent' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {/* Open AI chat */}}
                        className="gap-2"
                      >
                        <Bot className="w-3 h-3" />
                        Chat
                      </Button>
                    )}

                    {category === 'webhook_service' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => executeWorkflow(workflow)}
                        className="gap-2"
                      >
                        <TestTube className="w-3 h-3" />
                        Test
                      </Button>
                    )}

                    <Button
                      size="sm"
                      onClick={() => executeWorkflow(workflow)}
                      className="mystery-button gap-2"
                    >
                      <Play className="w-3 h-3" />
                      Run
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      asChild
                    >
                      <Link href={`/dashboard/automation/executive/${workflow.workflow.id}`}>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Progress Bar for Active Executions */}
                {workflow.executionHistory.total > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Performance</span>
                      <span>{Math.round((workflow.executionHistory.successful / workflow.executionHistory.total) * 100)}%</span>
                    </div>
                    <Progress
                      value={(workflow.executionHistory.successful / workflow.executionHistory.total) * 100}
                      className="h-1.5"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {workflows.length} Workflows • {totalExecutions} Ausführungen gesamt
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Schließen
            </Button>
            <Button className="mystery-button">
              Alle Details
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
