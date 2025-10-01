'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/use-toast';
import {
  FileText,
  Shield,
  Cookie,
  Calendar,
  Save,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Info,
  Scale
} from 'lucide-react';
import type { LegalSettings } from '@/lib/settings-types';

interface LegalSettingsPanelProps {
  settings: LegalSettings;
  onUpdate: (key: string, value: any, dataType?: string) => Promise<void>;
  onChange: () => void;
  saving: boolean;
}

export function LegalSettingsPanel({
  settings,
  onUpdate,
  onChange,
  saving
}: LegalSettingsPanelProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<LegalSettings>(settings);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setFormData(settings);
    setHasChanges(false);
  }, [settings]);

  const handleBooleanChange = async (key: keyof LegalSettings, value: boolean) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    onChange();

    try {
      await onUpdate(key, value, 'boolean');
      toast({
        title: 'Gespeichert',
        description: `${getFieldLabel(key)} wurde ${value ? 'aktiviert' : 'deaktiviert'}`,
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

  const handleNumberChange = (key: keyof LegalSettings, value: number) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    onChange();
  };

  const handleSaveNumber = async (key: keyof LegalSettings) => {
    try {
      await onUpdate(key, formData[key], 'number');
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

  const getFieldLabel = (key: keyof LegalSettings): string => {
    const labels = {
      gdpr_enabled: 'GDPR-Compliance',
      cookie_consent_required: 'Cookie-Einverständnis',
      data_retention_days: 'Datenspeicherung'
    };
    return labels[key];
  };

  const getComplianceStatus = () => {
    const enabledFeatures = [
      formData.gdpr_enabled,
      formData.cookie_consent_required
    ].filter(Boolean).length;

    if (enabledFeatures === 2) {
      return { status: 'Vollständig konform', color: 'text-green-600', variant: 'default' as const };
    } else if (enabledFeatures === 1) {
      return { status: 'Teilweise konform', color: 'text-yellow-600', variant: 'secondary' as const };
    } else {
      return { status: 'Nicht konform', color: 'text-red-600', variant: 'destructive' as const };
    }
  };

  const formatRetentionPeriod = (days: number) => {
    if (days < 30) {
      return `${days} Tage`;
    } else if (days < 365) {
      const months = Math.round(days / 30);
      return `${months} Monat${months > 1 ? 'e' : ''}`;
    } else {
      const years = Math.round(days / 365);
      return `${years} Jahr${years > 1 ? 'e' : ''}`;
    }
  };

  const complianceStatus = getComplianceStatus();

  return (
    <div className="space-y-6">
      {/* Compliance Overview */}
      <Card className={complianceStatus.variant === 'default' ? 'border-green-500/20 bg-green-500/5' :
                       complianceStatus.variant === 'secondary' ? 'border-yellow-500/20 bg-yellow-500/5' :
                       'border-red-500/20 bg-red-500/5'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5" />
            Compliance-Status
            <Badge variant={complianceStatus.variant} className={complianceStatus.color}>
              {complianceStatus.status}
            </Badge>
          </CardTitle>
          <CardDescription>
            Überblick über Ihre rechtlichen Compliance-Einstellungen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${formData.gdpr_enabled ? 'text-green-600' : 'text-gray-400'}`}>
                {formData.gdpr_enabled ? '✓' : '✗'}
              </div>
              <p className="text-sm font-medium">GDPR</p>
              <p className="text-xs text-muted-foreground">Datenschutz-Grundverordnung</p>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${formData.cookie_consent_required ? 'text-green-600' : 'text-gray-400'}`}>
                {formData.cookie_consent_required ? '✓' : '✗'}
              </div>
              <p className="text-sm font-medium">Cookies</p>
              <p className="text-xs text-muted-foreground">Einverständnis erforderlich</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatRetentionPeriod(formData.data_retention_days)}
              </div>
              <p className="text-sm font-medium">Speicherdauer</p>
              <p className="text-xs text-muted-foreground">Datenaufbewahrung</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GDPR Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            GDPR-Compliance
            <Badge
              variant={formData.gdpr_enabled ? 'default' : 'secondary'}
              className={formData.gdpr_enabled ? 'text-green-600' : 'text-gray-600'}
            >
              {formData.gdpr_enabled ? 'Aktiv' : 'Inaktiv'}
            </Badge>
          </CardTitle>
          <CardDescription>
            Aktivieren Sie GDPR-Compliance-Features für EU-Datenschutz-Grundverordnung.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="gdpr-enabled">GDPR-Features aktivieren</Label>
              <p className="text-sm text-muted-foreground">
                Aktiviert Datenschutz-Features, Auskunftsrechte und Datenportabilität
              </p>
            </div>
            <Switch
              id="gdpr-enabled"
              checked={formData.gdpr_enabled}
              onCheckedChange={(checked) => handleBooleanChange('gdpr_enabled', checked)}
              disabled={saving}
            />
          </div>

          {formData.gdpr_enabled && (
            <Card className="border-green-500/20 bg-green-500/5">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>GDPR-Compliance aktiviert</span>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>Recht auf Auskunft über gespeicherte Daten</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>Recht auf Berichtigung von Daten</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>Recht auf Löschung (Recht auf Vergessenwerden)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>Recht auf Datenportabilität</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Cookie Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cookie className="w-5 h-5" />
            Cookie-Einstellungen
            <Badge
              variant={formData.cookie_consent_required ? 'default' : 'secondary'}
              className={formData.cookie_consent_required ? 'text-green-600' : 'text-gray-600'}
            >
              {formData.cookie_consent_required ? 'Aktiv' : 'Inaktiv'}
            </Badge>
          </CardTitle>
          <CardDescription>
            Konfigurieren Sie Cookie-Einverständnis-Banner und -Verwaltung.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="cookie-consent">Cookie-Einverständnis erforderlich</Label>
              <p className="text-sm text-muted-foreground">
                Zeigt Cookie-Banner an und verwaltet Benutzereinwilligung
              </p>
            </div>
            <Switch
              id="cookie-consent"
              checked={formData.cookie_consent_required}
              onCheckedChange={(checked) => handleBooleanChange('cookie_consent_required', checked)}
              disabled={saving}
            />
          </div>

          {formData.cookie_consent_required && (
            <Card className="border-blue-500/20 bg-blue-500/5">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Info className="w-4 h-4" />
                    <span>Cookie-Einverständnis aktiviert</span>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-blue-500" />
                      <span>Cookie-Banner wird bei erstem Besuch angezeigt</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-blue-500" />
                      <span>Kategorisierung von Cookies (erforderlich, Marketing, Analytics)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-blue-500" />
                      <span>Benutzer können Einverständnis widerrufen</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Data Retention Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Datenspeicherung
          </CardTitle>
          <CardDescription>
            Legen Sie fest, wie lange Benutzerdaten gespeichert werden.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="data-retention">
                Speicherdauer: {formatRetentionPeriod(formData.data_retention_days)}
              </Label>
              <p className="text-sm text-muted-foreground">
                Standardzeitraum für die Aufbewahrung von Benutzerdaten (30-1095 Tage)
              </p>
            </div>

            <div className="space-y-3">
              <Slider
                id="data-retention"
                min={30}
                max={1095}
                step={30}
                value={[formData.data_retention_days]}
                onValueChange={([value]) => handleNumberChange('data_retention_days', value)}
                className="w-full"
                disabled={saving}
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Aktuell: {formatRetentionPeriod(formData.data_retention_days)}
                  </span>
                </div>

                <Button
                  onClick={() => handleSaveNumber('data_retention_days')}
                  disabled={saving || formData.data_retention_days === settings.data_retention_days}
                  size="sm"
                  variant="outline"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
              <div className="text-center">
                <div>30 Tage</div>
                <div>Minimal</div>
              </div>
              <div className="text-center">
                <div>365 Tage</div>
                <div>Standard</div>
              </div>
              <div className="text-center">
                <div>730 Tage</div>
                <div>Erweitert</div>
              </div>
              <div className="text-center">
                <div>1095 Tage</div>
                <div>Maximum</div>
              </div>
            </div>
          </div>

          {/* Retention Policy Info */}
          <Card className="border-yellow-500/20 bg-yellow-500/5">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-sm text-yellow-600">
                <AlertTriangle className="w-4 h-4" />
                <span>Wichtiger Hinweis zur Datenspeicherung</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Diese Einstellung legt die Standard-Aufbewahrungszeit fest. Bestimmte Daten
                können aufgrund gesetzlicher Anforderungen länger gespeichert werden müssen.
                Benutzer können ihre Daten jederzeit löschen lassen, wenn GDPR aktiviert ist.
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Legal Documents Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Rechtsdokumente
          </CardTitle>
          <CardDescription>
            Verwalten Sie Datenschutzerklärung, AGB und andere rechtliche Dokumente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-dashed">
              <CardContent className="p-4 text-center">
                <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="font-medium">Datenschutzerklärung</p>
                <p className="text-sm text-muted-foreground mb-2">
                  Aktualisiert: Nie
                </p>
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Bearbeiten
                </Button>
              </CardContent>
            </Card>

            <Card className="border-dashed">
              <CardContent className="p-4 text-center">
                <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="font-medium">Allgemeine Geschäftsbedingungen</p>
                <p className="text-sm text-muted-foreground mb-2">
                  Aktualisiert: Nie
                </p>
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Bearbeiten
                </Button>
              </CardContent>
            </Card>

            <Card className="border-dashed">
              <CardContent className="p-4 text-center">
                <Cookie className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="font-medium">Cookie-Richtlinie</p>
                <p className="text-sm text-muted-foreground mb-2">
                  Aktualisiert: Nie
                </p>
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Bearbeiten
                </Button>
              </CardContent>
            </Card>

            <Card className="border-dashed">
              <CardContent className="p-4 text-center">
                <Scale className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="font-medium">Impressum</p>
                <p className="text-sm text-muted-foreground mb-2">
                  Aktualisiert: Nie
                </p>
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Bearbeiten
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Summary */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Scale className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Rechtlicher Compliance-Status</p>
              <p className="text-sm text-muted-foreground">
                Stellen Sie sicher, dass alle relevanten Compliance-Features für Ihr
                Zielgebiet aktiviert sind. EU-Nutzer benötigen GDPR und Cookie-Consent.
              </p>
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <div>GDPR: <span className="font-medium">{formData.gdpr_enabled ? 'Aktiviert' : 'Deaktiviert'}</span></div>
                <div>Cookie-Consent: <span className="font-medium">{formData.cookie_consent_required ? 'Erforderlich' : 'Optional'}</span></div>
                <div>Datenspeicherung: <span className="font-medium">{formatRetentionPeriod(formData.data_retention_days)}</span></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}