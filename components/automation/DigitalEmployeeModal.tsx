'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Bot,
  MessageSquare,
  Clock,
  User,
  Send,
  Settings,
  ArrowRight,
  AlertTriangle
} from "lucide-react";
import { WorkflowInsight } from '@/lib/services/workflow-analyzer';
import { getExecutiveStatus } from '@/lib/services/executive-view-model';
import type { WorkflowTriggerInfo } from '@/lib/services/workflow-introspector';
import Link from 'next/link';

interface DigitalEmployeeModalProps {
  employee: (WorkflowInsight & { triggers?: WorkflowTriggerInfo[] }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartChat: (employee: WorkflowInsight, message: string) => void;
  executing: string[];
}

export function DigitalEmployeeModal({
  employee,
  open,
  onOpenChange,
  onStartChat,
  executing
}: DigitalEmployeeModalProps) {
  const [chatMessage, setChatMessage] = useState('Hallo! Kannst du mir helfen?');

  if (!employee) return null;

  const isExecuting = executing.includes(employee.workflow.id);
  const execStatus = getExecutiveStatus(employee);
  const successRate = employee.executionHistory.total > 0
    ? Math.round((employee.executionHistory.successful / employee.executionHistory.total) * 100)
    : 0;

  const handleStartChat = () => {
    if (chatMessage.trim()) {
      onStartChat(employee, chatMessage.trim());
      setChatMessage('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col modern-card border-0">
        <DialogHeader className="space-y-4">
          <DialogTitle>
            {/* Employee Avatar and Name */}
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center border-2 border-purple-500/20">
                  <Bot className="w-6 h-6 text-purple-600" />
                </div>
                {/* Availability indicator */}
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${
                  employee.workflow.active && successRate >= 80 ? 'bg-green-500' :
                  employee.workflow.active ? 'bg-yellow-500' : 'bg-gray-400'
                }`}></div>
              </div>

              <div>
                <h2 className="text-xl font-bold">{employee.workflow.name}</h2>
                <p className="text-sm text-muted-foreground">Digitaler Mitarbeiter</p>
              </div>
            </div>

            {/* Status Badges Row */}
            <div className="flex items-center gap-2">
              <Badge variant={employee.workflow.active ? "default" : "secondary"} className="text-xs">
                {employee.workflow.active ? 'Verfügbar' : 'Offline'}
              </Badge>
              <Badge variant="outline" className={`text-xs ${
                execStatus.tone === 'good' ? 'text-green-600 border-green-600' :
                execStatus.tone === 'bad' ? 'text-red-600 border-red-600' :
                execStatus.tone === 'warn' ? 'text-yellow-600 border-yellow-600' :
                'text-blue-600 border-blue-600'
              }`}>
                {execStatus.label}
              </Badge>
              {successRate < 80 && employee.executionHistory.total > 0 && (
                <Badge variant="outline" className="text-red-500 border-red-500 text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Hilfe nötig
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Employee Profile */}
          <Card className="modern-card border-purple-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-purple-500" />
                Mitarbeiter Profil
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Status and Experience */}
                <div className="text-sm">
                  <span className="font-medium">Status: </span>
                  <span className="text-muted-foreground">
                    {employee.workflow.active ? (
                      successRate >= 95 ? 'Antwortet zuverlässig • Sehr erfahren' :
                      successRate >= 80 ? 'Antwortet meist schnell • Erfahren' :
                      successRate >= 60 ? 'Antwortet manchmal verzögert • Lernend' :
                      'Benötigt häufig Hilfe • In Ausbildung'
                    ) : (
                      'Derzeit nicht verfügbar'
                    )}
                  </span>
                </div>

                {/* Expertise */}
                {Array.isArray(employee.triggers) && employee.triggers.length > 0 && (
                  <div className="text-sm">
                    <span className="font-medium">Expertise: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {employee.triggers.filter(t => ['chat','telegram','slack','discord','whatsapp','email'].includes(t.type)).map((t, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{t.type}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Performance */}
                <div className="grid grid-cols-3 gap-4 pt-3 border-t border-white/5">
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">{employee.executionHistory.total}</div>
                    <div className="text-xs text-muted-foreground">Aufgaben</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-500">{successRate}%</div>
                    <div className="text-xs text-muted-foreground">Erfolgsrate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-500">
                      {employee.executionHistory.lastExecution ?
                        new Date(employee.executionHistory.lastExecution).toLocaleDateString('de-DE') :
                        'Neu'
                      }
                    </div>
                    <div className="text-xs text-muted-foreground">Zuletzt aktiv</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chat Interface */}
          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Chat starten
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Starten Sie eine Unterhaltung mit {employee.workflow.name}.
                {employee.workflow.active ? ' Sie sind verfügbar und bereit zu helfen.' : ' Sie sind derzeit offline.'}
              </p>

              <div className="space-y-3">
                <Textarea
                  placeholder="Ihre Nachricht..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="min-h-[80px] resize-none"
                  disabled={!employee.workflow.active}
                />

                <Button
                  onClick={handleStartChat}
                  disabled={isExecuting || !employee.workflow.active || !chatMessage.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isExecuting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Nachricht wird gesendet...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Chat starten
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Antwortzeit: ~2-5 Minuten
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Schließen
            </Button>
            <Button asChild className="mystery-button">
              <Link href={`/dashboard/automation/executive/${employee.workflow.id}`}>
                <Settings className="w-4 h-4 mr-2" />
                Vollständiges Profil
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}