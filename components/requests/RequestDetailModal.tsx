'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Mail,
  Phone,
  Building,
  Calendar,
  User,
  TrendingUp,
  CheckCircle,
  X,
  Link as LinkIcon,
  Loader2,
  Send,
  Trash2,
  UserPlus
} from 'lucide-react';
import { RequestConversionModal } from '@/components/requests/RequestConversionModal';

type RequestStatus = 'new' | 'in_progress' | 'responded' | 'converted' | 'archived';
type Priority = 'low' | 'medium' | 'high' | 'urgent';

interface EmployeeOption { id: string; name: string; }

interface RequestDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string | null;
  onUpdated?: () => void;
  // Workspace (employee view) should not assign to employees
  canAssign?: boolean; // default true
}

export function RequestDetailModal({ open, onOpenChange, requestId, onUpdated, canAssign = true }: RequestDetailModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [request, setRequest] = useState<any | null>(null);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [assignTarget, setAssignTarget] = useState<string>('');
  const [noteContent, setNoteContent] = useState('');
  const [converting, setConverting] = useState(false);
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const statusBadge = useMemo(() => {
    const status: RequestStatus = (request?.status || 'new');
    const map: Record<RequestStatus, { label: string; cls: string }> = {
      new: { label: 'Neu', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
      in_progress: { label: 'In Bearbeitung', cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
      responded: { label: 'Beantwortet', cls: 'bg-green-500/10 text-green-400 border-green-500/20' },
      converted: { label: 'Konvertiert', cls: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
      archived: { label: 'Archiviert', cls: 'bg-gray-600/10 text-gray-300 border-gray-600/20' },
    };
    return map[status];
  }, [request]);

  const priorityBadge = useMemo(() => {
    const priority: Priority = (request?.priority || 'medium');
    const map: Record<Priority, { label: string; cls: string }> = {
      urgent: { label: 'Dringend', cls: 'bg-red-600/10 text-red-400 border-red-600/20' },
      high: { label: 'Hoch', cls: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
      medium: { label: 'Mittel', cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
      low: { label: 'Niedrig', cls: 'bg-green-500/10 text-green-400 border-green-500/20' },
    };
    return map[priority];
  }, [request]);

  useEffect(() => {
    if (!open || !requestId) return;
    (async () => {
      setLoading(true);
      try {
        // Load request details
        const res = await fetch(`/api/requests/${requestId}`);
        if (res.ok) {
          const data = await res.json();
          setRequest(data.request);
          setLoadError(null);
        } else if (res.status === 404) {
          // Fallback: fetch via /api/contact (ohne Assignments, aber mit Kernfeldern)
          const alt = await fetch(`/api/contact/${requestId}`);
          if (alt.ok) {
            const data = await alt.json();
            setRequest(data.request);
            setLoadError(null);
          } else {
            setLoadError('Anfrage nicht gefunden');
          }
        } else {
          setLoadError('Fehler beim Laden der Anfrage');
        }
        // Load assignable employees and admins (only if allowed)
        if (canAssign) {
          const [empRes, adminRes] = await Promise.all([
            fetch('/api/users?role=employee&limit=100'),
            fetch('/api/users?role=admin&limit=100'),
          ]);
          const users: any[] = [];
          if (empRes.ok) { const d = await empRes.json(); const list = d.users || d.data?.users || (Array.isArray(d.data) ? d.data : []); users.push(...(list || [])); }
          if (adminRes.ok) { const d = await adminRes.json(); const list = d.users || d.data?.users || (Array.isArray(d.data) ? d.data : []); users.push(...(list || [])); }
          setEmployees(users.map((u: any) => {
            const first = u.profile?.first_name ?? u.first_name;
            const last = u.profile?.last_name ?? u.last_name;
            const name = [first, last].filter(Boolean).join(' ') || 'Unbekannt';
            return { id: u.id, name };
          }));
        } else {
          setEmployees([]);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [open, requestId, canAssign]);

  const startWork = async () => {
    if (!request) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/requests/${request.id}/start`, { method: 'POST' });
      if (res.ok) {
        // Reload request detail
        const detail = await fetch(`/api/requests/${request.id}`);
        if (detail.ok) {
          const d = await detail.json();
          setRequest(d.request);
        }
        onUpdated?.();
      }
    } finally { setLoading(false); }
  };

  const completeWork = async () => {
    if (!request) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/requests/${request.id}/complete`, { method: 'POST' });
      if (res.ok) {
        const detail = await fetch(`/api/requests/${request.id}`);
        if (detail.ok) {
          const d = await detail.json();
          setRequest(d.request);
        }
        onUpdated?.();
      }
    } finally { setLoading(false); }
  };

  const assignTo = async () => {
    if (!request || !assignTarget) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/requests/${request.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: assignTarget })
      });
      if (res.ok) {
        const detail = await (await fetch(`/api/requests/${request.id}`)).json();
        setRequest(detail.request);
        setAssignTarget('');
        onUpdated?.();
      }
    } finally {
      setLoading(false);
    }
  };

  const unassign = async () => {
    if (!request) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/requests/${request.id}/assign`, { method: 'DELETE' });
      if (res.ok) {
        const detail = await (await fetch(`/api/requests/${request.id}`)).json();
        setRequest(detail.request);
        onUpdated?.();
      }
    } finally { setLoading(false); }
  };

  const addNote = async () => {
    if (!request || !noteContent.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/contact/${request.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteContent.trim(), is_internal: true })
      });
      if (res.ok) {
        setNoteContent('');
        const detail = await (await fetch(`/api/requests/${request.id}`)).json();
        setRequest(detail.request);
      }
    } finally { setLoading(false); }
  };

  const deleteNote = async (noteId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contact/notes/${noteId}`, { method: 'DELETE' });
      if (res.ok && request) {
        setRequest({ ...request, contact_request_notes: (request.contact_request_notes || []).filter((n: any) => n.id !== noteId) });
      }
    } finally { setLoading(false); }
  };

  const handleConvert = () => setShowConversionModal(true);
  const handleConversionSuccess = (customerId: string, action: 'created' | 'linked') => {
    setShowConversionModal(false);
    onUpdated?.();
    onOpenChange(false);
    // Navigate to the customer page
    if (customerId) {
      const basePath = window.location.pathname.startsWith('/workspace') ? '/workspace' : '/dashboard';
      router.push(`${basePath}/customers/${customerId}`);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto modern-card border-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            {request?.subject || (loadError || 'Anfrage')}
          </DialogTitle>
          <DialogDescription>
            Vollständige Details und Aktionen
          </DialogDescription>
          {!!request && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className={statusBadge.cls}>{statusBadge.label}</Badge>
              <Badge variant="outline" className={priorityBadge.cls}>{priorityBadge.label}</Badge>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {!request && (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                {loadError || 'Keine Daten verfügbar.'}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          {request && canAssign && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Assignment Row */}
              <div className="flex flex-col gap-2">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <select className="flex-1 px-3 py-2 rounded-md bg-gray-900 text-white border border-white/10" value={assignTarget} onChange={(e) => setAssignTarget(e.target.value)}>
                    <option value="">Mitarbeiter/Admin auswählen...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                  <Button onClick={assignTo} disabled={!assignTarget || loading} className="w-full sm:w-auto">
                    <UserPlus className="w-4 h-4 mr-2" /> Zuweisen
                  </Button>
                  <Button variant="outline" onClick={unassign} disabled={loading || !(request.request_assignments || []).some((a:any) => a.is_active)} className="w-full sm:w-auto">
                    <X className="w-4 h-4 mr-2" /> Zuweisung entfernen
                  </Button>
                </div>
                {/* Assigned users info */}
                {(request.request_assignments || []).filter((a:any)=>a.is_active).length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Aktive Zuweisungen: {(request.request_assignments || []).filter((a:any)=>a.is_active).length}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          )}

          {request && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Aktionen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-2">
                <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                  {request.status !== 'in_progress' && request.status !== 'converted' && request.status !== 'archived' && (
                    <Button variant="outline" onClick={startWork} disabled={loading} className="w-full sm:w-auto">
                      <TrendingUp className="w-4 h-4 mr-2" /> In Bearbeitung
                    </Button>
                  )}
                  {request.status !== 'responded' && request.status !== 'archived' && (
                    <Button variant="outline" onClick={completeWork} disabled={loading} className="w-full sm:w-auto">
                      <CheckCircle className="w-4 h-4 mr-2" /> Abschließen
                    </Button>
                  )}
                  {(() => { const cid = request?.converted_customer?.id || request?.converted_to_customer_id; return cid ? (
                    <Button className="mystery-button w-full sm:w-auto" onClick={() => window.location.assign(`/dashboard/customers/${cid}`)}>
                      Kunde öffnen
                    </Button>
                  ) : (
                    <Button className="mystery-button w-full sm:w-auto" onClick={handleConvert} disabled={converting}>
                      {converting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Konvertieren
                    </Button>
                  ); })()}
                  <Button variant="outline" className="w-full sm:w-auto" onClick={() => window.location.assign(`/workspace/requests/${request?.id}`)}>
                    <LinkIcon className="w-4 h-4 mr-2" /> Anfrage öffnen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          )}

          {/* Details */}
          {request && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Kontakt</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>{request?.email || '—'}</span>
                  </div>
                  {request?.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{request.phone}</span>
                    </div>
                  )}
                  {request?.company && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building className="w-4 h-4" />
                      <span>{request.company}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Meta</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Erstellt: {request?.created_at ? new Date(request.created_at).toLocaleString('de-DE') : '—'}</span>
                  </div>
                  {request?.updated_at && request.updated_at !== request.created_at && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Aktualisiert: {new Date(request.updated_at).toLocaleString('de-DE')}</span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Nachricht</h4>
                <div className="p-4 bg-background/50 rounded-lg border border-white/10">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{request?.message || '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          )}

          {/* Notes */}
          {request && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Interne Notizen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <Textarea
                  placeholder="Neue interne Notiz hinzufügen..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="md:col-span-4"
                  rows={3}
                />
                <div className="md:col-span-1 flex md:block">
                  <Button onClick={addNote} disabled={loading || !noteContent.trim()} className="mystery-button w-full">
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    Hinzufügen
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                {(request?.contact_request_notes || []).map((note: any) => (
                  <div key={note.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{note.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(note.created_at).toLocaleString('de-DE')} · {note.created_by_user?.first_name} {note.created_by_user?.last_name}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:bg-red-500/10" onClick={() => deleteNote(note.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {(request?.contact_request_notes || []).length === 0 && (
                  <div className="text-sm text-muted-foreground">Keine Notizen vorhanden.</div>
                )}
              </div>
            </CardContent>
          </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Schließen</Button>
        </DialogFooter>
      </DialogContent>

      <RequestConversionModal
        request={request}
        open={showConversionModal}
        onOpenChange={setShowConversionModal}
        onSuccess={handleConversionSuccess}
      />
    </Dialog>
  );
}
