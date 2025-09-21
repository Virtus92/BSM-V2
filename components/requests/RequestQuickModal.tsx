'use client';

import { Button } from '@/components/ui/button';
import { ContactRequestStatusBadge, PriorityBadge } from '@/components/ui/status-badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  MessageSquare,
  Mail,
  Phone,
  Building,
  User,
  Calendar,
  ExternalLink,
  UserPlus,
  Clock,
  MessageCircle,
  PhoneCall
} from 'lucide-react';
import { ContactRequestWithRelations, ContactRequestStatus, PriorityLevel } from '@/lib/shared-types';
import { formatDate } from '@/lib/utils/formatters';
import { useRouter } from 'next/navigation';
import { RequestConversionModal } from './RequestConversionModal';
import { useState } from 'react';

interface RequestQuickModalProps {
  request: ContactRequestWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConvertToCustomer: (requestId: string) => void;
  isConvertible: (request: ContactRequestWithRelations) => boolean;
  converting: string | null;
}

export function RequestQuickModal({
  request,
  open,
  onOpenChange,
  onConvertToCustomer,
  isConvertible,
  converting
}: RequestQuickModalProps) {
  const router = useRouter();
  const [showConversionModal, setShowConversionModal] = useState(false);

  const handleConversionSuccess = () => {
    // Refresh the parent component by calling the original conversion handler
    if (request) {
      onConvertToCustomer(request.id);
    }
    setShowConversionModal(false);
  };

  if (!request) return null;

  const handleOpenDetail = () => {
    router.push(`/dashboard/requests/${request.id}`);
    onOpenChange(false);
  };

  const handleEmail = () => {
    if (request.email) {
      window.location.href = `mailto:${request.email}`;
    }
  };

  const handleCall = () => {
    if (request.phone) {
      window.location.href = `tel:${request.phone}`;
    }
  };

  const handleConvert = () => {
    setShowConversionModal(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto modern-card border-0">
        <DialogHeader className="pb-6 border-b border-white/[0.08]">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-2xl font-bold line-clamp-1">{request.subject}</DialogTitle>
                <DialogDescription className="text-base">
                  Schnellübersicht und Aktionen
                </DialogDescription>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <ContactRequestStatusBadge status={(request.status || 'new') as ContactRequestStatus} />
                <PriorityBadge priority={(request.priority || 'medium') as PriorityLevel} />
              </div>
            </div>
            <div className="flex md:hidden items-center gap-2">
              <ContactRequestStatusBadge status={(request.status || 'new') as ContactRequestStatus} />
              <PriorityBadge priority={(request.priority || 'medium') as PriorityLevel} />
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-500" />
                </div>
                <h4 className="font-semibold">Kontaktdaten</h4>
              </div>
              <div className="space-y-3 pl-13">
                <div>
                  <p className="font-medium">{request.name}</p>
                  <p className="text-sm text-muted-foreground">Absender</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{request.email}</span>
                </div>
                {request.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{request.phone}</span>
                  </div>
                )}
                {request.company && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <span>{request.company}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Request Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-green-500" />
                </div>
                <h4 className="font-semibold">Anfrageinformationen</h4>
              </div>
              <div className="space-y-3 pl-13">
                <div>
                  <p className="font-medium">{request.source || 'Website'}</p>
                  <p className="text-sm text-muted-foreground">Quelle</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Eingegangen: {formatDate(request.created_at)}</span>
                </div>
                {request.updated_at && request.updated_at !== request.created_at && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>Aktualisiert: {formatDate(request.updated_at)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-3">
            <h4 className="font-semibold">Nachricht</h4>
            <div className="p-4 bg-background/30 rounded-lg border border-white/10">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{request.message}</p>
            </div>
          </div>

          {/* Conversion Status */}
          {request.converted_customer && (
            <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <div className="flex items-center gap-3">
                <UserPlus className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="font-medium text-purple-400">Erfolgreich konvertiert</p>
                  <p className="text-sm text-purple-300">
                    Kunde: {request.converted_customer.contact_person || request.converted_customer.company_name}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Schnellaktionen
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEmail}
                className="flex items-center gap-2 h-12 hover:bg-blue-500/10 hover:border-blue-500/20"
              >
                <Mail className="w-4 h-4" />
                E-Mail
              </Button>
              {request.phone && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCall}
                  className="flex items-center gap-2 h-12 hover:bg-green-500/10 hover:border-green-500/20"
                >
                  <PhoneCall className="w-4 h-4" />
                  Anrufen
                </Button>
              )}
              {isConvertible(request) ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleConvert}
                  disabled={converting === request.id}
                  className="flex items-center gap-2 h-12 hover:bg-purple-500/10 hover:border-purple-500/20"
                >
                  <UserPlus className="w-4 h-4" />
                  Konvertieren
                </Button>
              ) : request.converted_customer ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    router.push(`/dashboard/crm/${request.converted_customer?.id}`);
                    onOpenChange(false);
                  }}
                  className="flex items-center gap-2 h-12 hover:bg-green-500/10 hover:border-green-500/20"
                >
                  <UserPlus className="w-4 h-4" />
                  Kunde öffnen
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="flex items-center gap-2 h-12 opacity-50 cursor-not-allowed"
                >
                  <UserPlus className="w-4 h-4" />
                  Nicht konvertierbar
                </Button>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-6 border-t border-white/[0.08] space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Erstellt: {formatDate(request.created_at)}</span>
            </div>

            {request.converted_customer ? (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleOpenDetail}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  Anfrage öffnen
                  <ExternalLink className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => {
                    router.push(`/dashboard/crm/${request.converted_customer?.id}`);
                    onOpenChange(false);
                  }}
                  className="mystery-button flex items-center gap-2"
                >
                  Kunde öffnen
                  <UserPlus className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleOpenDetail}
                className="mystery-button w-full flex items-center gap-2"
              >
                Anfrage öffnen
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Request Conversion Modal */}
      <RequestConversionModal
        request={request}
        open={showConversionModal}
        onOpenChange={setShowConversionModal}
        onSuccess={handleConversionSuccess}
      />
    </Dialog>
  );
}
