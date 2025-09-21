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
import { ConversationModal } from './ConversationModal'
import { type LiveMonitoring } from '@/lib/services/execution-controller'
import { type WorkflowInsight } from '@/lib/services/workflow-analyzer'

interface EmployeePerformanceProps {
  workflowId: string
  initialData: LiveMonitoring
  insight: WorkflowInsight
  refreshInterval?: number
}

export function EmployeePerformance({ workflowId, initialData, insight, refreshInterval = 5000 }: EmployeePerformanceProps) {
  const [monitoring, setMonitoring] = useState<LiveMonitoring>(initialData)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedExecution, setSelectedExecution] = useState<any>(null)

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

  // Group executions into conversations by sessionId
  const groupExecutionsIntoConversations = async () => {
    const conversationMap = new Map()

    for (const execution of monitoring.recentExecutions) {
      // Extract sessionId from execution result if available
      let sessionId = 'unknown'

      // Try to get sessionId from basic execution result first
      if (execution.result?.json?.sessionId) {
        sessionId = execution.result.json.sessionId
      } else if (execution.result?.sessionId) {
        sessionId = execution.result.sessionId
      } else {
        // If no sessionId in basic data, fetch detailed execution data
        try {
          const response = await fetch(`/api/automation/executions/${execution.id}`)
          if (response.ok) {
            const detailedExecution = await response.json()
            // Extract sessionId from Chat Trigger node
            const chatTriggerData = detailedExecution?.data?.resultData?.runData?.["Chat Trigger"]?.[0]?.data?.main?.[0]?.[0]?.json
            if (chatTriggerData?.sessionId) {
              sessionId = chatTriggerData.sessionId
            } else {
              // Fallback: use execution ID as session for individual messages
              sessionId = execution.id
            }
          } else {
            sessionId = execution.id
          }
        } catch (error) {
          console.error(`Failed to fetch sessionId for execution ${execution.id}:`, error)
          sessionId = execution.id
        }
      }

      if (!conversationMap.has(sessionId)) {
        conversationMap.set(sessionId, {
          sessionId,
          executions: [],
          startTime: execution.startedAt,
          endTime: execution.finishedAt || execution.startedAt,
          status: execution.status,
          messageCount: 0
        })
      }

      const conversation = conversationMap.get(sessionId)
      conversation.executions.push(execution)
      conversation.messageCount++

      // Update time range
      if (execution.startedAt < conversation.startTime) {
        conversation.startTime = execution.startedAt
      }
      if (execution.finishedAt && execution.finishedAt > conversation.endTime) {
        conversation.endTime = execution.finishedAt
      }

      // Update status (error takes precedence)
      if (execution.status === 'error') {
        conversation.status = 'error'
      } else if (execution.status === 'running' && conversation.status === 'success') {
        conversation.status = 'running'
      }
    }

    // Sort conversations by start time (newest first)
    return Array.from(conversationMap.values()).sort((a, b) => {
      const aTime = a.startTime instanceof Date ? a.startTime.getTime() : new Date(a.startTime).getTime()
      const bTime = b.startTime instanceof Date ? b.startTime.getTime() : new Date(b.startTime).getTime()
      return bTime - aTime
    })
  }

  const [conversations, setConversations] = useState<any[]>([])
  const [isLoadingConversations, setIsLoadingConversations] = useState(false)

  useEffect(() => {
    const loadConversations = async () => {
      setIsLoadingConversations(true)
      try {
        const conversationList = await groupExecutionsIntoConversations()
        setConversations(conversationList)
      } catch (error) {
        console.error('Failed to load conversations:', error)
        setConversations([])
      } finally {
        setIsLoadingConversations(false)
      }
    }

    loadConversations()
  }, [monitoring.recentExecutions])

  const handleConversationClick = (conversation: any) => {
    setSelectedExecution(conversation)
  }

  const getConversationTopic = (conversation: any) => {
    // Try to extract topic from first message
    const firstExecution = conversation.executions[0]
    if (firstExecution?.result?.json?.input || firstExecution?.result?.json?.message) {
      const input = firstExecution.result.json.input || firstExecution.result.json.message
      if (input.length > 30) {
        return input.substring(0, 30) + '...'
      }
      return input
    }
    return 'Kundenkonversation'
  }

  const formatDuration = (startTime: Date | string, endTime: Date | string) => {
    const start = startTime instanceof Date ? startTime : new Date(startTime)
    const end = endTime instanceof Date ? endTime : new Date(endTime)

    const diff = end.getTime() - start.getTime()
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)

    if (minutes > 0) {
      return `${minutes}min ${seconds}s`
    }
    return `${seconds}s`
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
                <p className="text-2xl font-bold text-purple-600">
                  {monitoring.metrics.averageResponseTime < 1000
                    ? `${monitoring.metrics.averageResponseTime}ms`
                    : monitoring.metrics.averageResponseTime < 60000
                    ? `${Math.round(monitoring.metrics.averageResponseTime / 1000)}s`
                    : `${Math.round(monitoring.metrics.averageResponseTime / 60000)}min`
                  }
                </p>
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
            {isLoadingConversations ? (
              <div className="flex items-center justify-center py-6">
                <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                <span>Lade Konversationen...</span>
              </div>
            ) : conversations.length > 0 ? (
              conversations.slice(0, 5).map((conversation) => (
                <div
                  key={conversation.sessionId}
                  className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20 cursor-pointer hover:bg-purple-500/10 transition-colors"
                  onClick={() => handleConversationClick(conversation)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {conversation.status === 'success' ? (
                        <MessageSquare className="w-4 h-4 text-green-500" />
                      ) : conversation.status === 'error' ? (
                        <XCircle className="w-4 h-4 text-red-500" />
                      ) : (
                        <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        💬 {getConversationTopic(conversation)}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {(conversation.startTime instanceof Date ?
                            conversation.startTime :
                            new Date(conversation.startTime)
                          ).toLocaleString('de-DE', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span>•</span>
                        <span>{conversation.messageCount} Nachrichten</span>
                        <span>•</span>
                        <span>{formatDuration(conversation.startTime, conversation.endTime)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Noch keine Konversationen</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Conversation Modal */}
      {selectedExecution && (
        <ConversationModal
          conversation={selectedExecution}
          viewType="digital_employee"
          open={!!selectedExecution}
          onClose={() => setSelectedExecution(null)}
        />
      )}
    </div>
  )
}