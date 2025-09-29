'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Plus,
  User,
  Mail,
  Phone,
  Building,
  UserCheck,
  Shield,
  Loader2,
  Users
} from 'lucide-react';
import { ErrorDisplay } from '@/components/ui/error-display';

interface CreateUserModalProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onUserCreated?: (user: any) => void;
}

export function CreateUserModal({ trigger, open: externalOpen, onOpenChange, onUserCreated }: CreateUserModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState<'admin' | 'employee' | 'customer'>('employee');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    // Basic info
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    password: '',

    // Role specific
    userType: 'employee',

    // Employee specific
    jobTitle: '',
    department: '',
    employeeId: '',

    // Customer specific
    companyName: '',
    industry: '',
    website: ''
  });

  const resetForm = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      password: '',
      userType: 'employee',
      jobTitle: '',
      department: '',
      employeeId: '',
      companyName: '',
      industry: '',
      website: ''
    });
    setUserType('employee');
    setError(null);
    setSuccess(null);
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('E-Mail und Passwort sind erforderlich.');
      return false;
    }

    if (!formData.email.includes('@')) {
      setError('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Das Passwort muss mindestens 6 Zeichen lang sein.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userType: userType,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ein Fehler ist aufgetreten');
      }

      setSuccess('Benutzer wurde erfolgreich erstellt!');

      // Call callback if provided
      if (onUserCreated) {
        onUserCreated(result.user);
      }

      // Wait a moment to show success message, then reset and close
      setTimeout(() => {
        resetForm();
        setOpen(false);
        if (!onUserCreated) {
          window.location.reload();
        }
      }, 1500);

    } catch (error) {
      console.error('Error creating user:', error);
      setError(error instanceof Error ? error.message : 'Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
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

  const defaultTrigger = (
    <Button className="h-10">
      <Plus className="w-4 h-4 mr-2" />
      Neuer Benutzer
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Neuen Benutzer erstellen
          </DialogTitle>
          <DialogDescription>
            Füllen Sie die Informationen aus, um einen neuen Benutzer zu erstellen.
          </DialogDescription>
        </DialogHeader>

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
          {/* User Type Selection */}
          <div className="space-y-3">
            <Label>Benutzertyp</Label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'admin', label: 'Administrator', icon: Shield, color: 'border-red-500/20 bg-red-500/5' },
                { value: 'employee', label: 'Mitarbeiter', icon: UserCheck, color: 'border-blue-500/20 bg-blue-500/5' },
                { value: 'customer', label: 'Kunde', icon: Users, color: 'border-purple-500/20 bg-purple-500/5' }
              ].map((type) => {
                const Icon = type.icon;
                const isSelected = userType === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      setUserType(type.value as any);
                      updateFormData('userType', type.value);
                    }}
                    className={`p-4 rounded-lg border transition-all ${
                      isSelected
                        ? `${type.color} border-current`
                        : 'border-white/[0.08] hover:border-white/[0.15]'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-2 ${
                      isSelected ? 'text-current' : 'text-muted-foreground'
                    }`} />
                    <div className={`text-sm font-medium ${
                      isSelected ? 'text-current' : 'text-muted-foreground'
                    }`}>
                      {type.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Grunddaten</TabsTrigger>
              <TabsTrigger value="specific">Spezifische Daten</TabsTrigger>
            </TabsList>

            {/* Basic Information */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    E-Mail *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    placeholder="benutzer@beispiel.de"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Passwort *</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => updateFormData('password', e.target.value)}
                    placeholder="Temporäres Passwort"
                  />
                </div>

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
              </div>
            </TabsContent>

            {/* Specific Information */}
            <TabsContent value="specific" className="space-y-4">
              {userType === 'employee' && (
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
                        required={userType === 'employee'}
                        value={formData.jobTitle}
                        onChange={(e) => updateFormData('jobTitle', e.target.value)}
                        placeholder="z.B. Software Entwickler"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="department">Abteilung *</Label>
                      <Select onValueChange={(value) => updateFormData('department', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Abteilung wählen" />
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

              {userType === 'customer' && (
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
                        required={userType === 'customer'}
                        value={formData.companyName}
                        onChange={(e) => updateFormData('companyName', e.target.value)}
                        placeholder="Firmenname"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="industry">Branche</Label>
                      <Select onValueChange={(value) => updateFormData('industry', value)}>
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

              {userType === 'admin' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Shield className="w-4 h-4" />
                    Administrator-Konto
                  </div>
                  <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                    <p className="text-sm text-red-200">
                      Administrator-Konten haben vollen Zugriff auf das System.
                      Bitte stellen Sie sicher, dass Sie diesem Benutzer vertrauen.
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
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Wird erstellt...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Benutzer erstellen
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}