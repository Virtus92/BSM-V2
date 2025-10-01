'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  MessageSquare,
  Clock,
  TrendingUp,
  FileText,
  Calendar,
  Star,
  MessageCircle
} from 'lucide-react';
import Link from 'next/link';

interface EmployeeWorkspaceViewProps {
  profile: {
    user_type: string;
    first_name?: string;
    last_name?: string;
  };
  data: {
    totalCustomers: number;
    totalRequests: number;
    pendingRequests: number;
    completedRequests: number;
    myTasks: number;
    recentRequests: Array<{
      id: string;
      name: string;
      subject: string;
      status: string;
      created_at: string;
      company?: string;
      email?: string;
    }>;
  };
}

export function EmployeeWorkspaceView({ profile, data }: EmployeeWorkspaceViewProps) {
  const stats = [
    {
      title: 'Kunden',
      description: 'Verfügbare Kunden',
      count: data.totalCustomers,
      subtitle: 'Zugeordnet + Verfügbar',
      icon: Users,
      href: '/workspace/crm',
      color: 'blue'
    },
    {
      title: 'Anfragen',
      description: 'Kontaktanfragen',
      count: data.totalRequests,
      subtitle: `${data.pendingRequests} offen, ${data.completedRequests} erledigt`,
      icon: MessageSquare,
      href: '/workspace/requests',
      color: 'green'
    },
    {
      title: 'Meine Aufgaben',
      description: 'Zu bearbeiten',
      count: data.myTasks,
      subtitle: 'Aktiv',
      icon: Clock,
      href: '/workspace/tasks',
      color: data.myTasks > 0 ? 'orange' : 'green'
    },
    {
      title: 'Erledigt',
      description: 'Abgeschlossen',
      count: data.completedRequests,
      subtitle: 'Gesamt',
      icon: FileText,
      href: '/workspace/requests?status=responded',
      color: 'purple'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'in_progress': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'completed':
      case 'responded': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'Neu';
      case 'in_progress': return 'In Bearbeitung';
      case 'completed':
      case 'responded': return 'Erledigt';
      default: return status;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Willkommen, {profile.first_name || 'Mitarbeiter'}!
          </h1>
          <p className="text-muted-foreground">
            Übersicht über Ihre Aufgaben und Kunden
          </p>
        </div>
        <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
          <Star className="w-3 h-3 mr-1" />
          {profile.user_type === 'admin' ? 'Administrator' : 'Mitarbeiter'}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg bg-${stat.color}-500/10`}>
                  <Icon className={`w-4 h-4 text-${stat.color}-500`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.count}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.subtitle}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {stat.description}
                </p>
                <Link href={stat.href}>
                  <Button variant="outline" size="sm" className="w-full mt-3">
                    Anzeigen
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions and Recent Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Schnellaktionen
            </CardTitle>
            <CardDescription>
              Häufig verwendete Funktionen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/workspace/requests?status=new">
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="w-4 h-4 mr-2" />
                Neue Anfragen bearbeiten
              </Button>
            </Link>
            <Link href="/workspace/crm">
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Kunden verwalten
              </Button>
            </Link>
            <Link href="/workspace/customers/chat">
              <Button variant="outline" className="w-full justify-start">
                <MessageCircle className="w-4 h-4 mr-2" />
                Kunden-Chat
              </Button>
            </Link>
            <Link href="/workspace/automation">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                Workflows
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Aktuelle Anfragen
            </CardTitle>
            <CardDescription>
              Die neuesten Kontaktanfragen
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentRequests && data.recentRequests.length > 0 ? (
              <div className="space-y-3">
                {data.recentRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium truncate">{request.name}</p>
                        <Badge variant="secondary" className={getStatusColor(request.status)}>
                          {getStatusLabel(request.status)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {request.subject}
                      </p>
                      {request.company && (
                        <p className="text-xs text-muted-foreground">
                          {request.company}
                        </p>
                      )}
                    </div>
                    <Link href={`/workspace/requests/${request.id}`}>
                      <Button variant="ghost" size="sm">
                        Details
                      </Button>
                    </Link>
                  </div>
                ))}
                <Link href="/workspace/requests">
                  <Button variant="outline" className="w-full mt-3">
                    Alle Anfragen anzeigen
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  Keine aktuellen Anfragen
                </p>
                <Link href="/workspace/requests">
                  <Button variant="outline" className="mt-3">
                    Anfragen anzeigen
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Arbeitsübersicht</CardTitle>
          <CardDescription>
            Ihre Arbeitsleistung im Überblick
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-500/5 rounded-lg border border-green-500/20">
              <div className="text-3xl font-bold text-green-500">{data.completedRequests}</div>
              <p className="text-sm text-muted-foreground mt-1">Erledigte Anfragen</p>
            </div>
            <div className="text-center p-4 bg-blue-500/5 rounded-lg border border-blue-500/20">
              <div className="text-3xl font-bold text-blue-500">{data.myTasks}</div>
              <p className="text-sm text-muted-foreground mt-1">Offene Aufgaben</p>
            </div>
            <div className="text-center p-4 bg-purple-500/5 rounded-lg border border-purple-500/20">
              <div className="text-3xl font-bold text-purple-500">{data.totalCustomers}</div>
              <p className="text-sm text-muted-foreground mt-1">Kunden verfügbar</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
