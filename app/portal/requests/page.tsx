import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MessageSquare,
  Clock,
  CheckCircle,
  FileText,
  Calendar,
  Eye,
  Plus
} from 'lucide-react';
import Link from 'next/link';

export default async function CustomerRequests() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login');
  }

  // Check if user is customer
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('user_type')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/auth/login');
  }

  if (profile.user_type !== 'customer') {
    // Redirect non-customers to their appropriate area
    if (profile.user_type === 'employee') {
      redirect('/workspace');
    } else if (profile.user_type === 'admin') {
      redirect('/dashboard');
    } else {
      redirect('/auth/login');
    }
  }

  // Get customer's requests
  const admin = createAdminClient();
  const { data: requests } = await admin
    .from('contact_requests')
    .select(`
      id,
      created_at,
      updated_at,
      status,
      subject,
      message,
      priority,
      name,
      email,
      company,
      phone
    `)
    .eq('created_by', user.id)
    .order('created_at', { ascending: false });

  // Get request counts by status
  const requestCounts = {
    total: requests?.length || 0,
    new: requests?.filter(r => r.status === 'new').length || 0,
    in_progress: requests?.filter(r => r.status === 'in_progress').length || 0,
    completed: requests?.filter(r => r.status === 'completed').length || 0
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

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Hoch';
      case 'medium': return 'Mittel';
      case 'low': return 'Niedrig';
      default: return priority || 'Normal';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Meine Anfragen</h1>
            <p className="text-slate-400">
              Übersicht über alle Ihre Kontaktanfragen und deren Status
            </p>
          </div>
          <Link href="/portal">
            <Button className="bg-blue-600 hover:bg-blue-500">
              <Plus className="w-4 h-4 mr-2" />
              Neue Anfrage
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Gesamt
              </CardTitle>
              <MessageSquare className="w-4 h-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{requestCounts.total}</div>
              <p className="text-xs text-slate-400">Alle Anfragen</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Neu
              </CardTitle>
              <Clock className="w-4 h-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{requestCounts.new}</div>
              <p className="text-xs text-slate-400">Warten auf Bearbeitung</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                In Bearbeitung
              </CardTitle>
              <FileText className="w-4 h-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">{requestCounts.in_progress}</div>
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
              <div className="text-2xl font-bold text-green-400">{requestCounts.completed}</div>
              <p className="text-xs text-slate-400">Abgeschlossen</p>
            </CardContent>
          </Card>
        </div>

        {/* Requests List */}
        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Ihre Anfragen
            </CardTitle>
            <CardDescription className="text-slate-400">
              Chronologische Übersicht aller Ihrer Kontaktanfragen
            </CardDescription>
          </CardHeader>
          <CardContent>
            {requests && requests.length > 0 ? (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div key={request.id} className="border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-medium text-white truncate">
                            {request.subject || 'Ohne Betreff'}
                          </h3>
                          <Badge variant="secondary" className={getStatusColor(request.status || 'new')}>
                            {getStatusText(request.status || 'new')}
                          </Badge>
                          {request.priority && (
                            <Badge variant="secondary" className={getPriorityColor(request.priority)}>
                              {getPriorityText(request.priority)}
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-slate-400 mb-2 line-clamp-2">
                          {request.message}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Erstellt: {new Date(request.created_at).toLocaleDateString('de-DE')}
                          </div>
                          {request.updated_at !== request.created_at && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Aktualisiert: {new Date(request.updated_at).toLocaleDateString('de-DE')}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/portal/requests/${request.id}`}>
                            <Eye className="w-4 h-4 mr-1" />
                            Details
                          </Link>
                        </Button>
                      </div>
                    </div>

                    {/* Additional Info */}
                    {(request.company || request.phone) && (
                      <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-700">
                        {request.company && (
                          <span>Firma: {request.company}</span>
                        )}
                        {request.phone && (
                          <span>Tel: {request.phone}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  Noch keine Anfragen
                </h3>
                <p className="text-slate-400 mb-6">
                  Sie haben noch keine Kontaktanfragen erstellt.
                </p>
                <Link href="/portal">
                  <Button className="bg-blue-600 hover:bg-blue-500">
                    <Plus className="w-4 h-4 mr-2" />
                    Erste Anfrage erstellen
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}