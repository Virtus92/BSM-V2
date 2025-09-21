'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, X, Send, Bot, User } from "lucide-react";

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

export function LandingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add welcome message when chat opens for first time
      setMessages([{
        id: '1',
        text: 'Hallo! Haben Sie Fragen zu Rising BSM V2? Ich helfe gerne weiter!',
        sender: 'agent',
        timestamp: new Date()
      }]);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const webhookId = process.env.NEXT_PUBLIC_LANDING_AGENT_WEBHOOK_ID;
      const baseUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'https://n8n.dinel.at/webhook';
      const webhookUrl = `${baseUrl}/${webhookId}`;

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatInput: userMessage.text,
          sessionId: sessionId,
          source: 'landing-page',
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        const result = await response.json();
        const agentMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: result.output || 'Entschuldigung, ich konnte keine Antwort generieren.',
          sender: 'agent',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, agentMessage]);
      } else {
        throw new Error('Network response was not ok');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Entschuldigung, es gab einen Fehler. Bitte versuchen Sie es später erneut.',
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

  return (
    <>
      {/* Chat Toggle Button */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="lg"
          className="mystery-button rounded-full w-14 h-14 sm:w-16 sm:h-16 shadow-2xl hover:shadow-mystery transition-all duration-300"
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        </Button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed z-40 left-4 right-4 bottom-[88px] sm:left-auto sm:right-6 sm:bottom-24 w-auto sm:w-96 max-w-full h-[65vh] sm:h-[500px] max-h-[80vh] glass-effect backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {/* Chat Header */}
          <div className="p-3 sm:p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold text-sm sm:text-base">{process.env.NEXT_PUBLIC_LANDING_AGENT_NAME || 'Business Assistant'}</h3>
                <p className="text-[11px] sm:text-xs text-muted-foreground">Rising BSM V2 Support</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 overscroll-contain">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    {message.sender === 'user' ? (
                      <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    ) : (
                      <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    )}
                  </div>
                  <div
                    className={`p-3 rounded-lg text-sm ${
                      message.sender === 'user'
                        ? 'bg-purple-500 text-white'
                        : 'bg-white/10 border border-white/10'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-[13px] sm:text-sm leading-relaxed">{message.text}</p>
                    <p className="text-[10px] sm:text-xs opacity-60 mt-1">
                      {message.timestamp.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[80%]">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="bg-white/10 border border-white/10 p-2.5 sm:p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 sm:p-4 border-t border-white/10 bg-black/10">
            <div className="flex gap-2 items-end">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ihre Nachricht..."
                disabled={isLoading}
                className="flex-1 bg-white/5 border-white/10 text-[13px] sm:text-sm"
              />
              <Button
                onClick={() => sendMessage()}
                disabled={!inputValue.trim() || isLoading}
                size="sm"
                className="mystery-button"
              >
                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
