'use server';

import { notFound } from 'next/navigation';
import { getCustomerById } from '@/lib/database';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  User,
  Calendar,
  ArrowLeft,
  Edit
} from 'lucide-react';
import { formatDate } from '@/lib/utils/formatters';
import { getStatusColor as getColor, getStatusLabel as getLabel } from '@/lib/shared-types';
import CustomerNotes from '@/components/crm/customer-notes';
import { CustomerRequests } from '@/components/crm/CustomerRequests';

type Props = { params: Promise<{ id: string }> };

export default async function CustomerDetailPage({ params }: Props) {
  const { id } = await params;
  const customer = await getCustomerById(id);
  if (!customer) return notFound();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="fade-in-up">
        {/* Top row: Back (left) + Edit (right) */}
        <div className="flex items-center justify-between mb-3">
          <Link href="/dashboard/crm" className="inline-flex">
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Zurück
            </Button>
          </Link>
          <Link href={`/dashboard/crm?edit=${customer.id}`} className="inline-flex">
            <Button size="sm" className="mystery-button h-8">
              <Edit className="w-4 h-4 mr-2" />
              Bearbeiten
            </Button>
          </Link>
        </div>

        {/* Bottom row: Icon + Title + Contact + Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight break-words">
                {customer.company_name || customer.contact_person}
              </h1>
              {customer.contact_person && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                  <User className="w-3 h-3" />
                  {customer.contact_person}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={getColor(customer.status || 'prospect', 'customer')}>
              {getLabel(customer.status || 'prospect', 'customer')}
            </Badge>
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
              <div className="text-sm text-muted-foreground">{customer.email || '-'}</div>
            </div>
          </div>
        </div>
        <div className="modern-card">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">Telefon</div>
              <div className="text-sm text-muted-foreground">{customer.phone || '-'}</div>
            </div>
          </div>
        </div>
        <div className="modern-card">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">Website</div>
              <div className="text-sm text-muted-foreground truncate">{customer.website || '-'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in-up">
        <div className="lg:col-span-2 space-y-6">
          <div className="modern-card">
            <h3 className="font-semibold mb-4">Kontaktdaten</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>
                  {[customer.address_line1, customer.postal_code, customer.city].filter(Boolean).join(' ') || '-'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <span>{customer.country || '-'}</span>
              </div>
            </div>
          </div>

          <div className="modern-card">
            <h3 className="font-semibold mb-4">Geschäftsdaten</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Branche</div>
                <div className="font-medium">{customer.industry || '-'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Unternehmensgröße</div>
                <div className="font-medium">{customer.company_size || '-'}</div>
              </div>
            </div>
          </div>

          <div className="modern-card">
            <h3 className="font-semibold mb-4">Notizen</h3>
            <CustomerNotes customerId={customer.id} />
          </div>

          <CustomerRequests customerId={customer.id} />

          {customer.tags && customer.tags.length > 0 && (
            <div className="modern-card">
              <h3 className="font-semibold mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {customer.tags.map((t: string) => (
                  <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="modern-card">
            <h3 className="font-semibold mb-4">Metadaten</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Erstellt: {formatDate(customer.created_at)}</span>
              </div>
              {customer.updated_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Aktualisiert: {formatDate(customer.updated_at)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="modern-card">
            <h3 className="font-semibold mb-4">Aktionen</h3>
            <div className="grid grid-cols-2 gap-2">
              {customer.email && (
                <a href={`mailto:${customer.email}`} target="_blank" rel="noreferrer">
                  <Button variant="outline" className="w-full">E-Mail</Button>
                </a>
              )}
              {customer.phone && (
                <a href={`tel:${customer.phone}`} target="_blank" rel="noreferrer">
                  <Button variant="outline" className="w-full">Anrufen</Button>
                </a>
              )}
              {customer.website && (
                <a href={customer.website} target="_blank" rel="noreferrer">
                  <Button variant="outline" className="w-full">Website</Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
