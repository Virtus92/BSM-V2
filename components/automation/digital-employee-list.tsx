'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageSquare, Eye, Bot, Clock, Activity, AlertTriangle } from 'lucide-react'
import type { WorkflowInsight } from '@/lib/services/workflow-analyzer'
interface DigitalEmployeeListProps {
  items: WorkflowInsight[]
  executing: string[]
  onOpen: (workflow: WorkflowInsight) => void
  onChat: (workflow: WorkflowInsight) => void
  onExecute: (workflow: WorkflowInsight) => void
}

export function DigitalEmployeeList({ items, onOpen, onChat }: Omit<DigitalEmployeeListProps, 'onExecute' | 'executing'>) {
  if (items.length === 0) {
    return (
      <Card className="modern-card">
        <CardContent className="pt-8 text-center text-muted-foreground">
          Keine digitalen Mitarbeiter gefunden
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {items.map((w) => {
        const triggers = (w as any).triggers as Array<{ type: string }> | undefined
        const successRate = w.executionHistory.total > 0 ? Math.round((w.executionHistory.successful / w.executionHistory.total) * 100) : 0
        const hasChatTrigger = Array.isArray(triggers) && triggers.some(t => t.type === 'chat')
        const needsAttention = successRate < 80 && w.executionHistory.total > 0
        return (
          <Card key={w.workflow.id} className="modern-card hover:border-purple-500/30 transition-all duration-200 group">
            <CardContent className="p-4">
              {/* Team Member Profile Layout */}
              <div className="flex items-center gap-4 mb-3 cursor-pointer" onClick={() => onOpen(w)} role="button">
                {/* Avatar with status indicator */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center border-2 border-purple-500/20">
                    <Bot className="w-6 h-6 text-purple-600" />
                  </div>
                  {/* Availability status dot */}
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${
                    w.workflow.active && successRate >= 80 ? 'bg-green-500' :
                    w.workflow.active ? 'bg-yellow-500' : 'bg-red-400'
                  }`}></div>
                </div>

                {/* Employee Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-base truncate">{w.workflow.name}</h3>
                    <Badge variant={w.workflow.active ? "default" : "secondary"} className="text-xs shrink-0">
                      {w.workflow.active ? 'Verfügbar' : 'Offline'}
                    </Badge>
                  </div>

                  {/* Status line - human-like communication */}
                  <div className="text-sm text-muted-foreground mb-1">
                    {w.workflow.active ? (
                      successRate >= 95 ? 'Antwortet zuverlässig • Sehr erfahren' :
                      successRate >= 80 ? 'Antwortet meist schnell • Erfahren' :
                      successRate >= 60 ? 'Antwortet manchmal verzögert • Lernend' :
                      'Benötigt häufig Hilfe • In Ausbildung'
                    ) : (
                      'Derzeit nicht verfügbar'
                    )}
                  </div>

                  {/* Expertise areas */}
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-muted-foreground">Expertise:</span>
                    {Array.isArray(triggers) && triggers.filter(t => ['chat','telegram','slack','discord','whatsapp','email'].includes(t.type)).slice(0,3).map((t, i) => (
                      <Badge key={i} variant="outline" className="text-xs px-1 py-0">{t.type}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status and Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-white/5 mb-3">
                {/* Status indicators */}
                <div className="flex items-center gap-2">
                  {needsAttention && (
                    <Badge variant="outline" className="text-red-500 border-red-500 text-xs">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Hilfe nötig
                    </Badge>
                  )}
                </div>

                {/* Primary Action - Human-like interaction */}
                <div className="flex items-center gap-2">
                  {hasChatTrigger && w.workflow.active ? (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onChat(w);
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
                    >
                      <MessageSquare className="w-3 h-3" />
                      Chat starten
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpen(w);
                      }}
                      className="gap-2"
                    >
                      <Eye className="w-3 h-3" />
                      Profile ansehen
                    </Button>
                  )}
                </div>
              </div>

              {/* Work History */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  <span>{w.executionHistory.total} Aufgaben</span>
                </div>
                {w.executionHistory.lastExecution ? (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Zuletzt: {new Date(w.executionHistory.lastExecution).toLocaleDateString('de-DE')}</span>
                  </div>
                ) : (
                  <span>Neu im Team</span>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
