'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  Globe,
  Type,
  MousePointer,
  DollarSign,
  Save,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Eye,
  ExternalLink
} from 'lucide-react';
import type { LandingSettings } from '@/lib/settings-types';

interface LandingPageSettingsPanelProps {
  settings: LandingSettings;
  onUpdate: (key: string, value: any, dataType?: string) => Promise<void>;
  onChange: () => void;
  saving: boolean;
}

export function LandingPageSettingsPanel({
  settings,
  onUpdate,
  onChange,
  saving
}: LandingPageSettingsPanelProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<LandingSettings>(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData(settings);
    setHasChanges(false);
  }, [settings]);

  const handleInputChange = (key: keyof LandingSettings, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    onChange();

    // Clear validation error when user starts typing
    if (validationErrors[key]) {
      setValidationErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const handleBooleanChange = async (key: keyof LandingSettings, value: boolean) => {
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

  const validateField = (key: keyof LandingSettings, value: string): string => {
    switch (key) {
      case 'hero_title':
        if (!value.trim()) return 'Hero-Titel ist erforderlich';
        if (value.length < 10) return 'Hero-Titel sollte mindestens 10 Zeichen lang sein';
        if (value.length > 100) return 'Hero-Titel darf maximal 100 Zeichen lang sein';
        break;
      case 'hero_subtitle':
        if (!value.trim()) return 'Hero-Untertitel ist erforderlich';
        if (value.length < 20) return 'Hero-Untertitel sollte mindestens 20 Zeichen lang sein';
        if (value.length > 300) return 'Hero-Untertitel darf maximal 300 Zeichen lang sein';
        break;
      case 'cta_button_text':
        if (!value.trim()) return 'Button-Text ist erforderlich';
        if (value.length < 3) return 'Button-Text sollte mindestens 3 Zeichen lang sein';
        if (value.length > 30) return 'Button-Text darf maximal 30 Zeichen lang sein';
        break;
    }
    return '';
  };

  const handleSave = async (key: keyof LandingSettings) => {
    const value = formData[key];

    if (typeof value === 'string') {
      const error = validateField(key, value);
      if (error) {
        setValidationErrors(prev => ({ ...prev, [key]: error }));
        return;
      }
    }

    try {
      const dataType = typeof value === 'boolean' ? 'boolean' : 'string';
      await onUpdate(key, value, dataType);
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

  const getFieldLabel = (key: keyof LandingSettings): string => {
    const labels = {
      hero_title: 'Hero-Titel',
      hero_subtitle: 'Hero-Untertitel',
      cta_button_text: 'CTA-Button Text',
      show_pricing: 'Preise anzeigen'
    };
    return labels[key];
  };

  const getFieldIcon = (key: keyof LandingSettings) => {
    const icons = {
      hero_title: Type,
      hero_subtitle: Type,
      cta_button_text: MousePointer,
      show_pricing: DollarSign
    };
    return icons[key];
  };

  const stringFields = [
    {
      key: 'hero_title' as keyof LandingSettings,
      label: 'Hero-Titel',
      description: 'Hauptüberschrift auf der Startseite',
      placeholder: 'z.B. Moderne Business Service Management Lösung',
      multiline: false
    },
    {
      key: 'hero_subtitle' as keyof LandingSettings,
      label: 'Hero-Untertitel',
      description: 'Beschreibender Text unter der Hauptüberschrift',
      placeholder: 'z.B. Optimieren Sie Ihre Geschäftsprozesse mit unserer fortschrittlichen Plattform',
      multiline: true
    },
    {
      key: 'cta_button_text' as keyof LandingSettings,
      label: 'Call-to-Action Button',
      description: 'Text für den Hauptaktionsbutton',
      placeholder: 'z.B. Jetzt starten',
      multiline: false
    }
  ];

  return (
    <div className="space-y-6">
      {/* Hero Section Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="w-5 h-5" />
            Hero-Bereich
          </CardTitle>
          <CardDescription>
            Konfigurieren Sie den Hauptbereich Ihrer Landingpage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {stringFields.map((field) => {
            const Icon = getFieldIcon(field.key);
            const hasError = !!validationErrors[field.key];
            const isChanged = formData[field.key] !== settings[field.key];

            return (
              <div key={field.key} className="space-y-3">
                <Label htmlFor={field.key} className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {field.label}
                  {isChanged && (
                    <Badge variant="secondary" className="text-xs">
                      Geändert
                    </Badge>
                  )}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {field.description}
                </p>

                <div className="flex gap-2">
                  {field.multiline ? (
                    <Textarea
                      id={field.key}
                      value={formData[field.key] as string}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className={hasError ? 'border-red-500' : ''}
                      rows={3}
                    />
                  ) : (
                    <Input
                      id={field.key}
                      value={formData[field.key] as string}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className={hasError ? 'border-red-500' : ''}
                    />
                  )}

                  <Button
                    onClick={() => handleSave(field.key)}
                    disabled={saving || !isChanged || hasError}
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

                {hasError && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {validationErrors[field.key]}
                  </p>
                )}

                {/* Character count for multiline fields */}
                {field.multiline && (
                  <p className="text-xs text-muted-foreground text-right">
                    {(formData[field.key] as string).length}/300 Zeichen
                  </p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Content Sections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Inhaltsbereiche
          </CardTitle>
          <CardDescription>
            Aktivieren oder deaktivieren Sie verschiedene Bereiche der Landingpage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <Label htmlFor="show-pricing">Preisbereich anzeigen</Label>
                <Badge
                  variant={formData.show_pricing ? 'default' : 'secondary'}
                  className={formData.show_pricing ? 'text-green-600' : 'text-gray-600'}
                >
                  {formData.show_pricing ? 'Aktiv' : 'Inaktiv'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Zeigt den Preisbereich mit verfügbaren Plänen auf der Landingpage an
              </p>
            </div>
            <Switch
              id="show-pricing"
              checked={formData.show_pricing}
              onCheckedChange={(checked) => handleBooleanChange('show_pricing', checked)}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Vorschau
          </CardTitle>
          <CardDescription>
            Sehen Sie, wie Ihre Landingpage aussehen wird.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed rounded-lg p-6 space-y-4 bg-muted/20">
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold text-foreground">
                {formData.hero_title}
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {formData.hero_subtitle}
              </p>
              <div className="flex justify-center gap-4">
                <Button size="lg">
                  {formData.cta_button_text}
                </Button>
                {formData.show_pricing && (
                  <Button variant="outline" size="lg">
                    Preise ansehen
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Dies ist eine vereinfachte Vorschau des Hero-Bereichs
            </p>
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              Live-Vorschau
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SEO Impact Info */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Globe className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">SEO und Marketing Impact</p>
              <p className="text-sm text-muted-foreground">
                Der Hero-Titel und -Untertitel werden als Meta-Titel und -Beschreibung
                für Suchmaschinen verwendet. Achten Sie auf relevante Keywords und
                eine ansprechende Formulierung für bessere Conversion-Raten.
              </p>
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <div>Titel-Länge: <span className="font-medium">{formData.hero_title.length}/100 Zeichen</span></div>
                <div>Untertitel-Länge: <span className="font-medium">{formData.hero_subtitle.length}/300 Zeichen</span></div>
                <div>Preisbereich: <span className="font-medium">{formData.show_pricing ? 'Aktiviert' : 'Deaktiviert'}</span></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}