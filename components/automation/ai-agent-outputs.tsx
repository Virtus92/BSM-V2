/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Bot,
  MessageSquare,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  User,
  Brain
} from "lucide-react"
import { type WorkflowInsight } from '@/lib/services/workflow-analyzer'

interface AIAgentOutputsProps {
  insight: WorkflowInsight
  executionId?: string
}

interface ChatMessage {
  id: string
  timestamp: string
  type: 'user' | 'agent' | 'system'
  content: string
  metadata?: any
}

interface AgentResult {
  executionId: string
  timestamp: string
  status: 'success' | 'error' | 'running'
  messages: ChatMessage[]
  outputs: {
    bookings?: any[]
    leads?: any[]
    files?: Array<{
      name: string
      type: string
      url: string
      size: number
    }>
    actions?: Array<{
      type: string
      description: string
      result: any
    }>
  }
  performance: {
    duration: number
    tokensUsed?: number
    costEstimate?: number
  }
}

export function AIAgentOutputs({ insight, executionId }: AIAgentOutputsProps) {
  const [agentResults, setAgentResults] = useState<AgentResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedResult, setSelectedResult] = useState<AgentResult | null>(null)

  // Check if this workflow has AI components
  const hasAIComponents = insight.capabilities.hasAIComponents
  const aiNodes = insight.nodes.filter(node => node.category === 'ai_model')

  const fetchAgentResults = useCallback(async () => {
    setIsLoading(true)
    try {
      // This would fetch actual AI agent results from the execution
      const response = await fetch(`/api/automation/executions/${executionId}/ai-results`)
      if (response.ok) {
        const data = await response.json()
        setAgentResults(data.results || [])
      }
    } catch (error) {
      console.error('Failed to fetch AI agent results:', error)
    } finally {
      setIsLoading(false)
    }
  }, [executionId])

  useEffect(() => {
    if (hasAIComponents && executionId) {
      fetchAgentResults()
    }
  }, [executionId, hasAIComponents, fetchAgentResults])

  const downloadFile = async (file: any) => {
    try {
      const response = await fetch(file.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download file:', error)
    }
  }

  if (!hasAIComponents) {
    return (
      <Card className="modern-card">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Dieser Workflow enthält keine KI-Komponenten
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* AI Nodes Overview */}
      <Card className="modern-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            KI-Komponenten
          </CardTitle>
          <CardDescription>
            AI Agents und intelligente Verarbeitung in diesem Workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiNodes.map((node) => (
              <div key={node.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{node.name}</p>
                    <p className="text-xs text-muted-foreground">{node.description}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {node.type}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent AI Results */}
      {agentResults.length > 0 && (
        <Card className="modern-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Agent-Ergebnisse
                </CardTitle>
                <CardDescription>
                  Letzte KI-Agent Ausführungen und Resultate
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAgentResults}
                disabled={isLoading}
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {agentResults.map((result) => (
                <div key={result.executionId} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {result.status === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : result.status === 'error' ? (
                        <XCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        <RefreshCw className="w-5 h-5 text-yellow-500 animate-spin" />
                      )}
                      <div>
                        <p className="font-medium">Execution {result.executionId}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(result.timestamp).toLocaleString('de-DE')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {result.performance.duration}ms
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedResult(result)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Quick Preview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-2 rounded bg-white/[0.02]">
                      <p className="text-lg font-bold text-blue-500">
                        {result.messages.length}
                      </p>
                      <p className="text-xs text-muted-foreground">Nachrichten</p>
                    </div>
                    <div className="text-center p-2 rounded bg-white/[0.02]">
                      <p className="text-lg font-bold text-green-500">
                        {(result.outputs.bookings?.length || 0) + (result.outputs.leads?.length || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">Konversionen</p>
                    </div>
                    <div className="text-center p-2 rounded bg-white/[0.02]">
                      <p className="text-lg font-bold text-purple-500">
                        {result.outputs.files?.length || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Dateien</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Result View */}
      {selectedResult && (
        <Card className="modern-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                Agent Conversation Details
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedResult(null)}
              >
                Schließen
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Chat Messages */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedResult.messages.map((message) => (
                <div key={message.id} className={`flex gap-3 ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}>
                  <div className={`flex gap-3 max-w-[80%] ${
                    message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}>
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      {message.type === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>
                    <div className={`p-3 rounded-xl ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-white/[0.05] border border-white/[0.1]'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-60 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Generated Files */}
            {selectedResult.outputs.files && selectedResult.outputs.files.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Generierte Dateien
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedResult.outputs.files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {file.type} • {Math.round(file.size / 1024)}KB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadFile(file)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Performance Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-xl bg-white/[0.02]">
                <p className="text-lg font-bold">{selectedResult.performance.duration}ms</p>
                <p className="text-xs text-muted-foreground">Ausführungszeit</p>
              </div>
              {selectedResult.performance.tokensUsed && (
                <div className="text-center p-3 rounded-xl bg-white/[0.02]">
                  <p className="text-lg font-bold">{selectedResult.performance.tokensUsed}</p>
                  <p className="text-xs text-muted-foreground">Tokens</p>
                </div>
              )}
              {selectedResult.performance.costEstimate && (
                <div className="text-center p-3 rounded-xl bg-white/[0.02]">
                  <p className="text-lg font-bold">€{selectedResult.performance.costEstimate.toFixed(4)}</p>
                  <p className="text-xs text-muted-foreground">Kosten</p>
                </div>
              )}
              <div className="text-center p-3 rounded-xl bg-white/[0.02]">
                <p className="text-lg font-bold">{selectedResult.messages.length}</p>
                <p className="text-xs text-muted-foreground">Nachrichten</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results State */}
      {hasAIComponents && agentResults.length === 0 && !isLoading && (
        <Card className="modern-card">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">
                Noch keine KI-Agent Ergebnisse verfügbar
              </p>
              <p className="text-sm text-muted-foreground">
                Führen Sie den Workflow aus, um Agent-Interaktionen zu sehen
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
