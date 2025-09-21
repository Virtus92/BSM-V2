/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Bot,
  User,
  Send,
  Loader2,
  MessageSquare,
  Clock,
  CheckCircle,
  Activity
} from "lucide-react";
import { WorkflowInsight } from '@/lib/services/workflow-analyzer';

interface ChatMessage {
  id: string;
  type: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  metadata?: any;
}

interface AIAgentChatModalProps {
  workflow: WorkflowInsight | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMessage?: string;
}

export function AIAgentChatModal({ workflow, open, onOpenChange, initialMessage }: AIAgentChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when modal opens and send initial message
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }

    // Send initial message if provided
    if (open && initialMessage && initialMessage.trim() && workflow) {
      setInputMessage(initialMessage);
      setTimeout(() => {
        if (isConnected) {
          sendMessage();
        }
      }, 1000);
    }
  }, [open, initialMessage, workflow]);

  const initializeChat = useCallback(async () => {
    if (!workflow) return;

    setMessages([]);
    setIsConnected(false);
    setIsLoading(true);

    try {
      // Test connection to AI agent
      const response = await fetch('/api/automation/ai-agent/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: workflow.workflow.id,
          action: 'connect'
        })
      });

      if (response.ok) {
        setIsConnected(true);
        addSystemMessage('Verbindung zum AI Agent hergestellt. Wie kann ich Ihnen helfen?');

        // Add welcome suggestions based on workflow type
        if (workflow.category === 'ai_agent') {
          setTimeout(() => {
            addSystemMessage('💡 Versuchen Sie: "Zeige mir die letzten Kundenanfragen" oder "Erstelle einen Testtermin"');
          }, 1000);
        }
      } else {
        addSystemMessage('❌ Fehler beim Verbinden mit dem AI Agent. Workflow könnte inaktiv sein.');
      }
    } catch {
      addSystemMessage('❌ Verbindungsfehler. Bitte überprüfen Sie die N8N Konfiguration.');
    } finally {
      setIsLoading(false);
    }
  }, [workflow]);

  // Initialize chat when workflow changes
  useEffect(() => {
    if (workflow && open) {
      initializeChat();
    }
  }, [workflow, open, initializeChat]);

  const addSystemMessage = (content: string) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      type: 'system',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };


  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !workflow || !isConnected) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Send message to AI agent via webhook
      const response = await fetch('/api/automation/ai-agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: workflow.workflow.id,
          message: userMessage.content,
          userId: 'executive-dashboard',
          timestamp: userMessage.timestamp.toISOString()
        })
      });

      if (response.ok) {
        const result = await response.json();

        // Direct webhook response - no polling bullshit
        if (result.response) {
          // Got response from webhook
          const agentMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: 'agent',
            content: result.response,
            timestamp: new Date(),
            metadata: result.metadata
          };
          setMessages(prev => [...prev, agentMessage]);

          // Handle any generated files or actions
          if (result.files?.length > 0) {
            addSystemMessage(`📎 ${result.files.length} Datei(en) wurden generiert und stehen zum Download bereit.`);
          }

          if (result.actions?.length > 0) {
            addSystemMessage(`⚡ ${result.actions.length} Aktion(en) wurden ausgeführt: ${result.actions.map((a: any) => a.description).join(', ')}`);
          }
        } else {
          // No response from webhook = error
          addSystemMessage('❌ Workflow lieferte keine Antwort. Prüfen Sie den N8N Workflow auf "Respond to Webhook" node.');
        }
        setIsLoading(false);
      } else {
        const errorData = await response.json();
        addSystemMessage(`❌ Fehler: ${errorData.error || 'Unbekannter Fehler beim Senden der Nachricht'}`);
      }
    } catch {
      addSystemMessage('❌ Netzwerkfehler beim Senden der Nachricht.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    addSystemMessage('Chat wurde zurückgesetzt.');
  };

  if (!workflow) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-3xl lg:max-w-4xl h-[80vh] flex flex-col modern-card border-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold">AI Agent Chat</h2>
              <p className="text-sm text-muted-foreground">{workflow.workflow.name}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Badge variant={isConnected ? "default" : "secondary"}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
                }`} />
                {isConnected ? 'Verbunden' : 'Getrennt'}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/[0.02] rounded-xl border border-white/[0.05]">
          {messages.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Starten Sie eine Unterhaltung mit dem AI Agent
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${
              message.type === 'user' ? 'justify-end' : 'justify-start'
            }`}>
              <div className={`flex gap-3 max-w-[80%] ${
                message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}>
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  {message.type === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : message.type === 'agent' ? (
                    <Bot className="w-4 h-4" />
                  ) : (
                    <Activity className="w-4 h-4" />
                  )}
                </div>
                <Card className={`${
                  message.type === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : message.type === 'system'
                    ? 'bg-blue-500/10 border-blue-500/20'
                    : 'bg-white/[0.05] border-white/[0.1]'
                }`}>
                  <CardContent className="p-3">
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-60 mt-1">
                      {message.timestamp.toLocaleTimeString('de-DE')}
                    </p>

                    {/* Metadata display for agent responses */}
                    {message.metadata && (
                      <div className="mt-2 pt-2 border-t border-white/[0.1] space-y-1">
                        {message.metadata.executionTime && (
                          <div className="flex items-center gap-1 text-xs opacity-80">
                            <Clock className="w-3 h-3" />
                            {message.metadata.executionTime}ms
                          </div>
                        )}
                        {message.metadata.confidence && (
                          <div className="flex items-center gap-1 text-xs opacity-80">
                            <CheckCircle className="w-3 h-3" />
                            {Math.round(message.metadata.confidence * 100)}% Konfidenz
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[80%]">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <Card className="bg-white/[0.05] border-white/[0.1]">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">AI Agent antwortet...</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="space-y-3">
          {/* Quick Suggestions */}
          {isConnected && messages.length === 0 && !isLoading && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInputMessage('Zeige mir die System-Statistiken')}
              >
                📊 System-Status
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInputMessage('Erstelle einen Test-Termin für morgen')}
              >
                📅 Test-Termin
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInputMessage('Was sind meine letzten Aktivitäten?')}
              >
                📝 Aktivitäten
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder={isConnected ? "Nachricht an AI Agent..." : "Verbindung wird hergestellt..."}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={!isConnected || isLoading}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || !isConnected || isLoading}
              className="mystery-button"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-3 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>💡 Tipp: Nutzen Sie natürliche Sprache für Anfragen</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={clearChat}>
              Chat löschen
            </Button>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Schließen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
