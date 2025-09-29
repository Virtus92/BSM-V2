'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Globe, MapPin, Building2, Calendar, Edit, UserPlus, Loader2 } from 'lucide-react';
import CustomerNotes from '@/components/crm/customer-notes';

type CustomerStatus = 'prospect' | 'active' | 'inactive' | 'pending';

interface EmployeeOption { id: string; name: string; }

interface CustomerDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string | null;
  onUpdated?: () => void;
  // Workspace (employee view) should not assign employees
  canAssign?: boolean; // default true
}

export function CustomerDetailModal({ open, onOpenChange, customerId, onUpdated, canAssign = true }: CustomerDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState<any | null>(null);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [assignTarget, setAssignTarget] = useState<string>('');

  const statusBadge = useMemo(() => {
    const status: CustomerStatus = (customer?.status || 'prospect');
    const map: Record<CustomerStatus, { label: string; cls: string }> = {
      prospect: { label: 'Interessent', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
      active: { label: 'Aktiv', cls: 'bg-green-500/10 text-green-400 border-green-500/20' },
      inactive: { label: 'Inaktiv', cls: 'bg-gray-600/10 text-gray-300 border-gray-600/20' },
      pending: { label: 'Ausstehend', cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
    };
    return map[status];
  }, [customer]);

  useEffect(() => {
    if (!open || !customerId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/customers/${customerId}`);
        if (res.ok) {
          const data = await res.json();
          setCustomer(data.customer);
        }
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
      } finally { setLoading(false); }
    })();
  }, [open, customerId, canAssign]);

  const assignTo = async () => {
    if (!customer || !assignTarget) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: assignTarget })
      });
      if (res.ok) {
        const detail = await (await fetch(`/api/customers/${customer.id}`)).json();
        setCustomer(detail.customer);
        setAssignTarget('');
        onUpdated?.();
      }
    } finally { setLoading(false); }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto modern-card border-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {customer?.company_name || customer?.contact_person || 'Kunde'}
          </DialogTitle>
          <DialogDescription>
            Vollständige Kundendetails und Aktionen
          </DialogDescription>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className={statusBadge.cls}>{statusBadge.label}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {canAssign && (
                <div className="flex items-center gap-2">
                  <select className="flex-1 px-3 py-2 rounded-md bg-gray-900 text-white border border-white/10" value={assignTarget} onChange={(e) => setAssignTarget(e.target.value)}>
                    <option value="">Mitarbeiter/Admin auswählen...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                  <Button onClick={assignTo} disabled={!assignTarget || loading}>
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}<UserPlus className="w-4 h-4 mr-2" /> Zuweisen
                  </Button>
                </div>
              )}
              <div className="flex gap-2">
                {customer?.email && (
                  <Button variant="outline" onClick={() => window.location.assign(`mailto:${customer.email}`)}>
                    <Mail className="w-4 h-4 mr-2" /> E‑Mail
                  </Button>
                )}
                {customer?.phone && (
                  <Button variant="outline" onClick={() => window.location.assign(`tel:${customer.phone}`)}>
                    <Phone className="w-4 h-4 mr-2" /> Anrufen
                  </Button>
                )}
                {customer?.website && (
                  <Button variant="outline" onClick={() => window.location.assign(customer.website.startsWith('http') ? customer.website : `https://${customer.website}`)}>
                    <Globe className="w-4 h-4 mr-2" /> Website
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informationen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>{customer?.email || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>{customer?.phone || '—'}</span>
                  </div>
                  {customer?.website && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="w-4 h-4" />
                      <span className="truncate">{customer.website}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {(customer?.city || customer?.country) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {customer.city && customer.country ? `${customer.city}, ${customer.country}` : (customer.city || customer.country)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Erstellt: {customer?.created_at ? new Date(customer.created_at).toLocaleString('de-DE') : '—'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes (voll) */}
          {customer?.id && (
            <CustomerNotes customerId={customer.id} />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Schließen</Button>
          {canAssign && (
            <Button onClick={() => window.location.assign(`/dashboard/crm/${customer?.id}`)}>
              <Edit className="w-4 h-4 mr-2" /> Öffnen
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
