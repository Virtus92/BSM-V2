'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Edit,
  User,
  Mail,
  Phone,
  Building,
  UserCheck,
  Shield,
  Loader2,
  Users,
  Save
} from 'lucide-react';
import { ErrorDisplay } from '@/components/ui/error-display';

interface User {
  id: string;
  email: string;
  profile?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    user_type: string;
    is_active?: boolean;
  };
  customer?: {
    id: string;
    company_name: string;
    contact_person: string;
    phone?: string;
    industry?: string;
    website?: string;
  };
  employee?: {
    id: string;
    employee_id?: string;
    job_title?: string;
    department?: {
      name: string;
    };
  };
}

interface EditUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onUserUpdated: (user: User) => void;
}

export function EditUserModal({ open, onOpenChange, user, onUserUpdated }: EditUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    // Basic info
    firstName: '',
    lastName: '',
    phone: '',
    is_active: true,

    // Employee specific
    jobTitle: '',
    department: '',
    employeeId: '',

    // Customer specific
    companyName: '',
    industry: '',
    website: ''
  });

  // Initialize form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.profile?.first_name || '',
        lastName: user.profile?.last_name || '',
        phone: user.profile?.phone || user.customer?.phone || '',
        is_active: user.profile?.is_active !== false,
        jobTitle: user.employee?.job_title || '',
        department: user.employee?.department?.name || '',
        employeeId: user.employee?.employee_id || '',
        companyName: user.customer?.company_name || '',
        industry: user.customer?.industry || '',
        website: user.customer?.website || ''
      });
      setError(null);
      setSuccess(null);
    }
  }, [user]);

  const validateForm = () => {
    if (!formData.firstName || !formData.lastName) {
      setError('Vor- und Nachname sind erforderlich.');
      return false;
    }

    if (user?.profile?.user_type === 'employee' && !formData.jobTitle) {
      setError('Position ist für Mitarbeiter erforderlich.');
      return false;
    }

    if (user?.profile?.user_type === 'customer' && !formData.companyName) {
      setError('Firmenname ist für Kunden erforderlich.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!user || !validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          is_active: formData.is_active,
          user_type: user?.profile?.user_type, // Important: preserve user_type
          // Employee specific
          job_title: formData.jobTitle,
          department: formData.department,
          employee_id: formData.employeeId,
          // Customer specific
          company_name: formData.companyName,
          industry: formData.industry,
          website: formData.website
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ein Fehler ist aufgetreten');
      }

      setSuccess('Benutzer wurde erfolgreich aktualisiert!');
      onUserUpdated(result.user);

      // Wait a moment to show success message, then close
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);

    } catch (error) {
      console.error('Error updating user:', error);
      setError(error instanceof Error ? error.message : 'Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getUserTypeIcon = (type: string) => {
    switch (type) {
      case 'admin': return Shield;
      case 'employee': return UserCheck;
      case 'customer': return Users;
      default: return User;
    }
  };

  const getUserTypeColor = (type: string) => {
    switch (type) {
      case 'admin': return 'text-red-500';
      case 'employee': return 'text-blue-500';
      case 'customer': return 'text-purple-500';
      default: return 'text-gray-500';
    }
  };

  if (!user) return null;

  const UserTypeIcon = getUserTypeIcon(user.profile?.user_type || '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Benutzer bearbeiten
          </DialogTitle>
          <DialogDescription>
            Bearbeiten Sie die Informationen für {user.profile?.first_name} {user.profile?.last_name}
          </DialogDescription>
        </DialogHeader>

        {/* User Type Display */}
        <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/10">
          <UserTypeIcon className={`w-5 h-5 ${getUserTypeColor(user.profile?.user_type || '')}`} />
          <div>
            <div className="font-medium text-white">{user.email}</div>
            <div className="text-sm text-white/70 capitalize">
              {user.profile?.user_type || 'Unbekannt'}
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <ErrorDisplay
            type="error"
            message={error}
            onClose={() => setError(null)}
          />
        )}
        {success && (
          <ErrorDisplay
            type="success"
            message={success}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Grunddaten</TabsTrigger>
              <TabsTrigger value="specific">Spezifische Daten</TabsTrigger>
            </TabsList>

            {/* Basic Information */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Vorname *</Label>
                  <Input
                    id="firstName"
                    required
                    value={formData.firstName}
                    onChange={(e) => updateFormData('firstName', e.target.value)}
                    placeholder="Vorname"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Nachname *</Label>
                  <Input
                    id="lastName"
                    required
                    value={formData.lastName}
                    onChange={(e) => updateFormData('lastName', e.target.value)}
                    placeholder="Nachname"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Telefon
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    placeholder="+49 123 456789"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.is_active ? 'active' : 'inactive'}
                    onValueChange={(value) => updateFormData('is_active', value === 'active')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktiv</SelectItem>
                      <SelectItem value="inactive">Inaktiv</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* Specific Information */}
            <TabsContent value="specific" className="space-y-4">
              {user.profile?.user_type === 'employee' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <UserCheck className="w-4 h-4" />
                    Mitarbeiterinformationen
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="jobTitle">Position *</Label>
                      <Input
                        id="jobTitle"
                        required
                        value={formData.jobTitle}
                        onChange={(e) => updateFormData('jobTitle', e.target.value)}
                        placeholder="z.B. Software Entwickler"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="department">Abteilung</Label>
                      <Select onValueChange={(value) => updateFormData('department', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder={formData.department || "Abteilung wählen"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IT">IT</SelectItem>
                          <SelectItem value="Sales">Vertrieb</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                          <SelectItem value="Support">Support</SelectItem>
                          <SelectItem value="HR">Personal</SelectItem>
                          <SelectItem value="Finance">Finanzen</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="employeeId">Mitarbeiter-ID</Label>
                      <Input
                        id="employeeId"
                        value={formData.employeeId}
                        onChange={(e) => updateFormData('employeeId', e.target.value)}
                        placeholder="z.B. EMP001"
                      />
                    </div>
                  </div>
                </div>
              )}

              {user.profile?.user_type === 'customer' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Building className="w-4 h-4" />
                    Kundeninformationen
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Firmenname *</Label>
                      <Input
                        id="companyName"
                        required
                        value={formData.companyName}
                        onChange={(e) => updateFormData('companyName', e.target.value)}
                        placeholder="Firmenname"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="industry">Branche</Label>
                      <Select
                        value={formData.industry}
                        onValueChange={(value) => updateFormData('industry', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Branche wählen" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Technology">Technologie</SelectItem>
                          <SelectItem value="Healthcare">Gesundheitswesen</SelectItem>
                          <SelectItem value="Finance">Finanzen</SelectItem>
                          <SelectItem value="Retail">Einzelhandel</SelectItem>
                          <SelectItem value="Manufacturing">Fertigung</SelectItem>
                          <SelectItem value="Education">Bildung</SelectItem>
                          <SelectItem value="Other">Sonstiges</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => updateFormData('website', e.target.value)}
                        placeholder="https://beispiel.de"
                      />
                    </div>
                  </div>
                </div>
              )}

              {user.profile?.user_type === 'admin' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Shield className="w-4 h-4" />
                    Administrator-Konto
                  </div>
                  <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                    <p className="text-sm text-red-200">
                      Für Administrator-Konten können nur Grunddaten bearbeitet werden.
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Footer Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 space-y-2 space-y-reverse sm:space-y-0 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Wird aktualisiert...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Änderungen speichern
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}