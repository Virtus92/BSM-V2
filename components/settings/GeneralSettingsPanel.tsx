'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  Building,
  Mail,
  Globe,
  User,
  Save,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import type { GeneralSettings } from '@/lib/settings-types';

interface GeneralSettingsPanelProps {
  settings: GeneralSettings;
  onUpdate: (key: string, value: any, dataType?: string) => Promise<void>;
  onChange: () => void;
  saving: boolean;
}

export function GeneralSettingsPanel({
  settings,
  onUpdate,
  onChange,
  saving
}: GeneralSettingsPanelProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<GeneralSettings>(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData(settings);
    setHasChanges(false);
  }, [settings]);

  const handleInputChange = (key: keyof GeneralSettings, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    onChange();

    // Clear validation error when user starts typing
    if (validationErrors[key]) {
      setValidationErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const validateField = (key: keyof GeneralSettings, value: string): string => {
    switch (key) {
      case 'site_name':
        if (!value.trim()) return 'Website-Name ist erforderlich';
        if (value.length < 2) return 'Website-Name muss mindestens 2 Zeichen lang sein';
        if (value.length > 100) return 'Website-Name darf maximal 100 Zeichen lang sein';
        break;
      case 'contact_email':
      case 'support_email':
        if (!value.trim()) return 'E-Mail-Adresse ist erforderlich';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Ungültige E-Mail-Adresse';
        break;
      case 'company_name':
        if (!value.trim()) return 'Firmenname ist erforderlich';
        if (value.length < 2) return 'Firmenname muss mindestens 2 Zeichen lang sein';
        break;
      case 'site_description':
        if (value.length > 500) return 'Beschreibung darf maximal 500 Zeichen lang sein';
        break;
    }
    return '';
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    Object.entries(formData).forEach(([key, value]) => {
      const error = validateField(key as keyof GeneralSettings, value);
      if (error) {
        errors[key] = error;
        isValid = false;
      }
    });

    setValidationErrors(errors);
    return isValid;
  };

  const handleSave = async (key: keyof GeneralSettings) => {
    const value = formData[key];
    const error = validateField(key, value);

    if (error) {
      setValidationErrors(prev => ({ ...prev, [key]: error }));
      return;
    }

    try {
      await onUpdate(key, value, 'string');
      setHasChanges(false);
      toast({
        title: 'Gespeichert',
        description: `${getFieldLabel(key)} wurde aktualisiert`,
      });
    } catch (error) {
      console.error('Error saving setting:', error);
      toast({
        title: 'Fehler',
        description: 'Einstellung konnte nicht gespeichert werden',
        variant: 'destructive'
      });
    }
  };

  const handleSaveAll = async () => {
    if (!validateForm()) {
      toast({
        title: 'Validierungsfehler',
        description: 'Bitte korrigieren Sie die fehlerhaften Eingaben',
        variant: 'destructive'
      });
      return;
    }

    try {
      const promises = Object.entries(formData).map(([key, value]) =>
        onUpdate(key, value, 'string')
      );
      await Promise.all(promises);
      setHasChanges(false);
      toast({
        title: 'Alle Einstellungen gespeichert',
        description: 'Grundeinstellungen wurden erfolgreich aktualisiert',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Fehler',
        description: 'Einstellungen konnten nicht gespeichert werden',
        variant: 'destructive'
      });
    }
  };

  const getFieldLabel = (key: keyof GeneralSettings): string => {
    const labels = {
      site_name: 'Website-Name',
      site_description: 'Website-Beschreibung',
      contact_email: 'Kontakt E-Mail',
      support_email: 'Support E-Mail',
      company_name: 'Firmenname'
    };
    return labels[key];
  };

  const getFieldIcon = (key: keyof GeneralSettings) => {
    const icons = {
      site_name: Globe,
      site_description: Globe,
      contact_email: Mail,
      support_email: Mail,
      company_name: Building
    };
    return icons[key];
  };

  const settingsFields = [
    {
      key: 'site_name' as keyof GeneralSettings,
      label: 'Website-Name',
      description: 'Name Ihrer Website, der in Titeln und der Navigation angezeigt wird',
      placeholder: 'z.B. BSM V2'
    },
    {
      key: 'site_description' as keyof GeneralSettings,
      label: 'Website-Beschreibung',
      description: 'Kurze Beschreibung für SEO und Metadaten',
      placeholder: 'z.B. Business Service Management Platform'
    },
    {
      key: 'company_name' as keyof GeneralSettings,
      label: 'Firmenname',
      description: 'Offizieller Name Ihres Unternehmens für rechtliche Dokumente',
      placeholder: 'z.B. BSM Solutions GmbH'
    },
    {
      key: 'contact_email' as keyof GeneralSettings,
      label: 'Kontakt E-Mail',
      description: 'Hauptkontakt-E-Mail-Adresse für allgemeine Anfragen',
      placeholder: 'z.B. info@example.com'
    },
    {
      key: 'support_email' as keyof GeneralSettings,
      label: 'Support E-Mail',
      description: 'E-Mail-Adresse für Support-Anfragen',
      placeholder: 'z.B. support@example.com'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      {hasChanges && (
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <span className="text-sm">Sie haben ungespeicherte Änderungen</span>
              </div>
              <Button
                onClick={handleSaveAll}
                disabled={saving}
                size="sm"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Alle speichern
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings Fields */}
      <div className="grid gap-6">
        {settingsFields.map((field) => {
          const Icon = getFieldIcon(field.key);
          const hasError = !!validationErrors[field.key];
          const isChanged = formData[field.key] !== settings[field.key];

          return (
            <Card key={field.key} className={hasError ? 'border-red-500/20' : ''}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {field.label}
                  {isChanged && (
                    <Badge variant="secondary" className="text-xs">
                      Geändert
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {field.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={field.key}>
                    {field.label}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id={field.key}
                      value={formData[field.key]}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className={hasError ? 'border-red-500' : ''}
                    />
                    <Button
                      onClick={() => handleSave(field.key)}
                      disabled={saving || !isChanged || hasError}
                      size="sm"
                      variant="outline"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {hasError && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {validationErrors[field.key]}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Information Box */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Globe className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Hinweis zu Grundeinstellungen</p>
              <p className="text-sm text-muted-foreground">
                Diese Einstellungen werden in der gesamten Anwendung verwendet und können
                die SEO-Performance sowie die Benutzererfahrung beeinflussen. Stellen Sie
                sicher, dass alle Informationen korrekt und aktuell sind.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}