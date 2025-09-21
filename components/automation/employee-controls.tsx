/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  MessageSquare,
  Send,
  Bot,
  Clock,
  TestTube,
  Eye,
  CheckCircle,
  XCircle,
  Play
} from "lucide-react"
import { type WorkflowInsight } from '@/lib/services/workflow-analyzer'
import { type WorkflowTriggerInfo } from '@/lib/services/workflow-introspector'

interface EmployeeControlsProps {
  insight: WorkflowInsight
  triggers: WorkflowTriggerInfo[]
  onChatStart?: (message: string) => void
  onTaskAssign?: (task: string) => void
}

export function EmployeeControls({ insight, triggers, onChatStart, onTaskAssign }: EmployeeControlsProps) {
  const [chatMessage, setChatMessage] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)

  const hasChatTrigger = triggers.some(t => t.type === 'chat')
  const hasEmailTrigger = triggers.some(t => t.type === 'email')
  const hasTelegramTrigger = triggers.some(t => t.type === 'telegram')

  const handleChatStart = () => {
    if (chatMessage.trim() && onChatStart) {
      onChatStart(chatMessage.trim())
      setChatMessage('')
    }
  }

  const handleTaskAssign = async () => {
    if (!taskDescription.trim()) return

    setIsExecuting(true)
    try {
      if (onTaskAssign) {
        await onTaskAssign(taskDescription.trim())
      }
      setTaskDescription('')
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Employee Interaction Panel */}
      <Card className="modern-card border-purple-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-600" />
            Mitarbeiter Interaktion
          </CardTitle>
          <CardDescription>
            Direkter Chat und Aufgabenzuweisung für {insight.workflow.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Chat */}
          {hasChatTrigger && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">💬 Direkter Chat</h4>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Nachricht an den digitalen Mitarbeiter..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="flex-1 min-h-[80px] resize-none"
                  disabled={!insight.workflow.active}
                />
              </div>
              <Button
                onClick={handleChatStart}
                disabled={!chatMessage.trim() || !insight.workflow.active}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat starten
              </Button>
            </div>
          )}

          {/* Task Assignment */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">📋 Aufgabe zuweisen</h4>
            <Textarea
              placeholder="Beschreiben Sie die Aufgabe für den digitalen Mitarbeiter..."
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              className="min-h-[80px] resize-none"
              disabled={!insight.workflow.active}
            />
            <Button
              onClick={handleTaskAssign}
              disabled={isExecuting || !taskDescription.trim() || !insight.workflow.active}
              className="w-full"
              variant="outline"
            >
              {isExecuting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Aufgabe wird zugewiesen...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Aufgabe zuweisen
                </>
              )}
            </Button>
          </div>

          {/* Communication Channels */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">📱 Verfügbare Kanäle</h4>
            <div className="flex flex-wrap gap-2">
              {hasChatTrigger && (
                <Badge variant="outline" className="text-purple-600 border-purple-600">
                  💬 Chat
                </Badge>
              )}
              {hasEmailTrigger && (
                <Badge variant="outline" className="text-blue-600 border-blue-600">
                  ✉️ E-Mail
                </Badge>
              )}
              {hasTelegramTrigger && (
                <Badge variant="outline" className="text-cyan-600 border-cyan-600">
                  📱 Telegram
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Test Scenarios */}
      <Card className="modern-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5 text-purple-500" />
            Test Szenarien
          </CardTitle>
          <CardDescription>
            Vordefinierte Szenarien zum Testen der Mitarbeiter-Fähigkeiten
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <Button
              variant="outline"
              className="justify-start text-left h-auto p-3"
              onClick={() => setChatMessage('Zeige mir die letzten Kundenanfragen')}
            >
              <div>
                <p className="font-medium">📊 Kundenanfragen Review</p>
                <p className="text-sm text-muted-foreground">Aktuelle Kundenanfragen anzeigen</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start text-left h-auto p-3"
              onClick={() => setChatMessage('Erstelle einen Termin für morgen 14:00')}
            >
              <div>
                <p className="font-medium">📅 Termin erstellen</p>
                <p className="text-sm text-muted-foreground">Neuen Termin planen</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start text-left h-auto p-3"
              onClick={() => setChatMessage('Sende eine Follow-up E-Mail an den letzten Kunden')}
            >
              <div>
                <p className="font-medium">✉️ Follow-up E-Mail</p>
                <p className="text-sm text-muted-foreground">Automatische Kundenkommunikation</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}