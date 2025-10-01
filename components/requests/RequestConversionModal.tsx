'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ContactRequestStatusBadge } from '@/components/ui/status-badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  UserPlus,
  Mail,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Link as LinkIcon
} from 'lucide-react';
import { ContactRequestWithRelations } from '@/lib/shared-types';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface RequestConversionModalProps {
  request: ContactRequestWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (customerId: string, action: 'created' | 'linked') => void;
}

type ConversionStep = 'checking' | 'decision' | 'form' | 'processing' | 'success' | 'error';
type ConversionAction = 'create' | 'link' | null;

interface ExistingCustomer {
  id: string;
  company_name: string;
  contact_person: string | null;
  email: string;
  phone: string | null;
  created_at: string;
}

export function RequestConversionModal({
  request,
  open,
  onOpenChange,
  onSuccess
}: RequestConversionModalProps) {
  const router = useRouter();
  const supabase = createClient();

  // State Management
  const [step, setStep] = useState<ConversionStep>('checking');
  const [action, setAction] = useState<ConversionAction>(null);
  const [existingCustomers, setExistingCustomers] = useState<ExistingCustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<ExistingCustomer | null>(null);
  const [createdCustomerId, setCreatedCustomerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if request is already converted
  const isAlreadyConverted = request?.converted_customer;
  const convertedCustomerId = request?.converted_customer?.id;

  // Form State for New Customer
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    notes: ''
  });

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setStep('checking');
      setAction(null);
      setExistingCustomers([]);
      setSelectedCustomer(null);
      setCreatedCustomerId(null);
      setError(null);
      setFormData({
        company_name: '',
        contact_person: '',
        email: '',
        phone: '',
        notes: ''
      });
    }
  }, [open]);

  const checkExistingCustomers = useCallback(async () => {
    if (!request) return;

    try {
      // Check for existing customers with same email
      const { data: customers, error } = await supabase
        .from('customers')
        .select('id, company_name, contact_person, email, phone, created_at')
        .eq('email', request.email)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error checking existing customers:', error);
        setError(`Fehler beim Prüfen bestehender Kunden: ${error.message || 'Unbekannter Fehler'}`);
        setStep('error');
        return;
      }

      setExistingCustomers(customers || []);

      // Pre-fill form data
      setFormData({
        company_name: request.company || '',
        contact_person: request.name,
        email: request.email,
        phone: request.phone || '',
        notes: `Konvertiert aus Anfrage: ${request.subject}\n\nOriginal Nachricht:\n${request.message}`
      });

      setStep('decision');
    } catch (err) {
      console.error('Error in checkExistingCustomers:', err);
      setError('Unerwarteter Fehler beim Prüfen bestehender Kunden');
      setStep('error');
    }
  }, [request, supabase]);

  // Handle already converted requests
  useEffect(() => {
    if (open && request) {
      if (isAlreadyConverted && convertedCustomerId) {
        // Request is already converted, close modal and redirect to customer
        router.push(`/dashboard/customers/${convertedCustomerId}`);
        onOpenChange(false);
        return;
      } else if (step === 'checking') {
        checkExistingCustomers();
      }
    }
  }, [open, request, step, isAlreadyConverted, convertedCustomerId, checkExistingCustomers, router, onOpenChange]);

  const handleCreateNew = async () => {
    if (!request) return;

    setStep('processing');

    try {
      // Create new customer via API to avoid RLS issues
      const createResponse = await fetch(`/api/contact/${request.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.contact_person,
          company: formData.company_name || formData.contact_person,
          phone: formData.phone,
          status: 'active',
          notes: formData.notes
        })
      });

      if (!createResponse.ok) {
        const err = await createResponse.json().catch(() => ({}));
        console.error('Error creating customer:', err);
        setError(`Fehler beim Erstellen des Kunden: ${err.error || 'Unbekannter Fehler'}`);
        setStep('error');
        return;
      }

      const createData = await createResponse.json();
      const customer = createData.customer;

      // Auto-assign to current user when converting
      try {
        const assignResponse = await fetch(`/api/requests/${request.id}/assign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ selfAssign: true })
        });

        if (!assignResponse.ok) {
          console.warn('Auto-assignment failed during conversion, but conversion was successful');
        }
      } catch (assignError) {
        console.warn('Auto-assignment failed during conversion:', assignError);
      }

      setCreatedCustomerId(customer.id);
      setStep('success');

      if (onSuccess) {
        onSuccess(customer.id, 'created');
      }
    } catch (err) {
      console.error('Error in handleCreateNew:', err);
      setError('Unerwarteter Fehler beim Erstellen des Kunden');
      setStep('error');
    }
  };

  const handleLinkExisting = async () => {
    if (!request || !selectedCustomer) return;

    setStep('processing');

    try {
      // Update request with customer reference
      const { error: requestError } = await supabase
        .from('contact_requests')
        .update({
          converted_to_customer_id: selectedCustomer.id,
          status: 'converted',
          updated_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (requestError) {
        console.error('Error linking to customer:', requestError);
        setError(`Fehler beim Verknüpfen mit Kunde: ${requestError.message}`);
        setStep('error');
        return;
      }

      // Auto-assign to current user when converting
      try {
        const assignResponse = await fetch(`/api/requests/${request.id}/assign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ selfAssign: true })
        });

        if (!assignResponse.ok) {
          console.warn('Auto-assignment failed during conversion, but conversion was successful');
        }
      } catch (assignError) {
        console.warn('Auto-assignment failed during conversion:', assignError);
      }

      setStep('success');

      if (onSuccess) {
        onSuccess(selectedCustomer.id, 'linked');
      }
    } catch (err) {
      console.error('Error in handleLinkExisting:', err);
      setError('Unerwarteter Fehler beim Verknüpfen');
      setStep('error');
    }
  };

  const handleViewCustomer = () => {
    const customerId = selectedCustomer?.id || createdCustomerId || convertedCustomerId;
    if (customerId) {
      router.push(`/dashboard/customers/${customerId}`);
      onOpenChange(false);
    }
  };

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto modern-card border-0 mx-4">
        <DialogHeader className="pb-4 sm:pb-6 border-b border-white/[0.08]">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
              <UserPlus className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg sm:text-2xl font-bold leading-tight">Anfrage zu Kunde konvertieren</DialogTitle>
              <DialogDescription className="text-sm sm:text-base mt-1 line-clamp-2">
                {request.subject} → Kunde erstellen oder verknüpfen
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Request Info Card */}
        <div className="p-4 bg-background/30 rounded-lg border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-400" />
              <span className="font-medium">{request.name}</span>
            </div>
            <ContactRequestStatusBadge status={request.status || 'new'} size="sm" />
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-muted-foreground text-xs sm:text-sm font-medium min-w-fit">E-Mail:</span>
              <span className="text-xs sm:text-sm break-all">{request.email}</span>
            </div>
            {request.company && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="text-muted-foreground text-xs sm:text-sm font-medium min-w-fit">Firma:</span>
                <span className="text-xs sm:text-sm truncate">{request.company}</span>
              </div>
            )}
            {request.phone && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="text-muted-foreground text-xs sm:text-sm font-medium min-w-fit">Telefon:</span>
                <span className="text-xs sm:text-sm">{request.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          {/* Checking Step */}
          {step === 'checking' && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-500" />
              <p className="font-medium">Prüfe bestehende Kunden...</p>
              <p className="text-sm text-muted-foreground">
                Suche nach ähnlichen Einträgen im System
              </p>
            </div>
          )}

          {/* Decision Step */}
          {step === 'decision' && (
            <div className="space-y-6">
              {existingCustomers.length > 0 && (
                <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    <span className="font-medium text-yellow-400">Mögliche Duplikate gefunden</span>
                  </div>
                  <p className="text-xs sm:text-sm text-yellow-300 mb-4 break-words">
                    Es wurden {existingCustomers.length} ähnliche Kunden gefunden.
                    Möchten Sie mit einem bestehenden Kunden verknüpfen oder einen neuen erstellen?
                  </p>

                  {/* Existing Customers List */}
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {existingCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        onClick={() => setSelectedCustomer(customer)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedCustomer?.id === customer.id
                            ? 'border-purple-500/50 bg-purple-500/10'
                            : 'border-white/10 hover:border-white/20 bg-background/30'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{customer.company_name}</p>
                            <p className="text-sm text-muted-foreground truncate">{customer.email}</p>
                          </div>
                          {customer.contact_person && (
                            <span className="text-sm text-muted-foreground truncate">{customer.contact_person}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setAction('create');
                    setStep('form');
                  }}
                  className="h-16 flex flex-col gap-2 hover:bg-green-500/10 hover:border-green-500/20"
                >
                  <UserPlus className="w-6 h-6" />
                  <div className="text-center">
                    <div className="font-medium">Neuen Kunden erstellen</div>
                    <div className="text-xs text-muted-foreground">Neuen Eintrag im CRM anlegen</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    if (!selectedCustomer) {
                      setError('Bitte wählen Sie einen Kunden zum Verknüpfen aus');
                      return;
                    }
                    setAction('link');
                    handleLinkExisting();
                  }}
                  disabled={existingCustomers.length === 0}
                  className="h-16 flex flex-col gap-2 hover:bg-blue-500/10 hover:border-blue-500/20"
                >
                  <LinkIcon className="w-6 h-6" />
                  <div className="text-center">
                    <div className="font-medium">Mit bestehendem verknüpfen</div>
                    <div className="text-xs text-muted-foreground">
                      {selectedCustomer ? selectedCustomer.company_name : 'Kunden auswählen'}
                    </div>
                  </div>
                </Button>
              </div>
            </div>
          )}

          {/* Form Step */}
          {step === 'form' && action === 'create' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-green-500" />
                </div>
                <h3 className="font-semibold text-lg">Neuen Kunden erstellen</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Firmenname *</label>
                  <Input
                    placeholder="Firmenname eingeben"
                    value={formData.company_name}
                    onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                    className="focus-ring"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Ansprechpartner *</label>
                  <Input
                    placeholder="Name der Kontaktperson"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                    className="focus-ring"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">E-Mail *</label>
                  <Input
                    type="email"
                    placeholder="E-Mail Adresse"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="focus-ring"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Telefon</label>
                  <Input
                    type="tel"
                    placeholder="Telefonnummer"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="focus-ring"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notizen</label>
                <textarea
                  className="w-full min-h-24 px-3 py-2 rounded-md border border-white/[0.08] bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
                  placeholder="Zusätzliche Notizen zur Konvertierung"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 border-t border-white/[0.08]">
                <Button
                  variant="outline"
                  onClick={() => setStep('decision')}
                  className="w-full sm:w-auto"
                >
                  Zurück
                </Button>
                <Button
                  onClick={handleCreateNew}
                  disabled={!formData.contact_person || !formData.email}
                  className="mystery-button w-full sm:w-auto"
                >
                  Kunde erstellen
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Processing Step */}
          {step === 'processing' && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-500" />
              <p className="font-medium">
                {action === 'create' ? 'Erstelle neuen Kunden...' : 'Verknüpfe mit bestehendem Kunden...'}
              </p>
              <p className="text-sm text-muted-foreground">
                Anfrage wird konvertiert und im CRM gespeichert
              </p>
            </div>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="font-semibold text-lg mb-2">
                {isAlreadyConverted ? 'Bereits konvertiert!' : 'Erfolgreich konvertiert!'}
              </h3>
              <p className="text-muted-foreground mb-6 text-sm sm:text-base text-center px-2">
                {isAlreadyConverted
                  ? `Diese Anfrage wurde bereits mit "${request?.converted_customer?.company_name || request?.converted_customer?.contact_person}" verknüpft.`
                  : action === 'create'
                    ? 'Neuer Kunde wurde erstellt und die Anfrage erfolgreich konvertiert.'
                    : `Anfrage wurde mit "${selectedCustomer?.company_name}" verknüpft.`
                }
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Schließen
                </Button>
                <Button
                  onClick={handleViewCustomer}
                  className="mystery-button"
                >
                  Kunde anzeigen
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Error Step */}
          {step === 'error' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-red-400">Fehler aufgetreten</h3>
              <p className="text-red-300 mb-6 text-sm sm:text-base text-center px-2 break-words">{error}</p>

              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Schließen
                </Button>
                <Button
                  onClick={() => {
                    setStep('checking');
                    setError(null);
                    checkExistingCustomers();
                  }}
                  className="mystery-button"
                >
                  Erneut versuchen
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
