'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Select component imports removed - using native HTML select instead
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Users, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { useEffect } from 'react';
import { Customer, CUSTOMER_STATUS_VALUES, getStatusLabel, CustomerStatus } from '@/lib/shared-types';
import { useCustomerForm } from '@/lib/hooks/useCustomerForm';

interface CustomerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  onSuccess?: () => void;
}

export function CustomerForm({ open, onOpenChange, customer, onSuccess }: CustomerFormProps) {
  const {
    formData,
    isSubmitting,
    error,
    updateField,
    resetForm,
    loadCustomer,
    submitForm,
    isValid,
    fieldErrors
  } = useCustomerForm(() => {
    onSuccess?.();
    onOpenChange(false);
    resetForm();
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitForm(customer || undefined);
  };

  // Ensure editing pre-fills when parent opens dialog programmatically
  useEffect(() => {
    if (open && customer) {
      loadCustomer(customer);
    }
    // We intentionally ignore reset on close here; handled in onOpenChange(false)
  }, [open, customer, loadCustomer]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto modern-card border-0">
        <DialogHeader className="pb-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl">
                {customer ? 'Kunde bearbeiten' : 'Neuer Kunde'}
              </DialogTitle>
              <DialogDescription className="text-base">
                {customer
                  ? 'Bearbeiten Sie die Kundeninformationen und speichern Sie Ihre Änderungen.'
                  : 'Erstellen Sie einen neuen Kunden mit allen wichtigen Informationen.'
                }
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b border-white/10 pb-2">
              Grundinformationen
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="company" className="text-sm font-medium">
                  Unternehmen *
                </Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => updateField('company', e.target.value)}
                  placeholder="Unternehmen GmbH"
                />
                {fieldErrors.company && (
                  <p className="text-xs text-red-500">{fieldErrors.company}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Name/Kontaktperson
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Max Mustermann"
                />
                {fieldErrors.name && (
                  <p className="text-xs text-red-500">{fieldErrors.name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b border-white/10 pb-2">
              Kontaktdaten
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="kontakt@unternehmen.de"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">Telefon</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+49 123 456789"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b border-white/10 pb-2">
              Adresse
            </h3>
            <div className="space-y-2">
              <Label htmlFor="street" className="text-sm font-medium">Straße</Label>
              <Input
                id="street"
                value={formData.street}
                onChange={(e) => updateField('street', e.target.value)}
                placeholder="Musterstraße 123"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="postal_code" className="text-sm font-medium">PLZ</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => updateField('postal_code', e.target.value)}
                  placeholder="12345"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-medium">Stadt</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  placeholder="Berlin"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country" className="text-sm font-medium">Land</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => updateField('country', e.target.value)}
                  placeholder="Deutschland"
                />
              </div>
            </div>
          </div>

          {/* Business Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b border-white/10 pb-2">
              Geschäftsdaten
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="industry" className="text-sm font-medium">Branche</Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => updateField('industry', e.target.value)}
                  placeholder="z.B. IT, Automotive, Retail"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website" className="text-sm font-medium">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => updateField('website', e.target.value)}
                  placeholder="https://www.unternehmen.de"
                />
              </div>
            </div>
          </div>

          {/* CRM Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b border-white/10 pb-2">
              CRM Einstellungen
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                <select
                  value={formData.status}
                  onChange={(e) => updateField('status', e.target.value as CustomerStatus)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {CUSTOMER_STATUS_VALUES.map((status) => (
                    <option key={status} value={status}>
                      {getStatusLabel(status, 'customer')}
                    </option>
                  ))}
                </select>
              </div>
              
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b border-white/10 pb-2">
              Tags
            </h3>
            <div className="space-y-2">
              <Label htmlFor="tags" className="text-sm font-medium">Tags (durch Komma getrennt)</Label>
              <Input
                id="tags"
                value={formData.tags.join(', ')}
                onChange={(e) => {
                  const tagsArray = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
                  updateField('tags', tagsArray);
                }}
                placeholder="z.B. VIP, E-Commerce, Software"
              />
              <p className="text-xs text-muted-foreground">Hinweis: Notizen verwalten Sie jetzt direkt in der Kundenansicht.</p>
            </div>
          </div>

          <DialogFooter className="flex gap-3 pt-6 border-t border-white/[0.08]">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-none focus-ring"
              disabled={isSubmitting}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="mystery-button flex-1 sm:flex-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Speichern...
                </>
              ) : (
                <>
                  {customer ? 'Aktualisieren' : 'Erstellen'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
