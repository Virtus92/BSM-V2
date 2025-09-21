'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ContactRequestStatusBadge, PriorityBadge } from '@/components/ui/status-badge';
import {
  MessageSquare,
  Calendar,
  User,
  Mail,
  ExternalLink,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { ContactRequestWithRelations } from '@/lib/shared-types';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils/formatters';
import Link from 'next/link';

interface CustomerRequestsProps {
  customerId: string;
}

export function CustomerRequests({ customerId }: CustomerRequestsProps) {
  const [requests, setRequests] = useState<ContactRequestWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchCustomerRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('contact_requests')
        .select(`
          *,
          converted_customer:customers(
            id,
            company_name,
            contact_person,
            email
          )
        `)
        .eq('converted_to_customer_id', customerId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching customer requests:', fetchError);
        setError('Fehler beim Laden der Anfragen');
        return;
      }

      setRequests(data || []);
    } catch (err) {
      console.error('Error in fetchCustomerRequests:', err);
      setError('Unerwarteter Fehler beim Laden der Anfragen');
    } finally {
      setLoading(false);
    }
  }, [customerId, supabase]);

  useEffect(() => {
    fetchCustomerRequests();
  }, [customerId, fetchCustomerRequests]);

  if (loading) {
    return (
      <div className="modern-card">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Lade Anfragen...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modern-card">
        <div className="flex items-center gap-3 py-6">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <div>
            <p className="font-medium text-red-500">Fehler aufgetreten</p>
            <p className="text-sm text-red-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="modern-card">
        <div className="text-center py-8">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-muted/10 flex items-center justify-center mb-4">
            <MessageSquare className="w-8 h-8 text-muted-foreground" />
          </div>
          <h4 className="font-medium mb-2">Keine Anfragen</h4>
          <p className="text-sm text-muted-foreground">
            Dieser Kunde hat noch keine konvertierten Anfragen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Konvertierte Anfragen</h3>
            <p className="text-sm text-muted-foreground">
              {requests.length} {requests.length === 1 ? 'Anfrage' : 'Anfragen'} von diesem Kunden
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {requests.map((request) => (
          <div
            key={request.id}
            className="p-4 rounded-xl border border-white/[0.08] hover:border-white/[0.15] transition-all duration-200 bg-background/30 group"
          >
            <div className="mb-3">
              <div className="mb-3">
                <Link href={`/dashboard/requests/${request.id}`}>
                  <h4 className="font-medium group-hover:text-primary transition-colors line-clamp-1 cursor-pointer mb-2">
                    {request.subject}
                  </h4>
                </Link>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {request.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {request.email}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ContactRequestStatusBadge
                  status={request.status || 'converted'}
                  size="sm"
                />
                {request.priority && (
                  <PriorityBadge
                    priority={request.priority}
                    size="sm"
                  />
                )}
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {request.message}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Eingegangen: {formatDate(request.created_at || '')}
                </span>
                {request.converted_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Konvertiert: {formatDate(request.converted_at)}
                  </span>
                )}
              </div>

              <Link href={`/dashboard/requests/${request.id}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Details
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {requests.length > 3 && (
        <div className="mt-6 text-center">
          <Link href={`/dashboard/requests?customer=${customerId}`}>
            <Button variant="outline" className="hover:bg-primary/10">
              Alle Anfragen anzeigen
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
