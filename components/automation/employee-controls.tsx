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
  Bot
} from "lucide-react"
import { type WorkflowInsight } from '@/lib/services/workflow-analyzer'
import { type WorkflowTriggerInfo } from '@/lib/services/workflow-introspector'

interface EmployeeControlsProps {
  insight: WorkflowInsight
  triggers: WorkflowTriggerInfo[]
  onChatStart?: (message: string) => void
}

export function EmployeeControls({ insight, triggers, onChatStart }: EmployeeControlsProps) {
  const [chatMessage, setChatMessage] = useState('')

  const hasChatTrigger = triggers.some(t => t.type === 'chat')
  const hasEmailTrigger = triggers.some(t => t.type === 'email')
  const hasTelegramTrigger = triggers.some(t => t.type === 'telegram')

  const handleChatStart = () => {
    if (chatMessage.trim() && onChatStart) {
      onChatStart(chatMessage.trim())
      setChatMessage('')
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

    </div>
  )
}