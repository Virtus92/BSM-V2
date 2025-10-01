import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

function getStatusColor(status: string) {
  switch (status) {
    case 'new': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'in_progress': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'closed': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  }
}

export default async function CustomerRequestDetail({ params }: { params: Promise<{ id: string }>}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login');
  }

  // Ensure customer role (RLS will still enforce ownership)
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('user_type')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/auth/login');
  if (profile.user_type !== 'customer') redirect('/portal');

  // Load the request (RLS limits to created_by = auth.uid())
  const { data: request } = await supabase
    .from('contact_requests')
    .select('id, created_at, updated_at, status, subject, message, priority, name, email, company, phone')
    .eq('id', id)
    .maybeSingle();

  if (!request) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/portal/requests">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Zurück zu Anfragen
            </Button>
          </Link>
        </div>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="text-xl text-white">
                {request.subject || 'Ohne Betreff'}
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className={getStatusColor(request.status || 'new')}>
                  {request.status || 'new'}
                </Badge>
                {request.priority && (
                  <Badge variant="secondary">
                    Priorität: {request.priority}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-slate-400">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Erstellt: {new Date(request.created_at).toLocaleString('de-DE')}
              </div>
              {request.updated_at && request.updated_at !== request.created_at && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Aktualisiert: {new Date(request.updated_at).toLocaleString('de-DE')}
                </div>
              )}
            </div>

            {request.message && (
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-2">Nachricht</h3>
                <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {request.message}
                </p>
              </div>
            )}

            {(request.company || request.email || request.phone) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {request.company && (
                  <div>
                    <span className="block text-xs text-slate-400">Firma</span>
                    <span className="text-sm text-white">{request.company}</span>
                  </div>
                )}
                {request.email && (
                  <div>
                    <span className="block text-xs text-slate-400">E-Mail</span>
                    <span className="text-sm text-white break-all">{request.email}</span>
                  </div>
                )}
                {request.phone && (
                  <div>
                    <span className="block text-xs text-slate-400">Telefon</span>
                    <span className="text-sm text-white">{request.phone}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
