/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  MessageSquare,
  Bot,
  User,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Database,
  Code,
  ArrowRight
} from "lucide-react"

interface ConversationModalProps {
  conversation: {
    sessionId: string
    executions: Array<{
      id: string
      status: 'success' | 'error' | 'running'
      startedAt: Date
      finishedAt?: Date
      result?: any
      progress?: number
    }>
    startTime: Date
    endTime: Date
    status: 'success' | 'error' | 'running'
    messageCount: number
  }
  viewType: 'digital_employee' | 'process'
  open: boolean
  onClose: () => void
}

export function ConversationModal({ conversation, viewType, open, onClose }: ConversationModalProps) {
  const [conversationData, setConversationData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open && conversation.sessionId) {
      extractConversationMessages()
    }
  }, [open, conversation.sessionId])

  const extractConversationMessages = async () => {
    setIsLoading(true)
    try {
      const messages = []

      // Sort executions chronologically
      const sortedExecutions = [...conversation.executions].sort((a, b) => {
        const aTime = a.startedAt instanceof Date ? a.startedAt.getTime() : new Date(a.startedAt).getTime()
        const bTime = b.startedAt instanceof Date ? b.startedAt.getTime() : new Date(b.startedAt).getTime()
        return aTime - bTime
      })

      for (const execution of sortedExecutions) {
        let executionData = execution.result

        // If no result data, fetch detailed execution data from API
        if (!executionData) {
          try {
            const response = await fetch(`/api/automation/executions/${execution.id}`)
            if (response.ok) {
              const detailedExecution = await response.json()
              console.log(`Detailed execution data for ${execution.id}:`, JSON.stringify(detailedExecution, null, 2))

              // The execution data IS the response from the API
              executionData = detailedExecution
            }
          } catch (error) {
            console.error(`Failed to fetch execution details for ${execution.id}:`, error)
          }
        }

        // Extract input and output from execution data
        console.log(`Extracting data for execution ${execution.id}:`, {
          hasExecutionData: !!executionData,
          executionDataKeys: executionData ? Object.keys(executionData) : [],
          hasData: !!executionData?.data,
          hasResultData: !!executionData?.data?.resultData,
          hasRunData: !!executionData?.data?.resultData?.runData,
          runDataKeys: executionData?.data?.resultData?.runData ? Object.keys(executionData.data.resultData.runData) : []
        })

        const input = extractInputFromResult(executionData)
        const output = extractOutputFromResult(executionData)

        messages.push({
          executionId: execution.id,
          input,
          output,
          timestamp: execution.startedAt,
          status: execution.status
        })
      }

      setConversationData({
        messages,
        metadata: {
          sessionId: conversation.sessionId,
          duration: (conversation.endTime instanceof Date ? conversation.endTime : new Date(conversation.endTime)).getTime() -
                   (conversation.startTime instanceof Date ? conversation.startTime : new Date(conversation.startTime)).getTime(),
          messageCount: conversation.messageCount,
          status: conversation.status,
          startTime: conversation.startTime,
          endTime: conversation.endTime
        }
      })
    } catch (error) {
      console.error('Failed to extract conversation messages:', error)
      setConversationData({
        messages: [],
        metadata: {
          sessionId: conversation.sessionId,
          duration: 0,
          messageCount: 0,
          status: 'error'
        }
      })
    } finally {
      setIsLoading(false)
    }
  }

  const extractInputFromResult = (result: any) => {
    if (!result) return 'Keine Eingabe verfügbar'

    try {
      // N8N execution structure: result.data.resultData.runData["Chat Trigger"][0].data.main[0][0].json.chatInput
      const chatTriggerData = result?.data?.resultData?.runData?.["Chat Trigger"]?.[0]?.data?.main?.[0]?.[0]?.json
      if (chatTriggerData?.chatInput) {
        return chatTriggerData.chatInput
      }

      // Alternative: check message field as well
      if (chatTriggerData?.message) {
        return chatTriggerData.message
      }

      // Fallback to other possible locations
      if (result?.json?.chatInput) {
        return result.json.chatInput
      }

      if (result?.input) return result.input
      if (result?.message) return result.message
      if (result?.prompt) return result.prompt
      if (typeof result === 'string') return result

      return 'Keine Eingabe gefunden'
    } catch (error) {
      console.error('Error extracting input:', error)
      return 'Fehler beim Extrahieren der Eingabe'
    }
  }

  const extractOutputFromResult = (result: any) => {
    if (!result) return 'Keine Ausgabe verfügbar'

    try {
      // N8N execution structure: result.data.resultData.runData["AI Agent"][0].data.main[0][0].json.output
      const aiAgentData = result?.data?.resultData?.runData?.["AI Agent"]?.[0]?.data?.main?.[0]?.[0]?.json
      if (aiAgentData?.output) {
        return aiAgentData.output
      }

      // Alternative: check "Respond to Webhook" node output
      const respondData = result?.data?.resultData?.runData?.["Respond to Webhook"]?.[0]?.data?.main?.[0]?.[0]?.json
      if (respondData?.output) {
        return respondData.output
      }

      // Fallback to other possible locations
      if (result?.json?.output) {
        return result.json.output
      }

      if (result?.output) return result.output
      if (result?.response) return result.response
      if (result?.result) return result.result

      return 'Keine Ausgabe gefunden'
    } catch (error) {
      console.error('Error extracting output:', error)
      return 'Fehler beim Extrahieren der Ausgabe'
    }
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${Math.round(ms / 1000)}s`
    return `${Math.round(ms / 60000)}min`
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {viewType === 'digital_employee' ? (
              <>
                <Bot className="w-5 h-5 text-purple-600" />
                Mitarbeiter Konversation
              </>
            ) : (
              <>
                <Database className="w-5 h-5 text-orange-600" />
                Prozess Ausführung
              </>
            )}
            <Badge variant={conversation.status === 'success' ? 'default' : 'destructive'} className="ml-2">
              {conversation.status === 'success' ? 'Erfolgreich' :
               conversation.status === 'error' ? 'Fehler' : 'Läuft'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Lade Konversation...
            </div>
          ) : (
            <div className="space-y-4">
              {/* Execution Metadata */}
              <Card className={`border ${viewType === 'digital_employee' ? 'border-purple-500/20' : 'border-orange-500/20'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {conversation.startTime instanceof Date ?
                          conversation.startTime.toLocaleString('de-DE') :
                          new Date(conversation.startTime).toLocaleString('de-DE')}
                      </div>
                      {conversationData?.metadata?.duration && (
                        <div className="flex items-center gap-1">
                          <ArrowRight className="w-4 h-4" />
                          {formatDuration(conversationData.metadata.duration)}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Session: {conversation.sessionId.slice(0, 12)}...
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Conversation Flow */}
              {viewType === 'digital_employee' ? (
                <div className="space-y-4">
                  {conversationData?.messages?.map((message: any, index: number) => (
                    <div key={message.executionId} className="space-y-3">
                      {/* User Input */}
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <Card className="flex-1">
                          <CardContent className="p-3">
                            <div className="text-sm font-medium text-blue-600 mb-1">Sie</div>
                            <div className="text-sm">
                              {message.input || 'Nachricht gesendet'}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {(message.timestamp instanceof Date ?
                                message.timestamp :
                                new Date(message.timestamp)
                              ).toLocaleTimeString('de-DE')}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* AI Response */}
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-purple-600" />
                        </div>
                        <Card className="flex-1">
                          <CardContent className="p-3">
                            <div className="text-sm font-medium text-purple-600 mb-1">Digitaler Mitarbeiter</div>
                            <div className="text-sm whitespace-pre-wrap">
                              {message.output || 'Antwort wird verarbeitet...'}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {(message.timestamp instanceof Date ?
                                message.timestamp :
                                new Date(message.timestamp)
                              ).toLocaleTimeString('de-DE')}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-4 text-muted-foreground">
                      Keine Nachrichten gefunden
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* System Input */}
                  <Card className="border-orange-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Code className="w-4 h-4 text-orange-600" />
                        <div className="text-sm font-medium text-orange-600">System Input</div>
                      </div>
                      <div className="bg-orange-500/5 rounded p-3 font-mono text-xs">
                        <pre className="whitespace-pre-wrap">
                          {conversationData?.input || 'Automatische Verarbeitung'}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>

                  {/* System Output */}
                  <Card className="border-orange-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="w-4 h-4 text-orange-600" />
                        <div className="text-sm font-medium text-orange-600">System Output</div>
                      </div>
                      <div className="bg-orange-500/5 rounded p-3 font-mono text-xs">
                        <pre className="whitespace-pre-wrap">
                          {conversationData?.output || 'Verarbeitung abgeschlossen'}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Schließen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}