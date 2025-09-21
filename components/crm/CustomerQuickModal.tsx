'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  User,
  Calendar,
  Edit,
  ExternalLink,
  MessageCircle,
  PhoneCall
} from 'lucide-react';
import { Customer, getStatusColor as getColor, getStatusLabel as getLabel } from '@/lib/shared-types';
import { formatDate } from '@/lib/utils/formatters';
import { useRouter } from 'next/navigation';

interface CustomerQuickModalProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (customer: Customer) => void;
}

export function CustomerQuickModal({ customer, open, onOpenChange, onEdit }: CustomerQuickModalProps) {
  const router = useRouter();

  if (!customer) return null;

  const handleOpenDetail = () => {
    router.push(`/dashboard/crm/${customer.id}`);
    onOpenChange(false);
  };

  const handleEmail = () => {
    if (customer.email) {
      window.location.href = `mailto:${customer.email}`;
    }
  };

  const handleCall = () => {
    if (customer.phone) {
      window.location.href = `tel:${customer.phone}`;
    }
  };

  const handleWebsite = () => {
    if (customer.website) {
      const url = customer.website.startsWith('http')
        ? customer.website
        : `https://${customer.website}`;
      window.location.href = url;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto modern-card border-0">
        <DialogHeader className="pb-6 border-b border-white/[0.08]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">{customer.company_name || customer.contact_person}</DialogTitle>
                <DialogDescription className="text-base">
                  Schnellübersicht und Aktionen
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getColor(customer.status || 'prospect', 'customer')}>
                {getLabel(customer.status || 'prospect', 'customer')}
              </Badge>
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
                {customer.contact_person && (
                  <div>
                    <p className="font-medium">{customer.contact_person}</p>
                    <p className="text-sm text-muted-foreground">Hauptansprechpartner</p>
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{customer.email}</span>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                {customer.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <span className="truncate">{customer.website}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Business Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-green-500" />
                </div>
                <h4 className="font-semibold">Geschäftsdaten</h4>
              </div>
              <div className="space-y-3 pl-13">
                <div>
                  <p className="font-medium">{customer.industry || 'Keine Branche'}</p>
                  <p className="text-sm text-muted-foreground">Branche</p>
                </div>
                <div />
                {(customer.city || customer.country) && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {customer.city && customer.country
                        ? `${customer.city}, ${customer.country}`
                        : customer.city || customer.country
                      }
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Schnellaktionen
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {customer.email && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEmail}
                  className="flex items-center gap-2 h-12 hover:bg-blue-500/10 hover:border-blue-500/20"
                >
                  <Mail className="w-4 h-4" />
                  E-Mail
                </Button>
              )}
              {customer.phone && (
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
              {customer.website && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleWebsite}
                  className="flex items-center gap-2 h-12 hover:bg-purple-500/10 hover:border-purple-500/20"
                >
                  <Globe className="w-4 h-4" />
                  Website
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(customer)}
                className="flex items-center gap-2 h-12 hover:bg-primary/10 hover:border-primary/20"
              >
                <Edit className="w-4 h-4" />
                Bearbeiten
              </Button>
            </div>
          </div>

          {/* Additional Info */}
          {(customer.tags?.length) && (
            <div className="space-y-3 pt-4 border-t border-white/[0.08]">
              {customer.tags && customer.tags.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {customer.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {/* Notes now handled via separate customer_notes system */}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-between items-center pt-6 border-t border-white/[0.08]">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Erstellt: {formatDate(customer.created_at)}</span>
            </div>
            <Button
              onClick={handleOpenDetail}
              className="mystery-button flex items-center gap-2"
            >
              Kunde öffnen
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
