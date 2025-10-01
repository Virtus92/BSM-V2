'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageCircle,
  Users,
  User,
  FileText,
  CheckSquare,
  Search,
  Building,
  TrendingUp,
  Clock,
  Eye
} from 'lucide-react';

interface ChatChannel {
  id: string;
  channel_type: 'permanent' | 'request' | 'task';
  channel_status: 'active' | 'closed';
  created_at: string;
  closed_at: string | null;
  customers: {
    id: string;
    company_name: string;
    contact_person: string;
    email: string;
  };
  user_profiles: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  message_count?: number;
  last_message_at?: string;
}

interface AdminChatDashboardProps {
  channels: ChatChannel[];
  stats: {
    total: number;
    permanent: number;
    request: number;
    task: number;
    active: number;
    closed: number;
  };
}

export function AdminChatDashboard({ channels: initialChannels, stats }: AdminChatDashboardProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'permanent' | 'request' | 'task'>('all');

  const filteredChannels = initialChannels.filter(channel => {
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch = !searchTerm || (
      (channel.customers?.company_name?.toLowerCase().includes(searchLower)) ||
      (channel.customers?.contact_person?.toLowerCase().includes(searchLower)) ||
      (channel.user_profiles?.first_name?.toLowerCase().includes(searchLower)) ||
      (channel.user_profiles?.last_name?.toLowerCase().includes(searchLower))
    );

    const matchesType = filterType === 'all' || channel.channel_type === filterType;

    return matchesSearch && matchesType;
  });

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'permanent': return <User className="w-4 h-4" />;
      case 'request': return <FileText className="w-4 h-4" />;
      case 'task': return <CheckSquare className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getChannelLabel = (type: string) => {
    switch (type) {
      case 'permanent': return 'Hauptkanal';
      case 'request': return 'Anfrage';
      case 'task': return 'Aufgabe';
      default: return type;
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'U';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const viewChat = (customerId: string) => {
    router.push(`/workspace/customers/chat/${customerId}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Chat-Übersicht</h1>
        <p className="text-muted-foreground">
          Alle aktiven Kommunikationskanäle im System
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamt Channels</CardTitle>
            <MessageCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} aktiv, {stats.closed} geschlossen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hauptkanäle</CardTitle>
            <User className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.permanent}</div>
            <p className="text-xs text-muted-foreground">
              Permanente Zuweisungen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anfragen</CardTitle>
            <FileText className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.request}</div>
            <p className="text-xs text-muted-foreground">
              Request-basierte Channels
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aufgaben</CardTitle>
            <CheckSquare className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">{stats.task}</div>
            <p className="text-xs text-muted-foreground">
              Task-basierte Channels
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Suche & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Nach Kunde, Unternehmen oder Mitarbeiter suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Tabs value={filterType} onValueChange={(v) => setFilterType(v as any)} className="w-full md:w-auto">
              <TabsList>
                <TabsTrigger value="all">Alle</TabsTrigger>
                <TabsTrigger value="permanent">Hauptkanäle</TabsTrigger>
                <TabsTrigger value="request">Anfragen</TabsTrigger>
                <TabsTrigger value="task">Aufgaben</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Channels List */}
      <Card>
        <CardHeader>
          <CardTitle>Aktive Channels ({filteredChannels.length})</CardTitle>
          <CardDescription>
            Alle Kommunikationskanäle zwischen Kunden und Mitarbeitern
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredChannels.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Keine Channels gefunden</h3>
              <p className="text-muted-foreground">
                Keine Channels entsprechen den aktuellen Filterkriterien.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredChannels.map((channel) => (
                <div
                  key={channel.id}
                  className="border rounded-lg p-4 hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
                    <div className="flex-1 space-y-3 w-full lg:w-auto">
                      {/* Channel Type & Status */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getChannelIcon(channel.channel_type)}
                          {getChannelLabel(channel.channel_type)}
                        </Badge>
                        <Badge
                          variant={channel.channel_status === 'active' ? 'default' : 'secondary'}
                        >
                          {channel.channel_status === 'active' ? 'Aktiv' : 'Geschlossen'}
                        </Badge>
                      </div>

                      {/* Customer Info */}
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 flex-shrink-0">
                          <AvatarFallback className="bg-blue-600 text-white">
                            {channel.customers
                              ? getInitials(
                                  channel.customers.contact_person?.split(' ')[0],
                                  channel.customers.contact_person?.split(' ')[1]
                                )
                              : 'K'
                            }
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium truncate">
                              {channel.customers?.company_name || 'Kunde nicht gefunden'}
                            </span>
                          </div>
                          {channel.customers && (
                            <div className="text-sm text-muted-foreground truncate">
                              {channel.customers.contact_person} • {channel.customers.email}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Employee Info */}
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarFallback className="bg-green-600 text-white text-xs">
                            {channel.user_profiles
                              ? getInitials(
                                  channel.user_profiles.first_name,
                                  channel.user_profiles.last_name
                                )
                              : 'MA'
                            }
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">
                            {channel.user_profiles
                              ? `${channel.user_profiles.first_name} ${channel.user_profiles.last_name}`
                              : 'Mitarbeiter nicht gefunden'
                            }
                          </div>
                          {channel.user_profiles && (
                            <div className="text-xs text-muted-foreground truncate">
                              {channel.user_profiles.email}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span className="hidden sm:inline">Erstellt: </span>{formatDate(channel.created_at)}
                        </div>
                        {channel.message_count !== undefined && (
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            {channel.message_count} Nachrichten
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="lg:ml-4 w-full lg:w-auto">
                      {channel.customers && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewChat(channel.customers.id)}
                          className="w-full lg:w-auto"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Chat öffnen
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
