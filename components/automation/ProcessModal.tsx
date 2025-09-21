'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Webhook,
  Workflow,
  Play,
  TestTube,
  Settings,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Zap,
  BarChart3,
  ArrowRight,
  Server
} from "lucide-react";
import { WorkflowInsight } from '@/lib/services/workflow-analyzer';
import { getExecutiveStatus } from '@/lib/services/executive-view-model';
import type { WorkflowTriggerInfo } from '@/lib/services/workflow-introspector';
import Link from 'next/link';

interface ProcessModalProps {
  process: (WorkflowInsight & { triggers?: WorkflowTriggerInfo[] }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExecute: (process: WorkflowInsight, payload?: any) => void;
  executing: string[];
}

export function ProcessModal({
  process,
  open,
  onOpenChange,
  onExecute,
  executing
}: ProcessModalProps) {
  const [testPayload, setTestPayload] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!process) return null;

  const isExecuting = executing.includes(process.workflow.id);
  const execStatus = getExecutiveStatus(process);
  const successRate = process.executionHistory.total > 0
    ? Math.round((process.executionHistory.successful / process.executionHistory.total) * 100)
    : 0;

  const Icon = process.capabilities.hasWebhookTrigger ? Webhook : Workflow;

  const handleExecute = (withPayload = false) => {
    let payload = undefined;
    if (withPayload && testPayload) {
      try {
        payload = JSON.parse(testPayload);
      } catch {
        payload = { test: true, data: testPayload };
      }
    }
    onExecute(process, payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col modern-card border-0">
        <DialogHeader className="space-y-4">
          <DialogTitle>
            {/* Service Icon and Name */}
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-600/20 flex items-center justify-center border-2 border-orange-500/20">
                  <Icon className="w-6 h-6 text-orange-600" />
                </div>
                {/* Health indicator */}
                <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${
                  process.workflow.active && successRate >= 95 ? 'bg-green-500' :
                  process.workflow.active && successRate >= 80 ? 'bg-yellow-500' :
                  process.workflow.active ? 'bg-red-500' : 'bg-gray-400'
                }`}></div>
              </div>

              <div>
                <h2 className="text-xl font-bold">{process.workflow.name}</h2>
                <p className="text-sm text-muted-foreground">Geschäftsprozess / API</p>
              </div>
            </div>

            {/* Status Badges Row */}
            <div className="flex items-center gap-2">
              <Badge variant={process.workflow.active ? "default" : "secondary"} className="text-xs">
                {process.workflow.active ? 'Online' : 'Offline'}
              </Badge>
              <Badge variant="outline" className={`text-xs ${
                execStatus.tone === 'good' ? 'text-green-600 border-green-600' :
                execStatus.tone === 'bad' ? 'text-red-600 border-red-600' :
                execStatus.tone === 'warn' ? 'text-yellow-600 border-yellow-600' :
                'text-blue-600 border-blue-600'
              }`}>
                {execStatus.label}
              </Badge>
              {successRate < 80 && process.executionHistory.total > 0 && (
                <Badge variant="outline" className="text-red-500 border-red-500 text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Service Alert
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Service Health Overview */}
          <Card className="modern-card border-orange-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5 text-orange-500" />
                Service Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Health Status */}
                <div className="text-sm">
                  <span className="font-medium">Status: </span>
                  <span className="text-muted-foreground">
                    {process.workflow.active ? (
                      successRate >= 95 ? `Gesund • ${successRate}% Uptime • Läuft stabil` :
                      successRate >= 80 ? `Funktional • ${successRate}% Uptime • Gelegentliche Fehler` :
                      successRate >= 60 ? `Instabil • ${successRate}% Uptime • Braucht Wartung` :
                      `Problematisch • ${successRate}% Uptime • Kritische Fehler`
                    ) : (
                      'Service gestoppt'
                    )}
                  </span>
                </div>

                {/* Trigger Types */}
                {Array.isArray(process.triggers) && process.triggers.length > 0 && (
                  <div className="text-sm">
                    <span className="font-medium">Auslöser: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {process.triggers.filter(t => ['webhook','manual','cron'].includes(t.type)).map((t, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{t.type}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Performance Metrics */}
                <div className="grid grid-cols-4 gap-4 pt-3 border-t border-white/5">
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">{process.executionHistory.total}</div>
                    <div className="text-xs text-muted-foreground">Ausführungen</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-500">{process.executionHistory.successful}</div>
                    <div className="text-xs text-muted-foreground">Erfolgreich</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-500">{process.executionHistory.failed}</div>
                    <div className="text-xs text-muted-foreground">Fehlgeschlagen</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-500">{successRate}%</div>
                    <div className="text-xs text-muted-foreground">Uptime</div>
                  </div>
                </div>

                {/* Success Rate Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Erfolgsrate</span>
                    <span className={successRate >= 80 ? 'text-green-500' : successRate >= 60 ? 'text-yellow-500' : 'text-red-500'}>
                      {successRate}%
                    </span>
                  </div>
                  <Progress value={successRate} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Execution Controls */}
          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Prozess Ausführung
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.workflow.active ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Service ist online und bereit für Ausführung.
                  </p>

                  {/* Quick Execute */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleExecute(false)}
                      disabled={isExecuting}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      {isExecuting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Läuft...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Schnelltest
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

                  {/* Advanced Testing */}
                  {showAdvanced && (
                    <div className="space-y-3 pt-3 border-t border-white/5">
                      <label className="text-sm font-medium">Test Payload (JSON)</label>
                      <Textarea
                        placeholder='{"test": true, "data": "sample"}'
                        value={testPayload}
                        onChange={(e) => setTestPayload(e.target.value)}
                        className="min-h-[80px] font-mono text-sm"
                      />
                      <Button
                        onClick={() => handleExecute(true)}
                        disabled={isExecuting}
                        variant="outline"
                        className="w-full"
                      >
                        <TestTube className="w-4 h-4 mr-2" />
                        Mit Custom Payload ausführen
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="text-muted-foreground mb-3">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                    Service ist offline
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Der Prozess muss erst aktiviert werden, bevor er ausgeführt werden kann.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {process.executionHistory.lastExecution ?
              `Zuletzt: ${new Date(process.executionHistory.lastExecution).toLocaleString('de-DE')}` :
              'Noch nicht ausgeführt'
            }
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Schließen
            </Button>
            <Button asChild className="mystery-button">
              <Link href={`/dashboard/automation/executive/${process.workflow.id}`}>
                <BarChart3 className="w-4 h-4 mr-2" />
                Monitoring
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}