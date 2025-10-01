'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageCircle,
  Send,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  FileText,
  CheckSquare
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface ChatMessage {
  id: string;
  message: string;
  created_at: string;
  is_from_customer: boolean;
  sender_id: string;
  channel_id?: string;
  user_profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface ChatChannel {
  id: string;
  channel_type: 'permanent' | 'request' | 'task';
  channel_status: 'active' | 'closed';
  employee_id: string;
  source_type?: string;
  source_id?: string;
  created_at: string;
  user_profiles?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Customer {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  assigned_employee_id: string | null;
  status: string;
  created_at: string;
  user_profiles?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface CustomerChatViewProps {
  customer: Customer;
  chatMessages: ChatMessage[];
  availableEmployees: Employee[];
  currentUser: SupabaseUser;
}

export function CustomerChatView({
  customer,
  chatMessages: initialMessages,
  availableEmployees,
  currentUser
}: CustomerChatViewProps) {
  const supabase = createClient();
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChannel = channels.find(ch => ch.id === activeChannelId);

  // Fetch channels for customer
  useEffect(() => {
    const fetchChannels = async () => {
      setChannelsLoading(true);
      try {
        const { data: channelData, error } = await supabase
          .from('chat_channels')
          .select(`
            id,
            channel_type,
            channel_status,
            employee_id,
            source_type,
            source_id,
            created_at
          `)
          .eq('customer_id', customer.id)
          .eq('channel_status', 'active')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('PortalChat[channels]: Error fetching channels:', error);
          setChannelsLoading(false);
          return;
        }

        console.log('PortalChat[channels]: Found', channelData?.length || 0, 'channels');

        // Fetch employee profiles for all channels
        if (channelData && channelData.length > 0) {
          const employeeIds = [...new Set(channelData.map(ch => ch.employee_id))];
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id, first_name, last_name, email')
            .in('id', employeeIds);

          const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
          channelData.forEach((ch: any) => {
            ch.user_profiles = profileMap.get(ch.employee_id) || null;
          });
        }

        setChannels(channelData || []);

        // Auto-select first channel or permanent channel
        if (channelData && channelData.length > 0) {
          const permanentChannel = channelData.find(ch => ch.channel_type === 'permanent');
          const selectedId = permanentChannel?.id || channelData[0].id;
          console.log('PortalChat[channels]: Auto-selecting channel', selectedId, 'type:', permanentChannel ? 'permanent' : channelData[0].channel_type);
          setActiveChannelId(selectedId);
        } else {
          console.log('PortalChat[channels]: No active channels found for customer');
        }
      } catch (error) {
        console.error('PortalChat[channels]: Error in fetchChannels:', error);
      } finally {
        setChannelsLoading(false);
      }
    };

    fetchChannels();
  }, [customer.id, supabase]);

  // Fetch messages for active channel
  useEffect(() => {
    if (!activeChannelId) return;

    const fetchMessages = async () => {
      const { data: msgs, error } = await supabase
        .from('customer_chat_messages')
        .select('id, message, created_at, is_from_customer, sender_id, channel_id')
        .eq('channel_id', activeChannelId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      // Fetch sender profiles
      if (msgs && msgs.length > 0) {
        const senderIds = [...new Set(msgs.map(m => m.sender_id))];
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, first_name, last_name')
          .in('id', senderIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        msgs.forEach((msg: any) => {
          msg.user_profiles = profileMap.get(msg.sender_id) || null;
        });
      }

      setMessages(msgs || []);
    };

    fetchMessages();
  }, [activeChannelId, supabase]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set up real-time subscription for chat messages
  useEffect(() => {
    if (!activeChannelId) return;

    console.log('PortalChat[realtime]: Setting up subscription for channel', activeChannelId);

    const channel = supabase
      .channel(`chat_channel:${activeChannelId}`, {
        config: {
          broadcast: { self: true },
          presence: { key: currentUser.id }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'customer_chat_messages',
          filter: `channel_id=eq.${activeChannelId}`
        },
        async (payload) => {
          console.log('PortalChat[realtime]: INSERT event received', {
            id: (payload?.new as any)?.id,
            customerId: customer.id,
            payload: payload.new
          });

          // Fetch the complete message
          const { data: newMessage, error: msgError } = await supabase
            .from('customer_chat_messages')
            .select('id, message, created_at, is_from_customer, sender_id')
            .eq('id', payload.new.id)
            .single();

          if (msgError) {
            console.error('PortalChat[realtime]: Error fetching message:', msgError);
            return;
          }

          // Fetch sender profile
          if (newMessage) {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('first_name, last_name')
              .eq('id', newMessage.sender_id)
              .maybeSingle();
            (newMessage as any).user_profiles = profile;
          }

          if (newMessage) {
            console.log('PortalChat[realtime]: Adding message to UI', newMessage.id);
            setMessages(prev => [...prev, newMessage]);
          }
        }
      )
      .subscribe((status, err) => {
        console.log('PortalChat[realtime]: Subscription status changed:', status, err ? `Error: ${err}` : '');
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChannelId, customer.id, currentUser.id, supabase]);

  const sendMessage = async () => {
    if (!newMessage.trim() || loading || !activeChannelId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('customer_chat_messages')
        .insert({
          customer_id: customer.id,
          channel_id: activeChannelId,
          message: newMessage.trim(),
          is_from_customer: true,
          sender_id: currentUser.id
        });

      if (error) throw error;
      console.log('PortalChat[send]: inserted message for customer=', customer.id);

      setNewMessage('');

      // Fire notification to assigned employee (server will route)
      try {
        const res = await fetch('/api/notifications/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId: customer.id, isFromCustomer: true })
        });
        console.log('PortalChat[notify]: POST /api/notifications/chat status=', res.status);
      } catch (_) {}
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    });
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'U';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const assignedEmployee = customer.user_profiles;
  const hasAssignedEmployee = !!customer.assigned_employee_id;

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'permanent': return <User className="w-4 h-4" />;
      case 'request': return <FileText className="w-4 h-4" />;
      case 'task': return <CheckSquare className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getChannelLabel = (channel: ChatChannel) => {
    if (channel.channel_type === 'permanent') {
      return 'Hauptkanal';
    }
    return `${channel.source_type === 'contact_request' ? 'Anfrage' : 'Aufgabe'}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Chat & Support</h1>
            <p className="text-slate-400">
              {channels.length > 0
                ? `${channels.length} aktive Kommunikationskanäle`
                : 'Direkter Kontakt zu Ihrem zugewiesenen Mitarbeiter'
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
              {isConnected ? '🟢 Online' : '🔴 Offline'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Area */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-900/60 border-slate-800 h-[600px] flex flex-col">
              <CardHeader className="border-b border-slate-800">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Chat-Verlauf
                  {activeChannel && (
                    <Badge variant="outline" className="ml-auto">
                      {getChannelIcon(activeChannel.channel_type)}
                      <span className="ml-1">{getChannelLabel(activeChannel)}</span>
                    </Badge>
                  )}
                </CardTitle>
                {channels.length > 1 && (
                  <Tabs value={activeChannelId || ''} onValueChange={setActiveChannelId} className="mt-2">
                    <TabsList className="bg-slate-800">
                      {channels.map(channel => (
                        <TabsTrigger
                          key={channel.id}
                          value={channel.id}
                          className="flex items-center gap-2"
                        >
                          {getChannelIcon(channel.channel_type)}
                          <span>{getChannelLabel(channel)}</span>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                )}
              </CardHeader>

              {/* Messages Area */}
              <CardContent className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                      <p className="text-slate-400">
                        Noch keine Nachrichten. Starten Sie eine Unterhaltung!
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.is_from_customer ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {!message.is_from_customer && (
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-blue-600 text-white text-xs">
                              {getInitials(
                                message.user_profiles?.first_name,
                                message.user_profiles?.last_name
                              )}
                            </AvatarFallback>
                          </Avatar>
                        )}

                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.is_from_customer
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-800 text-slate-100'
                          }`}
                        >
                          {!message.is_from_customer && (
                            <p className="text-xs text-slate-400 mb-1">
                              {message.user_profiles?.first_name} {message.user_profiles?.last_name}
                            </p>
                          )}
                          <p className="text-sm">{message.message}</p>
                          <p className="text-xs text-slate-300 mt-1">
                            {formatMessageTime(message.created_at)}
                          </p>
                        </div>

                        {message.is_from_customer && (
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-green-600 text-white text-xs">
                              {getInitials(customer.contact_person?.split(' ')[0], customer.contact_person?.split(' ')[1])}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </CardContent>

              {/* Message Input */}
              <div className="border-t border-slate-800 p-4">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={
                      !activeChannelId
                        ? 'Kein aktiver Kanal...'
                        : !hasAssignedEmployee
                        ? 'Noch kein Mitarbeiter zugewiesen...'
                        : 'Nachricht eingeben...'
                    }
                    className="bg-slate-800 border-slate-700 text-white"
                    disabled={loading || !activeChannelId || !hasAssignedEmployee}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={loading || !newMessage.trim() || !activeChannelId || !hasAssignedEmployee}
                    className="bg-blue-600 hover:bg-blue-500"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                {!hasAssignedEmployee && (
                  <p className="text-xs text-yellow-400 mt-2">
                    Noch kein Mitarbeiter zugewiesen. Sie werden benachrichtigt, sobald jemand verfügbar ist.
                  </p>
                )}
                {!activeChannelId && channels.length === 0 && (
                  <p className="text-xs text-slate-400 mt-2">
                    Warten auf Kanalzuweisung...
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar - Employee Info */}
          <div className="space-y-6">
            {/* Assigned Employee */}
            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Ihr Ansprechpartner
                </CardTitle>
              </CardHeader>
              <CardContent>
                {assignedEmployee ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-blue-600 text-white">
                          {getInitials(assignedEmployee.first_name, assignedEmployee.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-white">
                          {assignedEmployee.first_name} {assignedEmployee.last_name}
                        </p>
                        {assignedEmployee.email && (
                          <p className="text-sm text-slate-400">
                            {assignedEmployee.email}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-slate-300">Zugewiesen</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-slate-300">Verfügbar für Chat</span>
                      </div>
                    </div>
                  </div>
                ) : hasAssignedEmployee ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-slate-300">Zugewiesen</span>
                    </div>
                    <div className="text-sm text-slate-400">
                      Ansprechpartner-Details sind derzeit nicht verfügbar.
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <AlertCircle className="w-12 h-12 mx-auto text-yellow-400 mb-3" />
                    <p className="text-sm text-slate-400 mb-2">
                      Noch kein Mitarbeiter zugewiesen
                    </p>
                    <p className="text-xs text-slate-500">
                      Sie werden benachrichtigt, sobald ein Mitarbeiter verfügbar ist.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer Info */}
            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Ihre Informationen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-slate-400">Unternehmen</p>
                  <p className="text-white">{customer.company_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Ansprechpartner</p>
                  <p className="text-white">{customer.contact_person}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">E-Mail</p>
                  <p className="text-white">{customer.email}</p>
                </div>
                {customer.phone && (
                  <div>
                    <p className="text-sm text-slate-400">Telefon</p>
                    <p className="text-white">{customer.phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-slate-400">Status</p>
                  <Badge variant="secondary" className="bg-green-500/10 text-green-400">
                    {customer.status === 'active' ? 'Aktiv' : customer.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader>
                <CardTitle>Schnellaktionen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="/portal/requests">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Neue Anfrage erstellen
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="/portal/profile">
                    <User className="w-4 h-4 mr-2" />
                    Profil bearbeiten
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
