/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
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
  Eye,
  Square,
  Play,
  TrendingUp,
  AlertTriangle,
  Zap
} from "lucide-react"
import { type LiveMonitoring } from '@/lib/services/execution-controller'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface LiveMonitoringProps {
  workflowId: string
  initialData: LiveMonitoring
  refreshInterval?: number
}

interface ExecutionLog {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'success'
  message: string
  nodeId?: string
  nodeName?: string
  data?: any
}

export function LiveMonitoringComponent({ workflowId, initialData, refreshInterval = 5000 }: LiveMonitoringProps) {
  const [monitoring, setMonitoring] = useState<LiveMonitoring>(initialData)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([])
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null)
  const [selectedDetails, setSelectedDetails] = useState<any | null>(null)

  const openExecutionDetails = async (executionId: string) => {
    setSelectedExecutionId(executionId)
    setDetailsOpen(true)
    try {
      const [execRes, aiRes] = await Promise.all([
        fetch(`/api/automation/executions/${executionId}`),
        fetch(`/api/automation/executions/${executionId}/ai-results`)
      ])
      const execJson = execRes.ok ? await execRes.json() : null
      const aiJson = aiRes.ok ? await aiRes.json() : null
      setSelectedDetails({ execution: execJson, ai: aiJson })
    } catch {
      setSelectedDetails(null)
    }
  }

  // Simulate real-time updates (in production this would be WebSocket)
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
      // In production, this would call the actual API
      const response = await fetch(`/api/automation/monitoring/${workflowId}`)
      if (response.ok) {
        const data = await response.json()
        setMonitoring(data)

        // Add execution logs if there are new executions
        if (data.currentExecution && !monitoring.currentExecution) {
          addLog('info', `Execution started: ${data.currentExecution.id}`)
        }
      }
    } catch (error) {
      addLog('error', 'Failed to refresh monitoring data')
    } finally {
      setIsRefreshing(false)
    }
  }

  const addLog = (level: ExecutionLog['level'], message: string, nodeInfo?: { id: string, name: string }) => {
    const log: ExecutionLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      nodeId: nodeInfo?.id,
      nodeName: nodeInfo?.name
    }
    setExecutionLogs(prev => [log, ...prev.slice(0, 99)]) // Keep last 100 logs
  }

  const stopCurrentExecution = async () => {
    if (!monitoring.currentExecution) return

    try {
      const response = await fetch(`/api/automation/executions/${monitoring.currentExecution.id}/stop`, {
        method: 'POST'
      })

      if (response.ok) {
        addLog('warn', `Execution stopped by user: ${monitoring.currentExecution.id}`)
        await refreshMonitoring()
      }
    } catch (error) {
      addLog('error', 'Failed to stop execution')
    }
  }

  const getLogIcon = (level: ExecutionLog['level']) => {
    switch (level) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />
      case 'warn': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      default: return <Activity className="w-4 h-4 text-blue-500" />
    }
  }

  const formatDuration = (start: Date) => {
    const now = new Date()
    const diff = now.getTime() - start.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)

    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    }
    return `${seconds}s`
  }

  return (
    <div className="space-y-6">
      {/* Live Status Header */}
      <Card className="modern-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Live Monitoring
                {monitoring.isRunning && (
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                )}
              </CardTitle>
              <CardDescription>
                Echtzeitüberwachung der Workflow-Ausführungen
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
              <Button
                variant="outline"
                size="sm"
                onClick={refreshMonitoring}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {monitoring.currentExecution ? (
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium text-green-600">Aktive Ausführung</p>
                  <p className="text-sm text-green-600/80">
                    ID: {monitoring.currentExecution.id}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    Läuft seit {formatDuration(monitoring.currentExecution.startedAt)}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={stopCurrentExecution}
                    className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                  >
                    <Square className="w-3 h-3 mr-1" />
                    Stop
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Fortschritt</span>
                  <span>{monitoring.currentExecution.progress}%</span>
                </div>
                <Progress value={monitoring.currentExecution.progress} className="h-2" />
                {monitoring.currentExecution.currentNode && (
                  <p className="text-sm text-green-600/80">
                    Aktueller Schritt: {monitoring.currentExecution.currentNode}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center">
              <Zap className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Keine aktive Ausführung</p>
              <p className="text-sm text-muted-foreground/60">
                Workflow ist bereit für neue Ausführungen
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="modern-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-500">{monitoring.metrics.executionsToday}</p>
                <p className="text-xs text-muted-foreground">Heute ausgeführt</p>
              </div>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{monitoring.metrics.successRate}%</p>
                <p className="text-xs text-muted-foreground">Erfolgsrate</p>
              </div>
              <CheckCircle className={`w-4 h-4 ${
                monitoring.metrics.successRate >= 95 ? 'text-green-500' :
                monitoring.metrics.successRate >= 80 ? 'text-yellow-500' :
                'text-red-500'
              }`} />
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{Math.round(monitoring.metrics.averageResponseTime / 1000)}s</p>
                <p className="text-xs text-muted-foreground">Ø Antwortzeit</p>
              </div>
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-500">{monitoring.metrics.errorCount}</p>
                <p className="text-xs text-muted-foreground">Fehler heute</p>
              </div>
              <XCircle className="w-4 h-4 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Executions */}
      <Card className="modern-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Letzte Ausführungen
          </CardTitle>
          <CardDescription>
            Historie und Status der letzten Workflow-Runs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {monitoring.recentExecutions.length > 0 ? (
              monitoring.recentExecutions.slice(0, 10).map((execution) => (
                <div key={execution.id} className="p-2 sm:p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-colors">
                  {/* Mobile-first responsive layout */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    {/* Status and main info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {execution.status === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : execution.status === 'error' ? (
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      ) : (
                        <RefreshCw className="w-5 h-5 text-yellow-500 animate-spin flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2">
                          <p className="font-medium text-sm truncate">
                            {new Date(execution.startedAt).toLocaleString('de-DE', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <Badge variant="outline" className="text-xs self-start xs:self-center">
                            {execution.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {execution.mode} • {execution.id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>

                    {/* Action button - better positioned on mobile */}
                    <div className="flex justify-end sm:justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 gap-2"
                        onClick={() => openExecutionDetails(execution.id)}
                      >
                        <Eye className="w-4 h-4" />
                        <span className="hidden xs:inline">Details</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Keine Ausführungen gefunden</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Live Logs */}
      {executionLogs.length > 0 && (
        <Card className="modern-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Live Logs
            </CardTitle>
            <CardDescription>
              Echtzeitprotokoll der Workflow-Ausführungen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {executionLogs.map((log, index) => (
                <div key={index} className="flex items-start gap-3 p-2 rounded text-sm font-mono">
                  {getLogIcon(log.level)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleTimeString('de-DE')}
                      </span>
                      {log.nodeName && (
                        <Badge variant="outline" className="text-xs">
                          {log.nodeName}
                        </Badge>
                      )}
                    </div>
                    <p className={`${
                      log.level === 'error' ? 'text-red-400' :
                      log.level === 'warn' ? 'text-yellow-400' :
                      log.level === 'success' ? 'text-green-400' :
                      'text-foreground'
                    }`}>
                      {log.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {/* Details modal using Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[80vh] overflow-auto modern-card border-0">
          <DialogHeader>
            <DialogTitle>
              Execution Details {selectedExecutionId ? `(${selectedExecutionId})` : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Meta</p>
              <pre className="text-xs bg-white/[0.02] border border-white/[0.05] rounded p-3 overflow-x-auto">
{JSON.stringify(selectedDetails?.execution || {}, null, 2)}
              </pre>
            </div>
            {selectedDetails?.ai && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">AI Ergebnisse</p>
                <pre className="text-xs bg-white/[0.02] border border-white/[0.05] rounded p-3 overflow-x-auto">
{JSON.stringify(selectedDetails.ai, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
