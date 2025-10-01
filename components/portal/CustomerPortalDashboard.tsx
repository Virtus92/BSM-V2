'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  MessageSquare,
  MessageCircle,
  Clock,
  CheckCircle,
  FileText,
  Calendar,
  Plus,
  User,
  AlertCircle,
  Send,
  Eye,
  TrendingUp
} from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface ChatMessage {
  id: string;
  message: string;
  created_at: string;
  is_from_customer: boolean;
  sender_id: string;
  user_profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface Request {
  id: string;
  created_at: string;
  status: string;
  subject: string;
  message?: string;
  priority?: string;
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

interface RequestStats {
  total: number;
  new: number;
  in_progress: number;
  completed: number;
}

interface CustomerPortalDashboardProps {
  customer: Customer;
  requests: Request[];
  requestStats: RequestStats;
  recentMessages: ChatMessage[];
  currentUser: SupabaseUser;
}

export function CustomerPortalDashboard({
  customer,
  requests,
  requestStats,
  recentMessages,
  currentUser
}: CustomerPortalDashboardProps) {
  const [newRequestForm, setNewRequestForm] = useState({
    subject: '',
    message: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const assignedEmployee = customer.user_profiles;

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequestForm.subject.trim() || !newRequestForm.message.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validierungsfehler',
        description: 'Bitte füllen Sie alle Felder aus.'
      });
      return;
    }

    setSubmitLoading(true);
    try {
      const response = await fetch('/api/portal/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newRequestForm)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Anfrage konnte nicht erstellt werden');
      }

      setNewRequestForm({ subject: '', message: '' });
      toast({
        title: 'Anfrage erstellt',
        description: 'Ihre Anfrage wurde erfolgreich übermittelt.'
      });

      // Refresh server data without full page reload
      router.refresh();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten'
      });
    } finally {
      setSubmitLoading(false);
    }
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

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'U';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Willkommen, {customer.contact_person || customer.company_name}!
            </h1>
            <p className="text-slate-400">
              Ihr persönliches Kundenportal für Anfragen und Support
            </p>
          </div>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <Badge variant="secondary" className="bg-green-500/10 text-green-500">
              Kunde seit {new Date(customer.created_at).toLocaleDateString('de-DE')}
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Gesamt Anfragen
              </CardTitle>
              <MessageSquare className="w-4 h-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{requestStats.total}</div>
              <p className="text-xs text-slate-400">Alle Ihre Anfragen</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Offen
              </CardTitle>
              <Clock className="w-4 h-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{requestStats.new + requestStats.in_progress}</div>
              <p className="text-xs text-slate-400">Werden bearbeitet</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Erledigt
              </CardTitle>
              <CheckCircle className="w-4 h-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{requestStats.completed}</div>
              <p className="text-xs text-slate-400">Abgeschlossen</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Chat Nachrichten
              </CardTitle>
              <MessageCircle className="w-4 h-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-400">{recentMessages.length}</div>
              <p className="text-xs text-slate-400">Letzte Nachrichten</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* New Request Form */}
            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Neue Anfrage erstellen
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Beschreiben Sie Ihr Anliegen und wir helfen Ihnen gerne weiter
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitRequest} className="space-y-4">
                  <div>
                    <Label htmlFor="subject" className="text-slate-300">Betreff</Label>
                    <Input
                      id="subject"
                      value={newRequestForm.subject}
                      onChange={(e) => setNewRequestForm(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Kurzbeschreibung Ihres Anliegens"
                      className="bg-slate-800 border-slate-700 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="message" className="text-slate-300">Nachricht</Label>
                    <Textarea
                      id="message"
                      value={newRequestForm.message}
                      onChange={(e) => setNewRequestForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Beschreiben Sie Ihr Anliegen ausführlich..."
                      className="bg-slate-800 border-slate-700 text-white min-h-[120px]"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={submitLoading || !newRequestForm.subject.trim() || !newRequestForm.message.trim()}
                    className="bg-blue-600 hover:bg-blue-500"
                  >
                    {submitLoading ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Wird gesendet...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Anfrage senden
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Recent Requests */}
            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Ihre letzten Anfragen
                  </CardTitle>
                  <Link href="/portal/requests">
                    <Button variant="outline" size="sm">
                      Alle anzeigen
                    </Button>
                  </Link>
                </div>
                <CardDescription className="text-slate-400">
                  Übersicht über Ihre neuesten Kontaktanfragen
                </CardDescription>
              </CardHeader>
              <CardContent>
                {requests.length > 0 ? (
                  <div className="space-y-3">
                    {requests.slice(0, 5).map((request) => (
                      <div key={request.id} className="border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium text-white truncate">
                                {request.subject}
                              </h3>
                              <Badge variant="secondary" className={getStatusColor(request.status)}>
                                {getStatusText(request.status)}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-400 mb-2 line-clamp-2">
                              {request.message}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <Calendar className="w-3 h-3" />
                              {new Date(request.created_at).toLocaleDateString('de-DE')}
                            </div>
                          </div>
                          <Link href={`/portal/requests/${request.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                    <p className="text-slate-400">
                      Noch keine Anfragen erstellt
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
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
                        <p className="text-sm text-slate-400">
                          {assignedEmployee.email}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-slate-300">Zugewiesen</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-slate-300">Chat verfügbar</span>
                      </div>
                    </div>

                    <Link href="/portal/chat">
                      <Button className="w-full bg-blue-600 hover:bg-blue-500">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Chat starten
                      </Button>
                    </Link>
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

            {/* Recent Chat Messages */}
            {recentMessages.length > 0 && (
              <Card className="bg-slate-900/60 border-slate-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="w-5 h-5" />
                      Letzte Nachrichten
                    </CardTitle>
                    <Link href="/portal/chat">
                      <Button variant="outline" size="sm">
                        Chat öffnen
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentMessages.slice(0, 3).map((message) => (
                      <div key={message.id} className="border border-slate-700 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className={`${message.is_from_customer ? 'bg-green-600' : 'bg-blue-600'} text-white text-xs`}>
                              {message.is_from_customer ? 'S' : getInitials(
                                message.user_profiles?.first_name,
                                message.user_profiles?.last_name
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white line-clamp-2">
                              {message.message}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {formatMessageTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Schnellaktionen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/portal/requests">
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Alle Anfragen anzeigen
                  </Button>
                </Link>
                <Link href="/portal/chat">
                  <Button variant="outline" className="w-full justify-start">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat & Support
                  </Button>
                </Link>
                <Link href="/portal/profile">
                  <Button variant="outline" className="w-full justify-start">
                    <User className="w-4 h-4 mr-2" />
                    Profil bearbeiten
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}