'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit, Save, User, Building, Settings } from 'lucide-react';
import { ErrorDisplay } from '@/components/ui/error-display';

interface CompleteUserData {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  profile?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    user_type: string;
    avatar_url?: string;
    is_active?: boolean;
    last_seen_at?: string;
    timezone?: string;
    language?: string;
    notifications_enabled?: boolean;
  };
  customer?: {
    id: string;
    company_name?: string;
    contact_person?: string;
    phone?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    postal_code?: string;
    country?: string;
    website?: string;
    industry?: string;
    created_at: string;
  };
  employee?: {
    id: string;
    employee_id?: string;
    job_title?: string;
    hire_date?: string;
    direct_phone?: string;
    emergency_contact?: string;
    emergency_phone?: string;
    working_hours_per_week?: number;
    time_zone?: string;
    skills?: string[];
    certifications?: string[];
    languages?: string[];
    performance_rating?: number;
    is_active?: boolean;
    department?: {
      id: string;
      name: string;
    };
  };
}

interface UserEditModalProps {
  user: CompleteUserData;
  onSave?: (data: any) => Promise<void>;
  trigger?: React.ReactNode;
}

export function UserEditModal({ user, onSave, trigger }: UserEditModalProps) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    // Basic Info
    first_name: user.profile?.first_name || '',
    last_name: user.profile?.last_name || '',
    email: user.email,
    phone: user.profile?.phone || '',
    user_type: user.profile?.user_type || 'customer',
    is_active: user.profile?.is_active !== false,
    notifications_enabled: user.profile?.notifications_enabled !== false,
    timezone: user.profile?.timezone || 'Europe/Berlin',
    language: user.profile?.language || 'de',

    // Employee specific
    employee_id: user.employee?.employee_id || '',
    job_title: user.employee?.job_title || '',
    hire_date: user.employee?.hire_date || '',
    direct_phone: user.employee?.direct_phone || '',
    emergency_contact: user.employee?.emergency_contact || '',
    emergency_phone: user.employee?.emergency_phone || '',
    working_hours_per_week: user.employee?.working_hours_per_week || 40,
    performance_rating: user.employee?.performance_rating || 0,

    // Customer specific
    company_name: user.customer?.company_name || '',
    contact_person: user.customer?.contact_person || '',
    customer_phone: user.customer?.phone || '',
    address_line1: user.customer?.address_line1 || '',
    address_line2: user.customer?.address_line2 || '',
    city: user.customer?.city || '',
    postal_code: user.customer?.postal_code || '',
    country: user.customer?.country || 'Deutschland',
    website: user.customer?.website || '',
    industry: user.customer?.industry || '',
  });

  const validateForm = () => {
    if (!formData.first_name && !formData.last_name) {
      setError('Bitte geben Sie mindestens einen Namen ein.');
      return false;
    }

    if (formData.email && !formData.email.includes('@')) {
      setError('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      // Use the provided onSave function or default API call
      if (onSave) {
        await onSave(formData);
      } else {
        const response = await fetch(`/api/users/${user.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Fehler beim Speichern der Daten');
        }

        setSuccess('Benutzerdaten wurden erfolgreich aktualisiert.');
      }

      // Wait a moment to show success message, then close and reload
      setTimeout(() => {
        setOpen(false);
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error('Error saving user:', error);
      setError(error instanceof Error ? error.message : 'Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setIsSaving(false);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="flex items-center gap-2 whitespace-nowrap">
      <Edit className="w-4 h-4" />
      Bearbeiten
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="modern-card max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Benutzer bearbeiten
          </DialogTitle>
          <DialogDescription>
            Bearbeiten Sie die Benutzerdaten. Änderungen werden sofort übernommen.
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

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Grunddaten</TabsTrigger>
            {user.profile?.user_type === 'employee' && (
              <TabsTrigger value="employee">Mitarbeiter</TabsTrigger>
            )}
            {user.profile?.user_type === 'customer' && (
              <TabsTrigger value="customer">Kunde</TabsTrigger>
            )}
            <TabsTrigger value="settings">Einstellungen</TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Vorname</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Nachname</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user_type">Benutzertyp</Label>
                <Select
                  value={formData.user_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, user_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Kunde</SelectItem>
                    <SelectItem value="employee">Mitarbeiter</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: !!checked }))}
                />
                <Label htmlFor="is_active">Account aktiv</Label>
              </div>
            </div>
          </TabsContent>

          {/* Employee Information Tab */}
          {user.profile?.user_type === 'employee' && (
            <TabsContent value="employee" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employee_id">Mitarbeiter-ID</Label>
                  <Input
                    id="employee_id"
                    value={formData.employee_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, employee_id: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job_title">Position</Label>
                  <Input
                    id="job_title"
                    value={formData.job_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hire_date">Einstellungsdatum</Label>
                  <Input
                    id="hire_date"
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, hire_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="direct_phone">Durchwahl</Label>
                  <Input
                    id="direct_phone"
                    value={formData.direct_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, direct_phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact">Notfallkontakt</Label>
                  <Input
                    id="emergency_contact"
                    value={formData.emergency_contact}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_phone">Notfall-Telefon</Label>
                  <Input
                    id="emergency_phone"
                    value={formData.emergency_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergency_phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="working_hours">Wochenstunden</Label>
                  <Input
                    id="working_hours"
                    type="number"
                    min="1"
                    max="60"
                    value={formData.working_hours_per_week}
                    onChange={(e) => setFormData(prev => ({ ...prev, working_hours_per_week: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="performance_rating">Performance (1-5)</Label>
                  <Input
                    id="performance_rating"
                    type="number"
                    min="1"
                    max="5"
                    value={formData.performance_rating}
                    onChange={(e) => setFormData(prev => ({ ...prev, performance_rating: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
            </TabsContent>
          )}

          {/* Customer Information Tab */}
          {user.profile?.user_type === 'customer' && (
            <TabsContent value="customer" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Unternehmen</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_person">Ansprechpartner</Label>
                  <Input
                    id="contact_person"
                    value={formData.contact_person}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_phone">Telefon (Unternehmen)</Label>
                  <Input
                    id="customer_phone"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Branche</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_line1">Adresse</Label>
                  <Input
                    id="address_line1"
                    value={formData.address_line1}
                    onChange={(e) => setFormData(prev => ({ ...prev, address_line1: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_line2">Adresse 2</Label>
                  <Input
                    id="address_line2"
                    value={formData.address_line2}
                    onChange={(e) => setFormData(prev => ({ ...prev, address_line2: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Stadt</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal_code">PLZ</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Land</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  />
                </div>
              </div>
            </TabsContent>
          )}

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timezone">Zeitzone</Label>
                <Select
                  value={formData.timezone}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Europe/Berlin">Europe/Berlin</SelectItem>
                    <SelectItem value="Europe/Vienna">Europe/Vienna</SelectItem>
                    <SelectItem value="Europe/Zurich">Europe/Zurich</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Sprache</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notifications_enabled"
                  checked={formData.notifications_enabled}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, notifications_enabled: !!checked }))}
                />
                <Label htmlFor="notifications_enabled">E-Mail-Benachrichtigungen aktiviert</Label>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Speichert...' : 'Speichern'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}