/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Send,
  User
} from "lucide-react";
import { WorkflowInsight } from '@/lib/services/workflow-analyzer';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

interface AIAgentChatModalProps {
  workflow: WorkflowInsight | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMessage?: string;
}

export function AIAgentChatModal({ workflow, open, onOpenChange, initialMessage }: AIAgentChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `dashboard-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasAutoSentRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (open && messages.length === 0 && workflow) {
      // Add welcome message when chat opens for first time
      setMessages([{
        id: '1',
        text: `Hallo! Ich bin der AI Agent für ${workflow.workflow.name}. Wie kann ich Ihnen helfen?`,
        sender: 'agent',
        timestamp: new Date()
      }]);
    }
  }, [open, workflow]);

  // Autofill and auto-send initial message when provided
  useEffect(() => {
    if (!open) {
      hasAutoSentRef.current = false;
      return;
    }
    const prefill = (initialMessage || '').trim();
    if (workflow && prefill && !hasAutoSentRef.current) {
      setInputValue(prefill);
      // Defer sending slightly to ensure UI mounts
      setTimeout(() => {
        sendMessage(prefill);
        hasAutoSentRef.current = true;
      }, 50);
    }
  // include initialMessage so it can resend for new prefill when reopened
  }, [open, workflow, initialMessage]);

  // Get webhook URL for the chat trigger
  const getChatWebhookUrl = async () => {
    if (!workflow) return null;

    // Try to get active webhooks from N8N API
    try {
      const response = await fetch(`/api/automation/workflows/${workflow.workflow.id}/webhooks`);
      if (response.ok) {
        const webhooks = await response.json();
        console.log('Active webhooks from API:', webhooks);

        // Look for chat trigger webhook
        const chatWebhook = webhooks.find(w => w.method === 'POST' && w.path.includes('chat'));
        if (chatWebhook) {
          console.log('Found chat webhook:', chatWebhook);
          return chatWebhook.url;
        }
      }
    } catch (apiError) {
      console.log('Failed to get webhooks from API:', apiError);
    }

    const rawNodes = workflow.workflow.nodes || [];
    console.log('All workflow nodes:', rawNodes.map(n => ({
      id: n.id,
      name: n.name,
      type: n.type,
      webhookId: n.webhookId,
      parameters: n.parameters
    })));

    // Check if workflow has triggers array with webhook info
    if (workflow.triggers) {
      console.log('Workflow triggers:', workflow.triggers);
      for (const trigger of workflow.triggers) {
        if (trigger.webhookId) {
          console.log('Found webhook in triggers:', trigger);
          const baseUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'https://n8n.dinel.at/webhook';
          const url = `${baseUrl}/${trigger.webhookId}/chat`;
          console.log('Using trigger webhook URL:', url);
          return url;
        }
      }
    }

    // Check workflow settings for webhook info
    if (workflow.settings) {
      console.log('Workflow settings:', workflow.settings);
    }

    // Prioritize Chat Trigger nodes first
    const chatTriggerNode = rawNodes.find(node =>
      node.type === '@n8n/n8n-nodes-langchain.chatTrigger'
    );

    if (chatTriggerNode) {
      console.log('Found Chat Trigger node:', chatTriggerNode);
      console.log('Node parameters:', JSON.stringify(chatTriggerNode.parameters, null, 2));
      console.log('Node webhookId:', chatTriggerNode.webhookId);
      console.log('Full node object:', JSON.stringify(chatTriggerNode, null, 2));

      // Try different possible webhook ID locations
      const possibleWebhookIds = [
        chatTriggerNode.parameters?.webhookId,
        chatTriggerNode.parameters?.path,
        chatTriggerNode.webhookId,
        chatTriggerNode.id
      ].filter(Boolean);

      console.log('Possible webhook IDs:', possibleWebhookIds);

      const webhookId = possibleWebhookIds[0];
      const baseUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'https://n8n.dinel.at/webhook';
      const url = `${baseUrl}/${webhookId}/chat`;
      console.log('Using Chat Trigger URL:', url);
      return url;
    }

    // Fallback to regular webhook nodes
    const webhookNode = rawNodes.find(node =>
      node.type === 'n8n-nodes-base.webhook' && node.webhookId
    );

    if (webhookNode) {
      console.log('Found Webhook node:', webhookNode);
      const webhookId = webhookNode.webhookId;
      const baseUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'https://n8n.dinel.at/webhook';
      const url = `${baseUrl}/${webhookId}`;
      console.log('Using Webhook URL:', url);
      return url;
    }

    console.log('No suitable webhook node found');
    console.log('Available nodes:', rawNodes.map(n => ({ id: n.id, type: n.type, webhookId: n.webhookId })));
    return null;
  };

  const sendMessage = async (overrideText?: string) => {
    const textSource = typeof overrideText === 'string' ? overrideText : inputValue;
    const textToSend = textSource.trim();
    if (!textToSend || isLoading || !workflow) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: textToSend,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const baseWebhookUrl = await getChatWebhookUrl();
      if (!baseWebhookUrl) {
        console.error('No webhook URL found for workflow:', workflow.workflow.name);
        throw new Error('No webhook URL found');
      }

      const payload = {
        chatInput: userMessage.text,
        sessionId: sessionId,
        source: 'executive-dashboard',
        workflowId: workflow.workflow.id,
        timestamp: new Date().toISOString()
      };

      console.log('Message payload:', payload);

      // Try multiple webhook URL variations
      const baseUrlWithoutChat = baseWebhookUrl.replace('/chat', '');
      const urlsToTry = [
        baseUrlWithoutChat,
        baseUrlWithoutChat + '/chat',
        baseUrlWithoutChat.replace('/webhook/', '/webhook-test/'),
        baseUrlWithoutChat.replace('/webhook/', '/webhook-test/') + '/chat'
      ];

      let lastError = null;
      for (const webhookUrl of urlsToTry) {
        try {
          console.log('Trying webhook URL:', webhookUrl);

          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
          });

          console.log('Response status:', response.status);
          const responseText = await response.text();
          console.log('Response text:', responseText);

          if (response.ok) {
            const result = JSON.parse(responseText);
            const agentMessage: ChatMessage = {
              id: (Date.now() + 1).toString(),
              text: result.output || result.response || 'Entschuldigung, ich konnte keine Antwort generieren.',
              sender: 'agent',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, agentMessage]);
            return; // Success, exit function
          }

          lastError = `HTTP ${response.status}: ${responseText}`;
        } catch (fetchError) {
          lastError = fetchError instanceof Error ? fetchError.message : 'Fetch failed';
          console.log('Failed with URL:', webhookUrl, 'Error:', lastError);
        }
      }

      throw new Error(lastError || 'All webhook URLs failed');
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: `Debug: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sender: 'agent',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!workflow) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-3xl lg:max-w-4xl h-[80vh] flex flex-col modern-card border-0">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold">AI Agent Chat</h2>
                <p className="text-sm text-muted-foreground">{workflow.workflow.name}</p>
              </div>
            </div>
            <Badge variant="default">
              <div className="w-2 h-2 rounded-full mr-2 bg-green-500 animate-pulse" />
              Verbunden
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/[0.02] rounded-xl border border-white/[0.05]">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  {message.sender === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div
                  className={`p-3 rounded-lg text-sm ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-white/[0.05] border border-white/[0.1]'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.text}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {message.timestamp.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[80%]">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white/[0.05] border border-white/[0.1] p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    <span className="text-sm ml-2">AI Agent antwortet...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Nachricht an AI Agent..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!inputValue.trim() || isLoading}
              className="mystery-button"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-3 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>💡 Tipp: Nutzen Sie natürliche Sprache für Anfragen</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Schließen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
