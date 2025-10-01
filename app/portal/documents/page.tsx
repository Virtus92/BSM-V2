import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { FileText, Download, Eye } from 'lucide-react';

export const dynamic = 'force-dynamic';

type DocumentRow = {
  id: string;
  title: string;
  description: string | null;
  document_type: string;
  status: string;
  file_name: string;
  file_path: string;
  created_at: string;
};

export default async function CustomerDocumentsPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('user_type')
    .eq('id', user.id)
    .single();

  if (!profile || profile.user_type !== 'customer') redirect('/portal');

  // Resolve customer id
  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  // Load documents via RLS: public or assigned to this customer
  let documents: DocumentRow[] = [];
  if (customer?.id) {
    const { data } = await supabase
      .from('documents')
      .select('id, title, description, document_type, status, file_name, file_path, created_at')
      .or(`visibility.eq.public,customer_id.eq.${customer.id}`)
      .order('created_at', { ascending: false });
    documents = (data || []) as DocumentRow[];
  } else {
    // If customer not yet linked, show only public docs
    const { data } = await supabase
      .from('documents')
      .select('id, title, description, document_type, status, file_name, file_path, created_at')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false });
    documents = (data || []) as DocumentRow[];
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'approved': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'under_review': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'archived': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-600/20';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dokumente</h1>
            <p className="text-slate-400">Infofolder, Präsentationen, Broschüren, Produktlisten und mehr</p>
          </div>
          <Link href="/portal">
            <Button variant="outline" className="w-full sm:w-auto">Zurück zum Portal</Button>
          </Link>
        </div>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Verfügbare Dokumente
            </CardTitle>
            <CardDescription className="text-slate-400">Gefiltert auf öffentliche Dokumente und dokumente für Ihr Unternehmen</CardDescription>
          </CardHeader>
          <CardContent>
            {documents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-white font-medium truncate" title={doc.title}>{doc.title}</h3>
                        <Badge variant="secondary" className={getStatusColor(doc.status)}>{doc.status}</Badge>
                      </div>
                      {doc.description && (
                        <p className="text-sm text-slate-400 line-clamp-3">{doc.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>Typ: {doc.document_type}</span>
                        <span>•</span>
                        <span>{new Date(doc.created_at).toLocaleDateString('de-DE')}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 mt-2">
                        <a href={doc.file_path} target="_blank" rel="noopener noreferrer" className="flex-1">
                          <Button variant="outline" className="w-full justify-center gap-2">
                            <Eye className="w-4 h-4" /> Anzeigen
                          </Button>
                        </a>
                        <a href={doc.file_path} download className="flex-1">
                          <Button className="w-full justify-center gap-2">
                            <Download className="w-4 h-4" /> Herunterladen
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Keine Dokumente verfügbar</h3>
                <p className="text-slate-400">Sobald Dokumente für Sie freigegeben sind, erscheinen sie hier.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

