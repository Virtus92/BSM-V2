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
  MessageSquare,
  TrendingUp,
  Heart,
  Users,
  Coffee
} from "lucide-react"
import { type LiveMonitoring } from '@/lib/services/execution-controller'

interface EmployeePerformanceProps {
  workflowId: string
  initialData: LiveMonitoring
  refreshInterval?: number
}

export function EmployeePerformance({ workflowId, initialData, refreshInterval = 5000 }: EmployeePerformanceProps) {
  const [monitoring, setMonitoring] = useState<LiveMonitoring>(initialData)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

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
      console.error('Failed to refresh employee performance data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Human-oriented metrics
  const workHours = monitoring.currentExecution ?
    Math.floor((Date.now() - monitoring.currentExecution.startedAt.getTime()) / (1000 * 60 * 60)) : 0

  const responseQuality = monitoring.metrics.successRate >= 95 ? 'Excellent' :
                          monitoring.metrics.successRate >= 80 ? 'Good' :
                          monitoring.metrics.successRate >= 60 ? 'Fair' : 'Needs Improvement'

  return (
    <div className="space-y-6">
      {/* Employee Status Card */}
      <Card className="modern-card border-purple-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-500" />
                Mitarbeiter Aktivität
                {monitoring.isRunning && (
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                )}
              </CardTitle>
              <CardDescription>
                Arbeitszeit und Aufgabenbearbeitung des digitalen Mitarbeiters
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
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium text-purple-600">🧑‍💼 Arbeitet gerade</p>
                  <p className="text-sm text-purple-600/80">
                    Aufgabe: {monitoring.currentExecution.id}
                  </p>
                </div>
                <Badge variant="outline" className="text-purple-600 border-purple-600">
                  <Heart className="w-3 h-3 mr-1" />
                  Aktiv seit {workHours}h
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Bearbeitungsfortschritt</span>
                  <span>{monitoring.currentExecution.progress}%</span>
                </div>
                <Progress value={monitoring.currentExecution.progress} className="h-2" />
                {monitoring.currentExecution.currentNode && (
                  <p className="text-sm text-purple-600/80">
                    Aktueller Schritt: {monitoring.currentExecution.currentNode}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 text-center">
              <Coffee className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-purple-600 font-medium">Pause</p>
              <p className="text-sm text-purple-600/80">
                Bereit für neue Aufgaben
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Human-Oriented Metrics */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="modern-card border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-600">{monitoring.metrics.executionsToday}</p>
                <p className="text-xs text-muted-foreground">Aufgaben heute</p>
              </div>
              <MessageSquare className="w-4 h-4 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-600">{responseQuality}</p>
                <p className="text-xs text-muted-foreground">Arbeitsqualität</p>
              </div>
              <TrendingUp className="w-4 h-4 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-600">{Math.round(monitoring.metrics.averageResponseTime / 60000)}min</p>
                <p className="text-xs text-muted-foreground">Ø Antwortzeit</p>
              </div>
              <Clock className="w-4 h-4 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-600">{monitoring.metrics.successRate}%</p>
                <p className="text-xs text-muted-foreground">Zuverlässigkeit</p>
              </div>
              <CheckCircle className="w-4 h-4 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Work History */}
      <Card className="modern-card border-purple-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-500" />
            Arbeitshistorie
          </CardTitle>
          <CardDescription>
            Letzte bearbeitete Aufgaben und Kundenkontakte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {monitoring.recentExecutions.length > 0 ? (
              monitoring.recentExecutions.slice(0, 5).map((execution) => (
                <div key={execution.id} className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                  <div className="flex items-center gap-3">
                    {execution.status === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : execution.status === 'error' ? (
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    ) : (
                      <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {execution.status === 'success' ? '✅ Aufgabe erfolgreich erledigt' :
                         execution.status === 'error' ? '❌ Aufgabe benötigt Hilfe' :
                         '🔄 Arbeitet an Aufgabe'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(execution.startedAt).toLocaleString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })} • {execution.id.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Noch keine Arbeitshistorie</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}