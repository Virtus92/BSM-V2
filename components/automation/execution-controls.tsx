/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import {
  Play,
  Square,
  TestTube,
  Eye,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Code,
  FileText,
  Zap
} from "lucide-react"
import { type WorkflowInsight } from '@/lib/services/workflow-analyzer'
import { type WorkflowTriggerInfo, type TriggerType } from '@/lib/services/workflow-introspector'
import { type TestScenario, ExecutionController } from '@/lib/services/execution-controller'

interface ExecutionControlsProps {
  insight: WorkflowInsight
  triggers?: WorkflowTriggerInfo[]
  currentView?: 'digital_employee' | 'process'
  onExecutionStart?: (executionId: string) => void
  onExecutionComplete?: (result: any) => void
}

interface ExecutionResult {
  success: boolean
  executionId?: string
  data?: any
  error?: string
  duration?: number
  nodeResults?: Array<{
    nodeId: string
    nodeName: string
    status: 'success' | 'error' | 'running'
    output?: any
    error?: string
    duration?: number
  }>
}

export function ExecutionControls({ insight, triggers = [], currentView, onExecutionStart, onExecutionComplete }: ExecutionControlsProps) {
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null)
  const [selectedScenario, setSelectedScenario] = useState<TestScenario | null>(null)
  const [customPayload, setCustomPayload] = useState('')
  const [showLogs, setShowLogs] = useState(false)
  const [selectedTriggerId, setSelectedTriggerId] = useState<string | null>(triggers[0]?.nodeId || null)
  const [chatMessage, setChatMessage] = useState('Hallo!')

  // Generate test scenarios based on workflow
  const testScenarios = ExecutionController.generateTestScenarios(insight.workflow)

  const selectedTrigger = triggers.find(t => t.nodeId === selectedTriggerId) || null

  const executeChat = async () => {
    if (!selectedTrigger) return
    setIsExecuting(true)
    setExecutionResult(null)

    try {
      // Use different endpoints based on current view
      if (currentView === 'digital_employee') {
        // AI Agent chat for digital employee view
        const response = await fetch('/api/automation/ai-agent/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workflowId: insight.workflow.id,
            message: chatMessage,
            userId: 'executive-dashboard',
            timestamp: new Date().toISOString()
          })
        })
        const json = await response.json()
        if (!response.ok) {
          setExecutionResult({ success: false, error: json?.error || 'Chat failed' })
          return
        }
        setExecutionResult({
          success: true,
          executionId: json?.metadata?.executionId,
          data: json,
          duration: json?.metadata?.executionTime
        })
        if (json?.metadata?.executionId) onExecutionStart?.(json.metadata.executionId)
        onExecutionComplete?.(json)
      } else {
        // Regular workflow execution for process view
        const response = await fetch(`/api/automation/workflows/${insight.workflow.id}/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'test',
            payload: { message: chatMessage },
            triggerType: 'chat',
            triggerNodeId: selectedTrigger.nodeId
          })
        })
        const result = await response.json()
        setExecutionResult(result)
        if (result.success && result.executionId) {
          onExecutionStart?.(result.executionId)
        }
        onExecutionComplete?.(result)
      }
    } catch (error) {
      setExecutionResult({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setIsExecuting(false)
    }
  }

  const executeWorkflow = async (type: 'manual' | 'webhook' | 'test', payload?: any, triggerType?: 'chat' | 'webhook' | 'manual') => {
    setIsExecuting(true)
    setExecutionResult(null)

    try {
      const response = await fetch(`/api/automation/workflows/${insight.workflow.id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, payload, triggerType })
      })
      const result = await response.json()

      setExecutionResult(result)

      if (result.success && result.executionId) {
        onExecutionStart?.(result.executionId)
      }

      onExecutionComplete?.(result)
    } catch (error) {
      setExecutionResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsExecuting(false)
    }
  }

  const executeTestScenario = (scenario: TestScenario) => {
    setSelectedScenario(scenario)
    // Choose a node id that matches the scenario trigger type
    const nodeForTrigger = triggers.find(t => t.type === (scenario.preferredTriggerType || 'webhook'))
    const body: any = {
      type: 'test',
      payload: scenario.payload,
      triggerType: scenario.preferredTriggerType,
      triggerNodeId: nodeForTrigger?.nodeId
    }
    // Call API directly to include node targeting
    void (async () => {
      setIsExecuting(true)
      setExecutionResult(null)
      try {
        const response = await fetch(`/api/automation/workflows/${insight.workflow.id}/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
        const result = await response.json()
        setExecutionResult(result)
        if (result.success && result.executionId) onExecutionStart?.(result.executionId)
        onExecutionComplete?.(result)
      } catch (error) {
        setExecutionResult({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
      } finally {
        setIsExecuting(false)
      }
    })()
  }

  const executeCustom = () => {
    try {
      const payload = customPayload ? JSON.parse(customPayload) : {}
      executeWorkflow('webhook', payload)
    } catch (error) {
      setExecutionResult({
        success: false,
        error: 'Invalid JSON payload'
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Trigger Selector */}
      {triggers.length > 0 && (
        <Card className="modern-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Trigger Auswahl
            </CardTitle>
            <CardDescription>
              Wähle den Einstiegspunkt für Tests und Ausführung
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Modern Trigger Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {triggers.map(trigger => (
                <button
                  key={trigger.nodeId}
                  onClick={() => setSelectedTriggerId(trigger.nodeId)}
                  className={`p-3 rounded-lg border text-left transition-all hover:border-primary/50 ${
                    selectedTriggerId === trigger.nodeId
                      ? 'border-primary bg-primary/10'
                      : 'border-white/10 bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      trigger.type === 'chat' ? 'bg-purple-500/20' :
                      trigger.type === 'webhook' ? 'bg-blue-500/20' :
                      trigger.type === 'telegram' ? 'bg-cyan-500/20' :
                      'bg-gray-500/20'
                    }`}>
                      {trigger.type === 'chat' ? '💬' :
                       trigger.type === 'webhook' ? '🔗' :
                       trigger.type === 'telegram' ? '📱' : '⚡'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm capitalize">{trigger.type}</p>
                      <p className="text-xs text-muted-foreground truncate">{trigger.nodeName}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Chat Input for Chat Triggers */}
            {selectedTrigger?.type === 'chat' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Chat Nachricht</label>
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder={selectedTrigger.promptField || 'Hallo! Wie kann ich helfen?'}
                  className="w-full bg-white/[0.02] border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            )}

            {selectedTrigger?.type === 'telegram' && (
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-sm text-yellow-600">Dieser Workflow wird über Telegram getriggert und kann nicht direkt aus dem Dashboard ausgeführt werden.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {/* Quick Actions */}
      <Card className="modern-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Executive Controls
          </CardTitle>
          <CardDescription>
            Workflow-Ausführung und Testing-Interface
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {insight.capabilities.canExecuteManually && (
              <Button
                onClick={() => executeWorkflow('manual')}
                disabled={isExecuting}
                className="mystery-button gap-2"
              >
                {isExecuting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Manuell Ausführen
              </Button>
            )}

            {insight.capabilities.hasWebhookTrigger && selectedTrigger?.type !== 'chat' && (
              <Button
                onClick={() => executeWorkflow('webhook')}
                disabled={isExecuting}
                variant="outline"
                className="gap-2"
              >
                {isExecuting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                Webhook Test
              </Button>
            )}

            {selectedTrigger?.type === 'chat' && (
              <Button
                onClick={executeChat}
                disabled={isExecuting || !chatMessage.trim()}
                variant="outline"
                className="gap-2"
              >
                {isExecuting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                {currentView === 'digital_employee' ? 'Mitarbeiter Chat' : 'Prozess Test'}
              </Button>
            )}

            <Button
              onClick={() => setShowLogs(!showLogs)}
              variant="outline"
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              Live Logs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Scenarios grouped by trigger */}
      {testScenarios.length > 0 && (
        <Card className="modern-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="w-5 h-5 text-primary" />
              Test Scenarios
            </CardTitle>
            <CardDescription>
              Vordefinierte Test-Cases für verschiedene Nutzungsszenarien
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {testScenarios.map((scenario, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{scenario.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {scenario.preferredTriggerType || 'webhook'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{scenario.description}</p>
                </div>
                <Button
                  onClick={() => executeTestScenario(scenario)}
                  disabled={isExecuting}
                  variant="outline"
                  size="sm"
                  className="gap-1"
                >
                  {isExecuting && selectedScenario === scenario ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Play className="w-3 h-3" />
                  )}
                  Test
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Custom Execution */}
      <Card className="modern-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5 text-primary" />
            Custom Execution
          </CardTitle>
          <CardDescription>
            Eigene Payloads für spezielle Test-Cases
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder='JSON Payload (optional)
{"message": "Test message", "user": "executive-test"}'
            value={customPayload}
            onChange={(e) => setCustomPayload(e.target.value)}
            className="min-h-[80px] font-mono text-sm"
          />
          <Button
            onClick={executeCustom}
            disabled={isExecuting}
            className="mystery-button gap-2"
          >
            {isExecuting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Execute Custom
          </Button>
        </CardContent>
      </Card>

      {/* Execution Results - Always show placeholder when not executing */}
      <Card className={`modern-card transition-all duration-200 ${
        executionResult
          ? executionResult.success
            ? 'border-green-500/20 bg-green-500/5'
            : 'border-red-500/20 bg-red-500/5'
          : 'border-gray-500/20 bg-gray-500/5'
      }`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {executionResult ? (
              executionResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )
            ) : isExecuting ? (
              <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
            ) : (
              <Clock className="w-5 h-5 text-gray-500" />
            )}
            {isExecuting ? 'Ausführung läuft...' : executionResult ? 'Execution Result' : 'Keine Ausführung'}
          </CardTitle>
          {executionResult?.executionId && (
            <CardDescription>
              ID: {executionResult.executionId} • Duration: {executionResult.duration}ms
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {executionResult ? (
            executionResult.success ? (
              <div>
                <Badge variant="outline" className="text-green-600 border-green-600 mb-4">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Success
                </Badge>

                {executionResult.data && (
                  <details className="space-y-2">
                    <summary className="cursor-pointer font-medium hover:text-primary">
                      Response Data
                    </summary>
                    <pre className="p-4 bg-black/20 rounded text-sm overflow-x-auto">
                      {JSON.stringify(executionResult.data, null, 2)}
                    </pre>
                  </details>
                )}

                {executionResult.nodeResults && executionResult.nodeResults.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Node Execution Results</h4>
                    {executionResult.nodeResults.map((node, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                        <div className="flex items-center gap-3">
                          {node.status === 'success' ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : node.status === 'error' ? (
                            <XCircle className="w-4 h-4 text-red-500" />
                          ) : (
                            <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />
                          )}
                          <span className="font-medium text-sm">{node.nodeName}</span>
                        </div>
                        {node.duration && (
                          <span className="text-xs text-muted-foreground">{node.duration}ms</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <Badge variant="outline" className="text-red-600 border-red-600 mb-4">
                  <XCircle className="w-3 h-3 mr-1" />
                  Error
                </Badge>
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-600 font-medium">Execution Failed</p>
                  <p className="text-red-600/80 text-sm mt-1">{executionResult.error}</p>
                </div>
              </div>
            )
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              {isExecuting ? (
                <div className="space-y-2">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto" />
                  <p>Workflow wird ausgeführt...</p>
                  <p className="text-xs">Ergebnisse werden hier angezeigt</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Clock className="w-8 h-8 mx-auto" />
                  <p>Bereit für Ausführung</p>
                  <p className="text-xs">Verwenden Sie die Schaltflächen oben, um den Workflow zu testen</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
