/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Bot, Webhook, MessageSquare, Play, TestTube, Settings, TrendingUp, Clock, CheckCircle, XCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { WorkflowInsight } from '@/lib/services/workflow-analyzer'
import type { WorkflowTriggerInfo } from '@/lib/services/workflow-introspector'
import { classifyView, getAvailableViews, getExecutiveStatus, getViewTheme, type ExecutiveView } from '@/lib/services/executive-view-model'

interface AutomationEntityModalProps {
  workflow: (WorkflowInsight & { triggers?: WorkflowTriggerInfo[] }) | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onExecute: (workflow: WorkflowInsight, payload?: any) => void
  onAIChat: (workflow: WorkflowInsight) => void
  executing: string[]
}

export function AutomationEntityModal({ workflow, open, onOpenChange, onExecute, onAIChat, executing }: AutomationEntityModalProps) {
  const [payload, setPayload] = useState('')
  const initialView = useMemo<ExecutiveView>(() => workflow ? classifyView(workflow) : 'process', [workflow])
  const available = useMemo<ExecutiveView[]>(() => (workflow ? getAvailableViews(workflow) : ['process']), [workflow])
  const [view, setView] = useState<ExecutiveView>(initialView)

  if (!workflow) return null
  const isExecuting = executing.includes(workflow.workflow.id)
  const status = getExecutiveStatus(workflow)
  const theme = getViewTheme(view)
  const hasChatTrigger = Array.isArray(workflow.triggers) && workflow.triggers.some(t => t.type === 'chat')
  const canTest = workflow.capabilities.hasWebhookTrigger || workflow.capabilities.canExecuteManually

  const handleRun = (withPayload = false) => {
    let p: any | undefined
    if (withPayload && payload) {
      try {
        p = JSON.parse(payload)
      } catch {
        p = { test: true, message: payload }
      }
    }
    onExecute(workflow, p)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-w-4xl max-h-[90vh] overflow-hidden flex flex-col modern-card border ${theme.borderSoft}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${theme.bgSoft} flex items-center justify-center`}>
              {view === 'digital_employee' ? (
                <Bot className={`w-6 h-6 ${theme.tint}`} />
              ) : (
                <Webhook className={`w-6 h-6 ${theme.tint}`} />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold">{workflow.workflow.name}</h2>
              <p className="text-sm text-muted-foreground">
                {view === 'digital_employee' ? 'Digitaler Mitarbeiter' : 'Prozess / API'}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Badge variant={workflow.workflow.active ? 'default' : 'secondary'}>{workflow.workflow.active ? 'Aktiv' : 'Inaktiv'}</Badge>
              <Badge variant="outline" className={`text-xs ${status.tone === 'good' ? 'text-green-600 border-green-600' : status.tone === 'bad' ? 'text-red-600 border-red-600' : status.tone === 'warn' ? 'text-yellow-600 border-yellow-600' : 'text-blue-600 border-blue-600'}`}>{status.label}{status.details ? ` • ${status.details}` : ''}</Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Mode switcher if both views available */}
        {available.length > 1 && (
          <div className="px-2">
            <Tabs value={view} onValueChange={(v) => setView(v as ExecutiveView)}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="digital_employee">Mitarbeiter</TabsTrigger>
                <TabsTrigger value="process">Prozess</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* KPIs top row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-2">
            {(workflow.businessMetrics.kpis.slice(0,4)).map((kpi, idx) => (
              <Card key={idx} className={`${theme.bgSoft} ${theme.borderSoft} border`}>
                <CardContent className="p-4 text-center">
                  <p className="text-lg font-bold">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  {kpi.trend && (
                    <div className={`flex items-center justify-center gap-1 mt-1 ${kpi.trend === 'up' ? 'text-green-500' : kpi.trend === 'down' ? 'text-red-500' : 'text-muted-foreground'}`}>
                      <TrendingUp className={`w-3 h-3 ${kpi.trend === 'down' ? 'rotate-180' : ''}`} />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Content differs by view */}
          {view === 'digital_employee' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
              <Card className="modern-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" /> Supervision & Interaktion
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {hasChatTrigger ? (
                    <Button onClick={() => onAIChat(workflow)} className="w-full mystery-button">
                      <MessageSquare className="w-4 h-4 mr-2" /> Chat öffnen
                    </Button>
                  ) : (
                    <div className="text-xs text-muted-foreground p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                      Kein Chat-Trigger vorhanden. Interaktive Kanäle werden extern empfangen.
                    </div>
                  )}
                  {Array.isArray(workflow.triggers) && workflow.triggers.some(t => t.requiresExternalClient) && (
                    <div className="text-xs text-muted-foreground p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                      Externer Client erforderlich (z. B. Bot/App) für echte Eingänge.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="modern-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TestTube className="w-5 h-5 text-primary" /> Schnelltest
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {canTest ? (
                    <>
                      <div className="flex gap-2">
                        <Button onClick={() => handleRun(false)} disabled={isExecuting || !workflow.workflow.active} className="flex-1 mystery-button">
                          {isExecuting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />} Ausführen
                        </Button>
                        <Button variant="outline" onClick={() => handleRun(true)} disabled={isExecuting || !workflow.workflow.active}>
                          <TestTube className="w-4 h-4" />
                        </Button>
                      </div>
                      <Textarea value={payload} onChange={(e) => setPayload(e.target.value)} placeholder="Optionale Test-Payload (JSON)…" className="min-h-[80px] font-mono text-sm" />
                    </>
                  ) : (
                    <div className="text-xs text-muted-foreground p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                      Kein direkter Test möglich (kein Webhook/Manual). Nutzen Sie den externen Kanal für Eingänge.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
              <Card className="modern-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TestTube className="w-5 h-5 text-primary" /> Webhook/Manual Test
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea value={payload} onChange={(e) => setPayload(e.target.value)} placeholder="Payload (JSON)…" className="min-h-[100px] font-mono text-sm" />
                  <div className="flex gap-2">
                    <Button onClick={() => handleRun(true)} disabled={isExecuting || !workflow.workflow.active} className="mystery-button flex-1">
                      {isExecuting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />} Test ausführen
                    </Button>
                  </div>
                  {Array.isArray(workflow.triggers) && workflow.triggers.some(t => t.type === 'webhook') && (
                    <div className="text-xs text-muted-foreground p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                      Endpoint sichtbar bei aktiven Workflows; Test nutzt die erkannte Webhook‑Route.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="modern-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" /> Trigger & Anforderungen
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {(workflow.triggers || []).map((t) => (
                      <Badge key={t.nodeId} variant="outline" className="text-xs">
                        {t.type}{t.promptField ? `:${t.promptField}` : ''}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* History strip */}
          <Card className="modern-card mx-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" /> Verlauf
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-xl bg-white/[0.02]">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-lg font-bold text-green-500">{workflow.executionHistory.successful}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Erfolgreich</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-white/[0.02]">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-lg font-bold text-red-500">{workflow.executionHistory.failed}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Fehlgeschlagen</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-white/[0.02]">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-lg font-bold text-blue-500">{workflow.executionHistory.total}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Gesamt</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-white/10">
          <div />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Schließen</Button>
            <Button asChild className="mystery-button">
              <Link href={`/dashboard/automation/executive/${workflow.workflow.id}`}>
                Vollständige Details
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
