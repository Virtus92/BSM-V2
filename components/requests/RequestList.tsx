'use client';

import { Button } from '@/components/ui/button';
import { ContactRequestStatusBadge, PriorityBadge } from '@/components/ui/status-badge';
import { MessageSquare, UserPlus, Mail, Phone, Building, ExternalLink, Calendar, User, Eye } from 'lucide-react';
import { ContactRequestWithRelations, ContactRequestStatus, PriorityLevel } from '@/lib/shared-types';
import { RequestConversionModal } from './RequestConversionModal';
import Link from 'next/link';
import { useState } from 'react';

interface RequestListProps {
  requests: ContactRequestWithRelations[];
  onRequestClick: (request: ContactRequestWithRelations) => void;
  onConvertToCustomer: (requestId: string) => void;
  isConvertible: (request: ContactRequestWithRelations) => boolean;
  formatDate: (date: string) => string;
  converting: string | null;
}

export function RequestList({
  requests,
  onRequestClick,
  onConvertToCustomer,
  isConvertible,
  formatDate,
  converting
}: RequestListProps) {
  const [conversionModalRequest, setConversionModalRequest] = useState<ContactRequestWithRelations | null>(null);

  const handleConversionSuccess = () => {
    // Refresh the parent component by calling the original conversion handler
    if (conversionModalRequest) {
      onConvertToCustomer(conversionModalRequest.id);
    }
    setConversionModalRequest(null);
  };
  if (requests.length === 0) {
    return (
      <div className="modern-card fade-in-up stagger-delay-3">
        <div className="text-center py-12">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-muted/10 flex items-center justify-center mb-4">
            <MessageSquare className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Keine Anfragen gefunden</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Derzeit sind keine Kontaktanfragen vorhanden, die Ihren Filterkriterien entsprechen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-card fade-in-up stagger-delay-3">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Anfragenliste</h3>
            <p className="text-sm text-muted-foreground">
              {requests.length} {requests.length === 1 ? 'Anfrage' : 'Anfragen'} gefunden
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        {/* Mobile Card Layout */}
        <div className="grid grid-cols-1 gap-4 lg:hidden">
          {requests.map((request) => (
            <div
              key={request.id}
              className="p-4 rounded-xl border border-white/[0.08] hover:border-white/[0.15] transition-all duration-200 bg-background/30 group"
            >
              <div className="mb-3">
                <div onClick={() => onRequestClick(request)} className="cursor-pointer">
                  <Link href={`/dashboard/requests/${request.id}`}>
                    <h4 className="font-semibold group-hover:text-primary transition-colors line-clamp-1 mb-2">
                      {request.subject}
                    </h4>
                  </Link>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
                    <User className="w-3 h-3" />
                    {request.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <ContactRequestStatusBadge status={(request.status || 'new') as ContactRequestStatus} size="sm" />
                  <PriorityBadge priority={(request.priority || 'medium') as PriorityLevel} size="sm" />
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {request.email}
                </span>
                {request.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {request.phone}
                  </span>
                )}
              </div>

              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {request.message}
              </p>

              {request.converted_customer && (
                <div className="mb-3 p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <div className="flex items-center gap-2 text-purple-400 text-sm">
                    <UserPlus className="w-3 h-3" />
                    <span>Konvertiert zu: {request.converted_customer.contact_person || request.converted_customer.company_name}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/requests/${request.id}`}>
                    <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Öffnen
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRequestClick(request)}
                    className="hover:bg-primary/10"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Quick View
                  </Button>
                </div>
                <div className="flex items-center gap-1">
                  {isConvertible(request) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConversionModalRequest(request)}
                      disabled={converting === request.id}
                      className="hover:bg-purple-500/10 text-purple-500"
                    >
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table Layout */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-9 gap-4 p-4 text-sm font-medium text-muted-foreground border-b border-white/[0.08]">
            <div className="col-span-2">Betreff</div>
            <div>Absender</div>
            <div>Status</div>
            <div>Priorität</div>
            <div>Datum</div>
            <div>Konvertierung</div>
            <div>Nachricht</div>
            <div className="text-right">Aktionen</div>
          </div>
          <div className="space-y-2">
            {requests.map((request) => (
              <div
                key={request.id}
                onClick={() => onRequestClick(request)}
                className="grid grid-cols-9 gap-4 p-4 rounded-xl hover:bg-white/[0.03] cursor-pointer transition-all duration-200 border border-transparent hover:border-white/[0.08] group"
              >
                <div className="col-span-2">
                  <div className="space-y-1">
                    <Link href={`/dashboard/requests/${request.id}`}>
                      <p className="font-medium group-hover:text-primary transition-colors line-clamp-1">
                        {request.subject}
                      </p>
                    </Link>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {request.email}
                      </span>
                      {request.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {request.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <p className="font-medium">{request.name}</p>
                  {request.company && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Building className="w-3 h-3" />
                      {request.company}
                    </p>
                  )}
                </div>
                <div>
                  <ContactRequestStatusBadge status={(request.status || 'new') as ContactRequestStatus} size="sm" />
                </div>
                <div>
                  <PriorityBadge priority={(request.priority || 'medium') as PriorityLevel} size="sm" />
                </div>
                <div>
                  <span className="text-sm flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(request.created_at || '')}
                  </span>
                </div>
                <div>
                  {request.converted_customer ? (
                    <div className="flex items-center gap-1 text-purple-400">
                      <UserPlus className="w-3 h-3" />
                      <span className="text-xs">Konvertiert</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {request.message}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <Link href={`/dashboard/requests/${request.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); }}
                        className="hover:bg-primary/10 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </Link>
                    {isConvertible(request) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setConversionModalRequest(request); }}
                        disabled={converting === request.id}
                        className="hover:bg-purple-500/10 text-purple-500 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <UserPlus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Request Conversion Modal */}
      <RequestConversionModal
        request={conversionModalRequest}
        open={!!conversionModalRequest}
        onOpenChange={(open) => !open && setConversionModalRequest(null)}
        onSuccess={handleConversionSuccess}
      />
    </div>
  );
}
