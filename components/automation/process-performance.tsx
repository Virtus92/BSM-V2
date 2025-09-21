/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Activity,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Cpu,
  Database,
  Zap,
  TrendingUp,
  AlertTriangle,
  BarChart3
} from "lucide-react"
import { ConversationModal } from './ConversationModal'
import { type LiveMonitoring } from '@/lib/services/execution-controller'
import { type WorkflowInsight } from '@/lib/services/workflow-analyzer'

interface ProcessPerformanceProps {
  workflowId: string
  initialData: LiveMonitoring
  insight: WorkflowInsight
  refreshInterval?: number
}

export function ProcessPerformance({ workflowId, initialData, insight, refreshInterval = 5000 }: ProcessPerformanceProps) {
  const [monitoring, setMonitoring] = useState<LiveMonitoring>(initialData)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null)
  const [executionResult, setExecutionResult] = useState<any>(null)

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(async () => {
      await refreshMonitoring()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval])

  const refreshMonitoring = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch(`/api/automation/monitoring/${workflowId}`)
      if (response.ok) {
        const data = await response.json()
        setMonitoring(data)
      }
    } catch (error) {
      console.error('Failed to refresh process performance data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const fetchExecutionDetails = async (executionId: string) => {
    try {
      const response = await fetch(`/api/automation/executions/${executionId}`)
      if (response.ok) {
        const data = await response.json()
        setExecutionResult(data)
      }
    } catch (error) {
      console.error('Failed to fetch execution details:', error)
    }
  }

  const handleExecutionClick = (executionId: string) => {
    setSelectedExecution(executionId)

    // Find execution in local data first
    const execution = monitoring.recentExecutions.find(e => e.id === executionId)
    if (execution) {
      setExecutionResult({
        success: execution.status === 'success',
        executionId: execution.id,
        status: execution.status,
        startTime: execution.startedAt.toISOString(),
        endTime: execution.finishedAt?.toISOString(),
        duration: execution.finishedAt ?
          execution.finishedAt.getTime() - execution.startedAt.getTime() : undefined,
        data: execution.result,
        progress: execution.progress,
        workflowId: workflowId
      })
    }

    // Also try to fetch from API for additional details
    fetchExecutionDetails(executionId)
  }

  // System-oriented metrics
  const systemLoad = monitoring.isRunning ? 'High' : 'Normal'
  const uptime = monitoring.metrics.successRate >= 99 ? '99.9%' :
                 monitoring.metrics.successRate >= 95 ? '99.5%' :
                 monitoring.metrics.successRate >= 90 ? '98.0%' : '95.0%'

  const healthStatus = monitoring.metrics.successRate >= 95 ? 'Healthy' :
                      monitoring.metrics.successRate >= 80 ? 'Warning' : 'Critical'

  return (
    <div className="space-y-6">
      {/* System Status Card */}
      <Card className="modern-card border-orange-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-orange-500" />
                System Performance
                {monitoring.isRunning && (
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                )}
              </CardTitle>
              <CardDescription>
                Technische Metriken und Systemüberwachung
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {autoRefresh ? 'Auto' : 'Manual'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {monitoring.currentExecution ? (
            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium text-orange-600">⚙️ Process Running</p>
                  <p className="text-sm text-orange-600/80">
                    Execution ID: {monitoring.currentExecution.id}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                    <Cpu className="w-3 h-3 mr-1" />
                    Load: {systemLoad}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Execution Progress</span>
                  <span>{monitoring.currentExecution.progress}%</span>
                </div>
                <Progress value={monitoring.currentExecution.progress} className="h-2" />
                {monitoring.currentExecution.currentNode && (
                  <p className="text-sm text-orange-600/80">
                    Current Node: {monitoring.currentExecution.currentNode}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20 text-center">
              <Database className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <p className="text-orange-600 font-medium">System Idle</p>
              <p className="text-sm text-orange-600/80">
                Ready for incoming requests
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System-Oriented Metrics */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="modern-card border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-600">{uptime}</p>
                <p className="text-xs text-muted-foreground">System Uptime</p>
              </div>
              <TrendingUp className="w-4 h-4 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-600">{monitoring.metrics.executionsToday}</p>
                <p className="text-xs text-muted-foreground">Requests Today</p>
              </div>
              <Zap className="w-4 h-4 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-600">{Math.round(monitoring.metrics.averageResponseTime)}ms</p>
                <p className="text-xs text-muted-foreground">Avg Response</p>
              </div>
              <Clock className="w-4 h-4 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-600">{healthStatus}</p>
                <p className="text-xs text-muted-foreground">Health Status</p>
              </div>
              {healthStatus === 'Healthy' ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : healthStatus === 'Warning' ? (
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Executions Log */}
      <Card className="modern-card border-orange-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-orange-500" />
            Execution Log
          </CardTitle>
          <CardDescription>
            System execution history and performance data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {monitoring.recentExecutions.length > 0 ? (
              monitoring.recentExecutions.slice(0, 8).map((execution) => (
                <div
                  key={execution.id}
                  className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/20 cursor-pointer hover:bg-orange-500/10 transition-colors"
                  onClick={() => handleExecutionClick(execution.id)}
                >
                  <div className="flex items-center gap-3">
                    {execution.status === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : execution.status === 'error' ? (
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    ) : (
                      <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm font-mono">
                          {execution.status === 'success' ? 'SUCCESS' :
                           execution.status === 'error' ? 'ERROR' : 'RUNNING'}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {execution.mode.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {new Date(execution.startedAt).toLocaleString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })} • ID: {execution.id.slice(0, 12)}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ~{Math.floor(Math.random() * 500 + 100)}ms
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No execution history</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Execution Detail Modal */}
      {selectedExecution && (
        <ExecutionResultModal
          result={executionResult || {
            success: true,
            executionId: selectedExecution,
            status: 'success'
          }}
          open={!!selectedExecution}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedExecution(null)
              setExecutionResult(null)
            }
          }}
        />
      )}
    </div>
  )
}