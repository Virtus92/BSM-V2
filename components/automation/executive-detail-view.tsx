/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Settings, BarChart3, TrendingUp, Zap, Bot, Webhook, ArrowLeft, MessageSquare, Activity } from 'lucide-react'
import type { WorkflowInsight } from '@/lib/services/workflow-analyzer'
import type { WorkflowTriggerInfo } from '@/lib/services/workflow-introspector'
import type { LiveMonitoring } from '@/lib/services/execution-controller'
import { classifyView, getAvailableViews, getViewTheme } from '@/lib/services/executive-view-model'
import { EmployeeControls } from '@/components/automation/employee-controls'
import { ProcessControls } from '@/components/automation/process-controls'
import { EmployeePerformance } from '@/components/automation/employee-performance'
import { ProcessPerformance } from '@/components/automation/process-performance'
import { WorkflowVisualizer } from '@/components/automation/workflow-visualizer'
import { Button } from '@/components/ui/button'
import { AIAgentChatModal } from '@/components/automation/AIAgentChatModal'

interface ExecutiveDetailViewProps {
  insight: WorkflowInsight
  triggers: WorkflowTriggerInfo[]
  monitoring: LiveMonitoring
  workflowId: string
  onBack?: () => void
}

export function ExecutiveDetailView({ insight, triggers, monitoring, workflowId, onBack }: ExecutiveDetailViewProps) {
  const initial = classifyView(insight, triggers)
  const available = getAvailableViews(insight, triggers)
  const [view, setView] = useState(initial)
  const theme = useMemo(() => getViewTheme(view), [view])
  const [isChatModalOpen, setIsChatModalOpen] = useState(false)
  const [chatInitialMessage, setChatInitialMessage] = useState<string>('')

  const handleChatStart = (message?: string) => {
    if (message && message.trim()) {
      setChatInitialMessage(message.trim())
    }
    setIsChatModalOpen(true)
  }


  return (
    <div className="space-y-8">
      {/* Back Button - positioned above title */}
      {onBack && (
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Zurück
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{insight.workflow.name}</h1>
            <p className="text-muted-foreground">{insight.businessMetrics.description}</p>
          </div>
        </div>
      )}

      {/* View switcher */}
      {available.length > 1 && (
        <Tabs value={view} onValueChange={(v) => setView(v as any)}>
          <TabsList>
            <TabsTrigger value="digital_employee">Mitarbeiter</TabsTrigger>
            <TabsTrigger value="process">Prozess</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* KPIs */}
      <Card className={`modern-card border ${theme.borderSoft}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            {view === 'digital_employee' ? 'Mitarbeiter Performance' : 'Prozess Performance'}
          </CardTitle>
          <CardDescription>
            {insight.businessMetrics.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
          {insight.businessMetrics.kpis.slice(0, 4).map((kpi, idx) => (
            <div key={idx} className={`${theme.bgSoft} ${theme.borderSoft} border rounded-xl p-4 text-center`}>
              <p className="text-lg font-semibold">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              {kpi.trend && (
                <div className={`flex items-center justify-center gap-1 mt-1 ${kpi.trend === 'up' ? 'text-green-500' : kpi.trend === 'down' ? 'text-red-500' : 'text-muted-foreground'}`}>
                  <TrendingUp className={`w-3 h-3 ${kpi.trend === 'down' ? 'rotate-180' : ''}`} />
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Main content per view */}
      {view === 'digital_employee' ? (
        <div className="space-y-8">
          {/* Human-Centered Layout for Digital Employee */}

          {/* Employee Controls & Chat Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Employee Interaction */}
            <div className="lg:col-span-2">
              <EmployeeControls
                insight={insight}
                triggers={triggers}
                onChatStart={handleChatStart}
              />
            </div>

            {/* Employee Status */}
            <Card className="modern-card border-purple-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-600">
                  <Bot className="w-5 h-5" />
                  Mitarbeiter Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    insight.workflow.active ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="text-sm">
                    {insight.workflow.active ? 'Verfügbar und bereit' : 'Derzeit offline'}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Aufgaben heute:</span>
                    <span className="font-medium">{monitoring.metrics.executionsToday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Erfolgsrate:</span>
                    <span className={`font-medium ${
                      monitoring.metrics.successRate >= 95 ? 'text-green-500' :
                      monitoring.metrics.successRate >= 80 ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                      {monitoring.metrics.successRate}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Antwortzeit:</span>
                    <span className="font-medium">
                      {monitoring.metrics.averageResponseTime < 1000
                        ? `${monitoring.metrics.averageResponseTime}ms`
                        : monitoring.metrics.averageResponseTime < 60000
                        ? `${Math.round(monitoring.metrics.averageResponseTime / 1000)}s`
                        : `${Math.round(monitoring.metrics.averageResponseTime / 60000)}min`
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Employee Activity Monitoring */}
          <EmployeePerformance
            workflowId={workflowId}
            initialData={monitoring}
            insight={insight}
            refreshInterval={5000}
          />

          {/* Employee Communication Channels */}
          <Card className="modern-card border-purple-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-500" />
                Kommunikationskanäle
              </CardTitle>
              <CardDescription>
                Verfügbare Wege zur Interaktion mit dem digitalen Mitarbeiter
              </CardDescription>
            </CardHeader>
            <CardContent>
              {triggers.length > 0 ? (
                <div className="grid gap-3">
                  {triggers.map((trigger) => (
                    <div key={trigger.nodeId} className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                          {trigger.type === 'chat' ? '💬' :
                           trigger.type === 'telegram' ? '📱' :
                           trigger.type === 'slack' ? '💬' :
                           trigger.type === 'email' ? '✉️' : '🔗'}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium capitalize">{trigger.type} Kommunikation</h4>
                          <p className="text-sm text-muted-foreground">
                            {trigger.type === 'chat' ? 'Direkter Chat über die Plattform' :
                             trigger.type === 'telegram' ? 'Telegram Bot Integration' :
                             trigger.type === 'slack' ? 'Slack Bot für Teams' :
                             trigger.type === 'email' ? 'E-Mail Bearbeitung' :
                             'Webhook Integration'}
                          </p>
                          {trigger.promptField && (
                            <Badge variant="outline" className="text-xs mt-2">
                              {trigger.promptField}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Keine Kommunikationskanäle konfiguriert</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-8">
          {/* System-Centered Layout for Process */}

          {/* Process Operations & System Health */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Process Controls */}
            <div className="lg:col-span-3">
              <ProcessControls insight={insight} triggers={triggers} />
            </div>

            {/* System Health Dashboard */}
            <Card className="modern-card border-orange-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <BarChart3 className="w-5 h-5" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      insight.workflow.active ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="text-sm">
                      {insight.workflow.active ? 'Service Online' : 'Service Offline'}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Uptime:</span>
                      <span className={`font-medium ${monitoring.metrics.successRate >= 95 ? 'text-green-500' : 'text-yellow-500'}`}>
                        {monitoring.metrics.successRate}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Load:</span>
                      <span className="font-medium">{monitoring.isRunning ? 'Running' : 'Idle'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Response:</span>
                      <span className="font-medium">
                        {monitoring.metrics.averageResponseTime < 1000
                          ? `${monitoring.metrics.averageResponseTime}ms`
                          : monitoring.metrics.averageResponseTime < 60000
                          ? `${Math.round(monitoring.metrics.averageResponseTime / 1000)}s`
                          : `${Math.round(monitoring.metrics.averageResponseTime / 60000)}min`
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Performance & Monitoring */}
          <ProcessPerformance
            workflowId={workflowId}
            initialData={monitoring}
            insight={insight}
            refreshInterval={5000}
          />

          {/* Technical Configuration */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Endpoints & Triggers */}
            <Card className="modern-card border-orange-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="w-5 h-5 text-orange-500" />
                  System Endpoints
                </CardTitle>
                <CardDescription>
                  Verfügbare APIs und Trigger-Konfiguration
                </CardDescription>
              </CardHeader>
              <CardContent>
                {triggers.length > 0 ? (
                  <div className="space-y-3">
                    {triggers.map((trigger) => (
                      <div key={trigger.nodeId} className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-orange-500/20 flex items-center justify-center">
                              {trigger.type === 'webhook' ? '🔗' :
                               trigger.type === 'manual' ? '⚙️' :
                               trigger.type === 'cron' ? '⏰' : '🔗'}
                            </div>
                            <div>
                              <p className="font-medium text-sm uppercase tracking-wide">{trigger.type}</p>
                              <p className="text-xs text-muted-foreground">{trigger.nodeName}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {trigger.promptField || 'Standard'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Webhook className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Keine Endpoints konfiguriert</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* System Architecture */}
            <Card className="modern-card border-orange-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-orange-500" />
                  System Architektur
                </CardTitle>
                <CardDescription>
                  Workflow-Struktur und Node-Konfiguration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* System Stats */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded bg-orange-500/5 border border-orange-500/20 text-center">
                      <div className="text-lg font-bold text-orange-600">{insight.nodes.length}</div>
                      <div className="text-xs text-muted-foreground">Nodes Total</div>
                    </div>
                    <div className="p-3 rounded bg-orange-500/5 border border-orange-500/20 text-center">
                      <div className="text-lg font-bold text-orange-600">{triggers.length}</div>
                      <div className="text-xs text-muted-foreground">Endpoints</div>
                    </div>
                  </div>

                  {/* Workflow Diagram */}
                  <div className="p-3 sm:p-4 rounded-lg bg-orange-500/5 border border-orange-500/20 overflow-x-auto">
                    <WorkflowVisualizer nodes={insight.nodes} />
                  </div>

                  {/* Technical Details */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Workflow ID:</span>
                      <code className="bg-black/20 px-1 rounded">{workflowId}</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Version:</span>
                      <span>Active</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kategorie:</span>
                      <span className="capitalize">{insight.category}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* AI Agent Chat Modal */}
      <AIAgentChatModal
        workflow={insight}
        open={isChatModalOpen}
        onOpenChange={(open) => {
          setIsChatModalOpen(open)
          if (!open) setChatInitialMessage('')
        }}
        initialMessage={chatInitialMessage}
      />
    </div>
  )
}
