'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import {
  Palette,
  Image,
  Monitor,
  Sun,
  Moon,
  Laptop,
  Save,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Eye,
  Upload
} from 'lucide-react';
import type { DisplaySettings } from '@/lib/settings-types';

interface DisplaySettingsPanelProps {
  settings: DisplaySettings;
  onUpdate: (key: string, value: any, dataType?: string) => Promise<void>;
  onChange: () => void;
  saving: boolean;
}

export function DisplaySettingsPanel({
  settings,
  onUpdate,
  onChange,
  saving
}: DisplaySettingsPanelProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<DisplaySettings>(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData(settings);
    setHasChanges(false);
  }, [settings]);

  const handleInputChange = (key: keyof DisplaySettings, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    onChange();

    // Clear validation error when user starts typing
    if (validationErrors[key]) {
      setValidationErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const validateColorField = (value: string): string => {
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!colorRegex.test(value)) {
      return 'Ungültiges Farbformat. Verwenden Sie Hex-Format (#000000)';
    }
    return '';
  };

  const validateUrlField = (value: string): string => {
    if (!value.trim()) return '';
    try {
      new URL(value.startsWith('http') ? value : `https://example.com${value}`);
      return '';
    } catch {
      return 'Ungültige URL';
    }
  };

  const handleSave = async (key: keyof DisplaySettings) => {
    const value = formData[key];
    let error = '';

    if (key === 'primary_color' || key === 'secondary_color') {
      error = validateColorField(value);
    } else if (key === 'logo_url' || key === 'favicon_url') {
      error = validateUrlField(value);
    }

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

  const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
    setFormData(prev => ({ ...prev, default_theme: theme }));
    try {
      await onUpdate('default_theme', theme, 'string');
      toast({
        title: 'Theme geändert',
        description: `Standard-Theme auf ${getThemeLabel(theme)} gesetzt`,
      });
    } catch (error) {
      console.error('Error saving theme:', error);
      toast({
        title: 'Fehler',
        description: 'Theme konnte nicht gespeichert werden',
        variant: 'destructive'
      });
    }
  };

  const getFieldLabel = (key: keyof DisplaySettings): string => {
    const labels = {
      default_theme: 'Standard-Theme',
      primary_color: 'Primärfarbe',
      secondary_color: 'Sekundärfarbe',
      logo_url: 'Logo URL',
      favicon_url: 'Favicon URL'
    };
    return labels[key];
  };

  const getThemeLabel = (theme: string): string => {
    const labels = {
      light: 'Hell',
      dark: 'Dunkel',
      system: 'System'
    };
    return labels[theme as keyof typeof labels] || theme;
  };

  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case 'light': return Sun;
      case 'dark': return Moon;
      case 'system': return Laptop;
      default: return Monitor;
    }
  };

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Theme-Einstellungen
            <Badge variant="outline">
              {getThemeLabel(formData.default_theme)}
            </Badge>
          </CardTitle>
          <CardDescription>
            Wählen Sie das Standard-Farbschema für neue Benutzer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['light', 'dark', 'system'].map((theme) => {
              const Icon = getThemeIcon(theme);
              const isSelected = formData.default_theme === theme;

              return (
                <Card
                  key={theme}
                  className={`cursor-pointer transition-all ${
                    isSelected
                      ? 'ring-2 ring-primary border-primary'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => handleThemeChange(theme as any)}
                >
                  <CardContent className="p-4 text-center">
                    <Icon className={`w-8 h-8 mx-auto mb-2 ${
                      isSelected ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                    <p className="font-medium">{getThemeLabel(theme)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {theme === 'light' && 'Helles Design'}
                      {theme === 'dark' && 'Dunkles Design'}
                      {theme === 'system' && 'Folgt Systemeinstellung'}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Color Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Farbeinstellungen
          </CardTitle>
          <CardDescription>
            Definieren Sie die Hauptfarben Ihrer Marke.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Primary Color */}
          <div className="space-y-3">
            <Label htmlFor="primary-color">Primärfarbe</Label>
            <div className="flex gap-3">
              <div className="flex items-center gap-2 flex-1">
                <div
                  className="w-10 h-10 rounded-md border"
                  style={{ backgroundColor: formData.primary_color }}
                />
                <Input
                  id="primary-color"
                  value={formData.primary_color}
                  onChange={(e) => handleInputChange('primary_color', e.target.value)}
                  placeholder="#3b82f6"
                  className={validationErrors.primary_color ? 'border-red-500' : ''}
                />
                <input
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => handleInputChange('primary_color', e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer"
                />
              </div>
              <Button
                onClick={() => handleSave('primary_color')}
                disabled={saving || formData.primary_color === settings.primary_color}
                size="sm"
                variant="outline"
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
            {validationErrors.primary_color && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {validationErrors.primary_color}
              </p>
            )}
          </div>

          {/* Secondary Color */}
          <div className="space-y-3">
            <Label htmlFor="secondary-color">Sekundärfarbe</Label>
            <div className="flex gap-3">
              <div className="flex items-center gap-2 flex-1">
                <div
                  className="w-10 h-10 rounded-md border"
                  style={{ backgroundColor: formData.secondary_color }}
                />
                <Input
                  id="secondary-color"
                  value={formData.secondary_color}
                  onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                  placeholder="#8b5cf6"
                  className={validationErrors.secondary_color ? 'border-red-500' : ''}
                />
                <input
                  type="color"
                  value={formData.secondary_color}
                  onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer"
                />
              </div>
              <Button
                onClick={() => handleSave('secondary_color')}
                disabled={saving || formData.secondary_color === settings.secondary_color}
                size="sm"
                variant="outline"
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
            {validationErrors.secondary_color && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {validationErrors.secondary_color}
              </p>
            )}
          </div>

          {/* Color Preview */}
          <Card className="border-2 border-dashed">
            <CardContent className="p-4">
              <div className="space-y-3">
                <p className="text-sm font-medium">Farbvorschau</p>
                <div className="flex gap-2">
                  <Button style={{ backgroundColor: formData.primary_color }} className="text-white">
                    Primär Button
                  </Button>
                  <Button
                    variant="outline"
                    style={{
                      borderColor: formData.secondary_color,
                      color: formData.secondary_color
                    }}
                  >
                    Sekundär Button
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Logo and Assets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            Logo und Assets
          </CardTitle>
          <CardDescription>
            Verwalten Sie Logo und Favicon für Ihre Anwendung.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo URL */}
          <div className="space-y-3">
            <Label htmlFor="logo-url">Logo URL</Label>
            <div className="flex gap-3">
              <div className="flex items-center gap-2 flex-1">
                {formData.logo_url && (
                  <div className="w-10 h-10 rounded border flex items-center justify-center bg-muted">
                    <img
                      src={formData.logo_url}
                      alt="Logo"
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <Input
                  id="logo-url"
                  value={formData.logo_url}
                  onChange={(e) => handleInputChange('logo_url', e.target.value)}
                  placeholder="/logo.png"
                  className={validationErrors.logo_url ? 'border-red-500' : ''}
                />
              </div>
              <Button
                onClick={() => handleSave('logo_url')}
                disabled={saving || formData.logo_url === settings.logo_url}
                size="sm"
                variant="outline"
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
            {validationErrors.logo_url && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {validationErrors.logo_url}
              </p>
            )}
          </div>

          {/* Favicon URL */}
          <div className="space-y-3">
            <Label htmlFor="favicon-url">Favicon URL</Label>
            <div className="flex gap-3">
              <div className="flex items-center gap-2 flex-1">
                {formData.favicon_url && (
                  <div className="w-6 h-6 rounded border flex items-center justify-center bg-muted">
                    <img
                      src={formData.favicon_url}
                      alt="Favicon"
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <Input
                  id="favicon-url"
                  value={formData.favicon_url}
                  onChange={(e) => handleInputChange('favicon_url', e.target.value)}
                  placeholder="/favicon.ico"
                  className={validationErrors.favicon_url ? 'border-red-500' : ''}
                />
              </div>
              <Button
                onClick={() => handleSave('favicon_url')}
                disabled={saving || formData.favicon_url === settings.favicon_url}
                size="sm"
                variant="outline"
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
            {validationErrors.favicon_url && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {validationErrors.favicon_url}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview and Info */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Eye className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Darstellungseinstellungen</p>
              <p className="text-sm text-muted-foreground">
                Änderungen an Theme und Farben werden sofort für neue Benutzer wirksam.
                Bestehende Benutzer können ihre persönlichen Theme-Einstellungen in
                ihrem Profil überschreiben.
              </p>
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <div>Standard-Theme: <span className="font-medium">{getThemeLabel(formData.default_theme)}</span></div>
                <div>Primärfarbe: <span className="font-medium">{formData.primary_color}</span></div>
                <div>Sekundärfarbe: <span className="font-medium">{formData.secondary_color}</span></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}