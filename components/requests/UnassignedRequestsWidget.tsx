'use client';

import { useState, useEffect } from 'react';
import { ModernCard } from '@/components/shared/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, Mail, Phone, User, CheckCircle } from 'lucide-react';
import { formatUserDate } from '@/lib/user-utils';

interface UnassignedRequest {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  email?: string;
  phone?: string;
  created_at: string;
  customer_user_id?: string;
}

export function UnassignedRequestsWidget() {
  const [requests, setRequests] = useState<UnassignedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [takingOver, setTakingOver] = useState<string | null>(null);

  useEffect(() => {
    fetchUnassignedRequests();
  }, []);

  const fetchUnassignedRequests = async () => {
    try {
      const response = await fetch('/api/requests/unassigned');
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching unassigned requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTakeOver = async (requestId: string) => {
    setTakingOver(requestId);
    try {
      const response = await fetch(`/api/requests/${requestId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selfAssign: true }),
      });

      if (response.ok) {
        // Remove the request from the list since it's now assigned
        setRequests(prev => prev.filter(req => req.id !== requestId));
        alert('Anfrage erfolgreich übernommen!');
      } else {
        const error = await response.json();
        alert('Fehler beim Übernehmen der Anfrage: ' + error.error);
      }
    } catch (error) {
      console.error('Error taking over request:', error);
      alert('Fehler beim Übernehmen der Anfrage');
    } finally {
      setTakingOver(null);
    }
  };

  if (loading) {
    return (
      <ModernCard
        title="Verfügbare Anfragen"
        description="Laden..."
      >
        <p className="text-sm text-white/70">Anfragen werden geladen...</p>
      </ModernCard>
    );
  }

  return (
    <ModernCard
      title="Verfügbare Anfragen"
      description="Unzugewiesene Kundenanfragen, die übernommen werden können"
      actions={
        <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
          {requests.length}
        </Badge>
      }
    >
        {requests.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="font-medium mb-2">Alle Anfragen zugewiesen</h3>
            <p className="text-sm text-muted-foreground">
              Momentan gibt es keine unzugewiesenen Kundenanfragen.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.slice(0, 5).map((request) => (
              <div key={request.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium truncate">{request.subject}</h4>
                      <Badge
                        variant={
                          request.priority === 'urgent' ? 'destructive' :
                          request.priority === 'high' ? 'default' : 'outline'
                        }
                        className="text-xs"
                      >
                        {request.priority === 'urgent' ? 'Dringend' :
                         request.priority === 'high' ? 'Hoch' :
                         request.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {request.message}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      {request.email && (
                        <span className="flex items-center space-x-1">
                          <Mail className="w-3 h-3" />
                          <span>{request.email}</span>
                        </span>
                      )}
                      {request.phone && (
                        <span className="flex items-center space-x-1">
                          <Phone className="w-3 h-3" />
                          <span>{request.phone}</span>
                        </span>
                      )}
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatUserDate(request.created_at)}</span>
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleTakeOver(request.id)}
                    disabled={takingOver === request.id}
                    className="ml-4"
                  >
                    {takingOver === request.id ? 'Übernehme...' : 'Übernehmen'}
                  </Button>
                </div>
              </div>
            ))}

            {requests.length > 5 && (
              <div className="text-center pt-2">
                <Button variant="outline" size="sm">
                  {requests.length - 5} weitere Anfragen anzeigen
                </Button>
              </div>
            )}
          </div>
        )}
    </ModernCard>
  );
}