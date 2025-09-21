'use server';

import { notFound } from 'next/navigation';
import { getContactRequestById } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { ContactRequestStatusBadge, PriorityBadge } from '@/components/ui/status-badge';
import Link from 'next/link';
import {
  MessageSquare,
  Mail,
  Phone,
  Building,
  User,
  Calendar,
  ArrowLeft,
  Edit,
  ExternalLink,
  UserPlus,
  Clock,
  Globe
} from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils/formatters';
import ContactRequestNotes from '@/components/requests/contact-request-notes';
import type { ContactRequestStatus, PriorityLevel } from '@/lib/shared-types';

type Props = { params: Promise<{ id: string }> };

export default async function ContactRequestDetailPage({ params }: Props) {
  const { id } = await params;
  const request = await getContactRequestById(id);
  if (!request) return notFound();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="fade-in-up">
        {/* Top row: Back (left) + Actions (right) */}
        <div className="flex items-center justify-between mb-3">
          <Link href="/dashboard/requests" className="inline-flex">
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Zurück
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            {request.converted_customer ? (
              <Link href={`/dashboard/crm/${request.converted_customer.id}`} className="inline-flex">
                <Button size="sm" variant="outline" className="h-8">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Kunde ansehen
                </Button>
              </Link>
            ) : (
              <Button size="sm" variant="outline" className="h-8" disabled>
                <UserPlus className="w-4 h-4 mr-2" />
                Zu Kunde konvertieren
              </Button>
            )}
          </div>
        </div>

        {/* Bottom row: Icon + Title + Contact + Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight break-words">
                {request.subject}
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                <User className="w-3 h-3" />
                {request.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <ContactRequestStatusBadge status={(request.status || 'new') as ContactRequestStatus} />
            <PriorityBadge priority={(request.priority || 'medium') as PriorityLevel} />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 fade-in-up">
        <div className="modern-card">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">E-Mail</div>
              <div className="text-sm text-muted-foreground truncate">{request.email}</div>
            </div>
          </div>
        </div>
        <div className="modern-card">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">Telefon</div>
              <div className="text-sm text-muted-foreground">{request.phone || '-'}</div>
            </div>
          </div>
        </div>
        <div className="modern-card">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">Unternehmen</div>
              <div className="text-sm text-muted-foreground">{request.company || '-'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in-up">
        <div className="lg:col-span-2 space-y-6">
          {/* Message */}
          <div className="modern-card">
            <h3 className="font-semibold mb-4">Nachricht</h3>
            <div className="p-4 bg-background/50 rounded-lg border border-white/10">
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">{request.message}</p>
            </div>
          </div>

          {/* Conversion Status */}
          {request.converted_customer && (
            <div className="modern-card">
              <h3 className="font-semibold mb-4">Konvertierungsstatus</h3>
              <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <div className="flex items-center gap-2 text-purple-400">
                  <UserPlus className="w-5 h-5" />
                  <div>
                    <p className="font-medium">
                      Erfolgreich zu Kunde konvertiert
                    </p>
                    <p className="text-sm text-purple-300">
                      {request.converted_customer.contact_person || request.converted_customer.company_name}
                    </p>
                    {request.converted_at && (
                      <p className="text-xs text-purple-300 mt-1">
                        Konvertiert am: {formatDateTime(request.converted_at)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="modern-card">
            <h3 className="font-semibold mb-4">Notizen</h3>
            <ContactRequestNotes requestId={request.id} initialNotes={request.notes || []} />
          </div>
        </div>

        <div className="space-y-6">
          {/* Metadata */}
          <div className="modern-card">
            <h3 className="font-semibold mb-4">Metadaten</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Erstellt: {formatDate(request.created_at)}</span>
              </div>
              {request.updated_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Aktualisiert: {formatDate(request.updated_at)}</span>
                </div>
              )}
              {request.source && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span>Quelle: {request.source}</span>
                </div>
              )}
              {request.ip_address && (
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-mono">IP: {request.ip_address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="modern-card">
            <h3 className="font-semibold mb-4">Aktionen</h3>
            <div className="grid grid-cols-2 gap-2">
              <a href={`mailto:${request.email}`} target="_blank" rel="noreferrer">
                <Button variant="outline" className="w-full">
                  <Mail className="w-4 h-4 mr-2" />
                  E-Mail
                </Button>
              </a>
              {request.phone && (
                <a href={`tel:${request.phone}`} target="_blank" rel="noreferrer">
                  <Button variant="outline" className="w-full">
                    <Phone className="w-4 h-4 mr-2" />
                    Anrufen
                  </Button>
                </a>
              )}
              <Button variant="outline" className="w-full col-span-2" disabled>
                <Edit className="w-4 h-4 mr-2" />
                Status ändern
              </Button>
            </div>
          </div>

          {/* Status History */}
          <div className="modern-card">
            <h3 className="font-semibold mb-4">Timeline</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Eingegangen: {formatDateTime(request.created_at)}</span>
              </div>
              {request.updated_at && request.updated_at !== request.created_at && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Letzte Änderung: {formatDateTime(request.updated_at)}</span>
                </div>
              )}
              {request.converted_at && (
                <div className="flex items-center gap-2 text-purple-400">
                  <UserPlus className="w-4 h-4" />
                  <span>Konvertiert: {formatDateTime(request.converted_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}