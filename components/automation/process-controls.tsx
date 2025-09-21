/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Play,
  Square,
  TestTube,
  Settings,
  Code,
  Webhook,
  Clock,
  Zap,
  Database
} from "lucide-react"
import { type WorkflowInsight } from '@/lib/services/workflow-analyzer'
import { type WorkflowTriggerInfo } from '@/lib/services/workflow-introspector'

interface ProcessControlsProps {
  insight: WorkflowInsight
  triggers: WorkflowTriggerInfo[]
  onExecute?: (payload: any) => void
  onWebhookTest?: (data: any) => void
}

export function ProcessControls({ insight, triggers, onExecute, onWebhookTest }: ProcessControlsProps) {
  const [jsonPayload, setJsonPayload] = useState('{}')
  const [webhookData, setWebhookData] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)
  const [selectedTrigger, setSelectedTrigger] = useState(triggers[0]?.nodeId || '')

  const hasWebhookTrigger = triggers.some(t => t.type === 'webhook')
  const hasManualTrigger = triggers.some(t => t.type === 'manual')
  const hasCronTrigger = triggers.some(t => t.type === 'cron')

  const handleManualExecution = async () => {
    setIsExecuting(true)
    try {
      let payload = {}
      try {
        payload = JSON.parse(jsonPayload)
      } catch {
        payload = { data: jsonPayload }
      }

      if (onExecute) {
        await onExecute(payload)
      }
    } finally {
      setIsExecuting(false)
    }
  }

  const handleWebhookTest = async () => {
    setIsExecuting(true)
    try {
      let data = {}
      try {
        data = JSON.parse(webhookData || '{}')
      } catch {
        data = { payload: webhookData }
      }

      if (onWebhookTest) {
        await onWebhookTest(data)
      }
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Process Execution Panel */}
      <Card className="modern-card border-orange-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-orange-600" />
            Prozess Steuerung
          </CardTitle>
          <CardDescription>
            Direkte Ausführung und Steuerung von {insight.workflow.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Manual Execution */}
          {hasManualTrigger && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">⚙️ Manuelle Ausführung</h4>
              <Textarea
                placeholder='{"key": "value", "data": "test"}'
                value={jsonPayload}
                onChange={(e) => setJsonPayload(e.target.value)}
                className="font-mono text-sm min-h-[100px]"
              />
              <Button
                onClick={handleManualExecution}
                disabled={isExecuting || !insight.workflow.active}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                {isExecuting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Ausführung läuft...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Prozess starten
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Webhook Testing */}
          {hasWebhookTrigger && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">🔗 Webhook Test</h4>
              <Textarea
                placeholder='{"event": "test", "timestamp": "2024-01-01T12:00:00Z"}'
                value={webhookData}
                onChange={(e) => setWebhookData(e.target.value)}
                className="font-mono text-sm min-h-[80px]"
              />
              <Button
                onClick={handleWebhookTest}
                disabled={isExecuting || !insight.workflow.active}
                className="w-full"
                variant="outline"
              >
                <Webhook className="w-4 h-4 mr-2" />
                Webhook testen
              </Button>
            </div>
          )}

          {/* System Status */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">🔧 System Status</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant={insight.workflow.active ? "default" : "secondary"}>
                {insight.workflow.active ? '🟢 Online' : '🔴 Offline'}
              </Badge>
              {hasWebhookTrigger && (
                <Badge variant="outline" className="text-blue-600 border-blue-600">
                  🔗 Webhook Ready
                </Badge>
              )}
              {hasManualTrigger && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  ⚙️ Manual Ready
                </Badge>
              )}
              {hasCronTrigger && (
                <Badge variant="outline" className="text-purple-600 border-purple-600">
                  ⏰ Scheduled
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Process Test Scenarios */}
      <Card className="modern-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5 text-orange-500" />
            System Test Szenarien
          </CardTitle>
          <CardDescription>
            Technische Tests für Prozessvalidierung und Performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <Button
              variant="outline"
              className="justify-start text-left h-auto p-3"
              onClick={() => setJsonPayload('{"test": "load_test", "requests": 100}')}
            >
              <div>
                <p className="font-medium">⚡ Load Test</p>
                <p className="text-sm text-muted-foreground">Performance unter Last testen</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start text-left h-auto p-3"
              onClick={() => setJsonPayload('{"test": "error_handling", "simulate_error": true}')}
            >
              <div>
                <p className="font-medium">🚨 Error Handling</p>
                <p className="text-sm text-muted-foreground">Fehlerbehandlung validieren</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start text-left h-auto p-3"
              onClick={() => setJsonPayload('{"test": "data_validation", "invalid_data": true}')}
            >
              <div>
                <p className="font-medium">🔍 Data Validation</p>
                <p className="text-sm text-muted-foreground">Eingabevalidierung testen</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start text-left h-auto p-3"
              onClick={() => setWebhookData('{"event": "health_check", "timestamp": "' + new Date().toISOString() + '"}')}
            >
              <div>
                <p className="font-medium">💓 Health Check</p>
                <p className="text-sm text-muted-foreground">System-Gesundheit prüfen</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}