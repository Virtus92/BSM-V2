'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageCircle,
  Send,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Building,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
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
  customer_id: string;
  source_type?: string;
  source_id?: string;
  created_at: string;
}

interface CustomerRequest {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  message: string;
}

interface Customer {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  status: string;
  assigned_employee_id: string | null;
  created_at: string;
  user_profiles?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface UserProfile {
  user_type: string;
  first_name: string;
  last_name: string;
}

interface EmployeeCustomerChatProps {
  customer: Customer;
  chatMessages: ChatMessage[];
  customerRequests: CustomerRequest[];
  currentUser: SupabaseUser;
  userProfile: UserProfile;
}

export function EmployeeCustomerChatMultiChannel({
  customer,
  chatMessages: initialMessages,
  customerRequests,
  currentUser,
  userProfile
}: EmployeeCustomerChatProps) {
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
          .select('id, channel_type, channel_status, customer_id, source_type, source_id, created_at')
          .eq('customer_id', customer.id)
          .eq('employee_id', currentUser.id)
          .eq('channel_status', 'active')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching channels:', error);
          return;
        }

        setChannels(channelData || []);

        // Auto-select first channel or permanent channel
        if (channelData && channelData.length > 0) {
          const permanentChannel = channelData.find(ch => ch.channel_type === 'permanent');
          setActiveChannelId(permanentChannel?.id || channelData[0].id);
        }
      } catch (error) {
        console.error('Error in fetchChannels:', error);
      } finally {
        setChannelsLoading(false);
      }
    };

    fetchChannels();
  }, [customer.id, currentUser.id, supabase]);

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

    const channel = supabase
      .channel(`employee_chat_channel:${activeChannelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'customer_chat_messages',
          filter: `channel_id=eq.${activeChannelId}`
        },
        async (payload) => {
          console.log('WorkspaceChat[realtime]: INSERT on customer_chat_messages id=', (payload?.new as any)?.id);
          // Fetch the complete message
          const { data: newMessage } = await supabase
            .from('customer_chat_messages')
            .select('id, message, created_at, is_from_customer, sender_id, channel_id')
            .eq('id', payload.new.id)
            .single();

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
            console.log('WorkspaceChat[realtime]: fetched new message for UI id=', newMessage.id);
            setMessages(prev => [...prev, newMessage]);
          }
        }
      )
      .subscribe((status) => {
        console.log('WorkspaceChat[realtime]: subscription status=', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChannelId, currentUser.id, supabase]);

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
          is_from_customer: false,
          sender_id: currentUser.id
        });

      if (error) throw error;
      console.log('WorkspaceChat[send]: inserted message for customer=', customer.id, 'channel=', activeChannelId);

      setNewMessage('');
      try {
        const res = await fetch('/api/notifications/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId: customer.id, isFromCustomer: false })
        });
        console.log('WorkspaceChat[notify]: POST /api/notifications/chat status=', res.status);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'in_progress': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'closed': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new': return 'Neu';
      case 'in_progress': return 'In Bearbeitung';
      case 'completed': return 'Erledigt';
      case 'closed': return 'Geschlossen';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'low': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

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

  const assignedEmployee = customer.user_profiles;

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <Link href="/workspace/customers/chat">
          <Button variant="ghost" size="sm" className="w-full sm:w-auto">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl md:text-3xl font-bold tracking-tight">
            Chat mit {customer.company_name}
          </h1>
          <p className="text-sm text-muted-foreground hidden sm:block">
            {channels.length > 0
              ? `${channels.length} aktive Kommunikationskanäle`
              : 'Direkte Kommunikation mit Ihrem Kunden'
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
            {isConnected ? '🟢 Online' : '🔴 Offline'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Chat Area */}
        <div className="lg:col-span-2 order-1 lg:order-none">
          <Card className="h-[500px] md:h-[600px] flex flex-col">
            <CardHeader className="border-b p-3 md:p-6">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
                  Chat-Verlauf
                  {activeChannel && (
                    <Badge variant="outline" className="ml-auto">
                      {getChannelIcon(activeChannel.channel_type)}
                      <span className="ml-1">{getChannelLabel(activeChannel)}</span>
                    </Badge>
                  )}
                </CardTitle>
              </div>
              {channels.length > 1 && (
                <Tabs value={activeChannelId || ''} onValueChange={setActiveChannelId} className="mt-2">
                  <TabsList className="bg-slate-100">
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
              <CardDescription className="text-xs md:text-sm">
                Echtzeit-Kommunikation mit {customer.contact_person}
              </CardDescription>
            </CardHeader>

            {/* Messages Area */}
            <CardContent className="flex-1 p-2 md:p-4 overflow-y-auto">
              <div className="space-y-3 md:space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 md:w-16 md:h-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm md:text-base text-muted-foreground">
                      Noch keine Nachrichten. Starten Sie eine Unterhaltung!
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-2 md:gap-3 ${
                        message.is_from_customer ? 'justify-start' : 'justify-end'
                      }`}
                    >
                      {message.is_from_customer && (
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-green-600 text-white text-xs">
                            {getInitials(customer.contact_person?.split(' ')[0], customer.contact_person?.split(' ')[1])}
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div
                        className={`max-w-[75%] sm:max-w-xs lg:max-w-md px-3 md:px-4 py-2 rounded-lg ${
                          message.is_from_customer
                            ? 'bg-slate-100 text-slate-900'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {message.is_from_customer && (
                          <p className="text-xs text-slate-600 mb-1">
                            {customer.contact_person}
                          </p>
                        )}
                        <p className="text-sm break-words">{message.message}</p>
                        <p className={`text-xs mt-1 ${message.is_from_customer ? 'text-slate-500' : 'text-blue-100'}`}>
                          {formatMessageTime(message.created_at)}
                        </p>
                      </div>

                      {!message.is_from_customer && (
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-blue-600 text-white text-xs">
                            {getInitials(
                              message.user_profiles?.first_name || userProfile.first_name,
                              message.user_profiles?.last_name || userProfile.last_name
                            )}
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
            <div className="border-t p-2 md:p-4">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={!activeChannelId ? 'Kein aktiver Kanal...' : 'Nachricht...'}
                  disabled={loading || !activeChannelId}
                  className="text-sm md:text-base"
                />
                <Button
                  onClick={sendMessage}
                  disabled={loading || !newMessage.trim() || !activeChannelId}
                  size="sm"
                  className="md:size-default"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              {!activeChannelId && channels.length === 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Kein aktiver Chat-Kanal für diesen Kunden
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 md:space-y-6 order-2 lg:order-none">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Kundeninformationen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-green-600 text-white">
                    {getInitials(customer.contact_person?.split(' ')[0], customer.contact_person?.split(' ')[1])}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{customer.company_name}</p>
                  <p className="text-sm text-muted-foreground">{customer.contact_person}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{customer.email}</span>
                </div>
                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Kunde seit {new Date(customer.created_at).toLocaleDateString('de-DE')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <Badge variant="secondary" className="text-xs">
                    {customer.status === 'active' ? 'Aktiv' : customer.status}
                  </Badge>
                </div>
              </div>

              {/* Assigned Employee */}
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Zugewiesener Mitarbeiter:</p>
                {assignedEmployee ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="bg-blue-600 text-white text-xs">
                        {getInitials(assignedEmployee.first_name, assignedEmployee.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">
                      {assignedEmployee.first_name} {assignedEmployee.last_name}
                    </span>
                  </div>
                ) : (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    Nicht zugewiesen
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Active Channels */}
          {channels.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Aktive Kanäle ({channels.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {channels.map(channel => (
                  <div
                    key={channel.id}
                    className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-colors ${
                      channel.id === activeChannelId
                        ? 'bg-blue-50 border-blue-200'
                        : 'hover:bg-slate-50'
                    }`}
                    onClick={() => setActiveChannelId(channel.id)}
                  >
                    <div className="flex items-center gap-2">
                      {getChannelIcon(channel.channel_type)}
                      <span className="text-sm font-medium">{getChannelLabel(channel)}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {channel.channel_status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recent Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Letzte Anfragen
              </CardTitle>
              <CardDescription>
                Aktuelle Kontaktanfragen des Kunden
              </CardDescription>
            </CardHeader>
            <CardContent>
              {customerRequests.length > 0 ? (
                <div className="space-y-3">
                  {customerRequests.slice(0, 3).map((request) => (
                    <div key={request.id} className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-sm truncate">
                          {request.subject}
                        </h4>
                        <Badge variant="secondary" className={getStatusColor(request.status)}>
                          {getStatusText(request.status)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {request.message}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{new Date(request.created_at).toLocaleDateString('de-DE')}</span>
                        <Badge variant="secondary" className={getPriorityColor(request.priority)}>
                          {request.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  <Link href={`/workspace/requests?customer=${customer.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      Alle Anfragen anzeigen
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-6">
                  <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Keine Anfragen vorhanden
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Schnellaktionen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/workspace/customers/${customer.id}`}>
                <Button variant="outline" className="w-full justify-start">
                  <User className="w-4 h-4 mr-2" />
                  Kundenprofil anzeigen
                </Button>
              </Link>
              <Link href={`/dashboard/requests/create?customer=${customer.id}`}>
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Anfrage für Kunde erstellen
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
