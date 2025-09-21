/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Bot,
  Webhook,
  Database,
  Workflow,
  Bell,
  Play,
  MessageSquare,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Eye,
  Zap,
  TestTube,
  BarChart3,
  ArrowRight,
  Settings
} from "lucide-react";
import { WorkflowInsight } from '@/lib/services/workflow-analyzer';
import { WorkflowVisualizer } from '@/components/automation/workflow-visualizer';
import { getExecutiveStatus, classifyView } from '@/lib/services/executive-view-model';
import type { WorkflowTriggerInfo } from '@/lib/services/workflow-introspector';
import Link from 'next/link';

interface WorkflowQuickModalProps {
  workflow: (WorkflowInsight & { triggers?: WorkflowTriggerInfo[] }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExecute: (workflow: WorkflowInsight, payload?: any) => void;
  onAIChat: (workflow: WorkflowInsight) => void;
  executing: string[];
}

const categoryConfig = {
  ai_agent: {
    icon: Bot,
    title: 'AI Agent',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20'
  },
  webhook_service: {
    icon: Webhook,
    title: 'API Service',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20'
  },
  data_processor: {
    icon: Database,
    title: 'Data Processing',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20'
  },
  automation_pipeline: {
    icon: Workflow,
    title: 'Automation Pipeline',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20'
  },
  notification_system: {
    icon: Bell,
    title: 'Notification System',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20'
  }
};

export function WorkflowQuickModal({
  workflow,
  open,
  onOpenChange,
  onExecute,
  onAIChat,
  executing
}: WorkflowQuickModalProps) {
  const [testPayload, setTestPayload] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!workflow) return null;

  const config = categoryConfig[workflow.category];
  const Icon = config.icon;
  const isExecuting = executing.includes(workflow.workflow.id);
  const hasChatTrigger = Array.isArray(workflow.triggers) && workflow.triggers.some(t => t.type === 'chat');
  const execStatus = getExecutiveStatus(workflow)
  const view = classifyView(workflow, workflow.triggers)

  // Calculate metrics
  const successRate = workflow.executionHistory.total > 0
    ? Math.round((workflow.executionHistory.successful / workflow.executionHistory.total) * 100)
    : 0;

  const performanceColor =
    successRate >= 95 ? 'text-green-500' :
    successRate >= 80 ? 'text-yellow-500' :
    'text-red-500';

  const handleExecute = (withPayload = false) => {
    let payload = undefined;
    if (withPayload && testPayload) {
      try {
        payload = JSON.parse(testPayload);
      } catch {
        payload = { test: true, message: testPayload };
      }
    }
    onExecute(workflow, payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col modern-card border-0">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${config.color}`} />
              </div>
              <div>
                <h2 className="text-xl font-bold">{workflow.workflow.name}</h2>
                <p className="text-sm text-muted-foreground">{view === 'digital_employee' ? 'Digitaler Mitarbeiter' : 'Geschäftsprozess'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={workflow.workflow.active ? "default" : "secondary"} className="text-xs">
                {workflow.workflow.active ? 'Aktiv' : 'Inaktiv'}
              </Badge>
              <Badge variant="outline" className={`text-xs ${
                execStatus.tone === 'good' ? 'text-green-600 border-green-600' :
                execStatus.tone === 'bad' ? 'text-red-600 border-red-600' :
                execStatus.tone === 'warn' ? 'text-yellow-600 border-yellow-600' :
                'text-blue-600 border-blue-600'
              }`}>
                {execStatus.label}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Description */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <p className="text-muted-foreground">{workflow.businessMetrics.description}</p>
          </div>

          {/* Triggers / Capabilities */}
          {Array.isArray(workflow.triggers) && workflow.triggers.length > 0 && (
            <Card className="modern-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  Triggers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {workflow.triggers.map(t => (
                    <Badge key={t.nodeId} variant="outline" className="text-xs">
                      {t.type}{t.promptField ? `:${t.promptField}` : ''}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {workflow.businessMetrics.kpis.slice(0, 4).map((kpi, index) => (
              <Card key={index} className={`${config.bgColor} ${config.borderColor} border`}>
                <CardContent className="p-4 text-center">
                  <p className="text-lg font-bold">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  {kpi.trend && (
                    <div className={`flex items-center justify-center gap-1 mt-1 ${
                      kpi.trend === 'up' ? 'text-green-500' :
                      kpi.trend === 'down' ? 'text-red-500' :
                      'text-muted-foreground'
                    }`}>
                      <TrendingUp className={`w-3 h-3 ${kpi.trend === 'down' ? 'rotate-180' : ''}`} />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Performance Overview */}
          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-xl bg-white/[0.02]">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-lg font-bold text-green-500">
                      {workflow.executionHistory.successful}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Erfolgreich</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-white/[0.02]">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-lg font-bold text-red-500">
                      {workflow.executionHistory.failed}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Fehlgeschlagen</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-white/[0.02]">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Activity className="w-4 h-4 text-blue-500" />
                    <span className="text-lg font-bold text-blue-500">
                      {workflow.executionHistory.total}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Gesamt</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-white/[0.02]">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <TrendingUp className={`w-4 h-4 ${performanceColor}`} />
                    <span className={`text-lg font-bold ${performanceColor}`}>
                      {successRate}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Erfolgsrate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          {/* Context-aware Actions based on view */}
          {view === 'digital_employee' ? (
            /* Digital Employee - Only Chat Action */
            <Card className="modern-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Digitaler Mitarbeiter
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Direkt mit dem digitalen Mitarbeiter interagieren
                </p>
                <Button
                  onClick={() => onAIChat(workflow)}
                  disabled={isExecuting || !workflow.workflow.active}
                  className="w-full mystery-button"
                >
                  {isExecuting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Läuft...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Mitarbeiter Chat
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* Process - Execution Controls */
            <Card className="modern-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Prozess Ausführung
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleExecute(false)}
                    disabled={isExecuting || !workflow.workflow.active}
                    className="flex-1 mystery-button"
                  >
                    {isExecuting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Läuft...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Prozess Test
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    <TestTube className="w-4 h-4" />
                  </Button>
                </div>

                {showAdvanced && (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Optionale Test-Payload (JSON)..."
                      value={testPayload}
                      onChange={(e) => setTestPayload(e.target.value)}
                      className="min-h-[80px] font-mono text-sm"
                    />
                    <Button
                      onClick={() => handleExecute(true)}
                      disabled={isExecuting || !workflow.workflow.active}
                      variant="outline"
                      className="w-full"
                    >
                      <TestTube className="w-4 h-4 mr-2" />
                      Mit Payload ausführen
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Workflow Architecture Preview */}
          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Workflow Architektur
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WorkflowVisualizer nodes={workflow.nodes} />
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {workflow.executionHistory.lastExecution && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Zuletzt: {workflow.executionHistory.lastExecution.toLocaleString('de-DE')}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Schließen
            </Button>
            <Button asChild className="mystery-button">
              <Link href={`/dashboard/automation/executive/${workflow.workflow.id}`}>
                <Eye className="w-4 h-4 mr-2" />
                Vollständige Details
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
