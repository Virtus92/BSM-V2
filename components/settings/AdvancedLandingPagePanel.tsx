'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import {
  Globe,
  Code2,
  Palette,
  Eye,
  Save,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Upload,
  Download,
  Trash2,
  Copy,
  ExternalLink,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';
import type { LandingSettings } from '@/lib/settings-types';

interface AdvancedLandingPagePanelProps {
  settings: LandingSettings;
  onUpdate: (key: string, value: any, dataType?: string) => Promise<void>;
  onChange: () => void;
  saving: boolean;
}

export function AdvancedLandingPagePanel({
  settings,
  onUpdate,
  onChange,
  saving
}: AdvancedLandingPagePanelProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<LandingSettings>(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setFormData(settings);
    setHasChanges(false);
  }, [settings]);

  const handleInputChange = (key: keyof LandingSettings, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    onChange();

    if (validationErrors[key]) {
      setValidationErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const handleSave = async (key: keyof LandingSettings) => {
    const value = formData[key];

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

  const handleSaveAll = async () => {
    try {
      const promises = Object.entries(formData).map(([key, value]) =>
        onUpdate(key, value, typeof value === 'boolean' ? 'boolean' : 'string')
      );
      await Promise.all(promises);
      setHasChanges(false);
      toast({
        title: 'Alle Änderungen gespeichert',
        description: 'Landing Page Konfiguration wurde aktualisiert',
      });
    } catch (error) {
      console.error('Error saving all settings:', error);
      toast({
        title: 'Fehler',
        description: 'Einstellungen konnten nicht gespeichert werden',
        variant: 'destructive'
      });
    }
  };

  const getFieldLabel = (key: keyof LandingSettings): string => {
    const labels = {
      template_type: 'Template Typ',
      is_active: 'Aktiv',
      hero_title: 'Hero Titel',
      hero_subtitle: 'Hero Untertitel',
      cta_button_text: 'CTA Button Text',
      cta_button_url: 'CTA Button URL',
      show_pricing: 'Preise anzeigen',
      custom_html: 'Benutzerdefiniertes HTML',
      custom_css: 'Benutzerdefiniertes CSS',
      custom_js: 'Benutzerdefiniertes JavaScript',
      meta_title: 'SEO Titel',
      meta_description: 'SEO Beschreibung',
      meta_keywords: 'SEO Keywords',
      enable_analytics: 'Analytics aktivieren',
      google_analytics_id: 'Google Analytics ID',
      enable_chat: 'Chat aktivieren',
      custom_head_tags: 'Benutzerdefinierte Head Tags',
      custom_body_tags: 'Benutzerdefinierte Body Tags',
      show_navigation: 'Navigation anzeigen',
      show_footer: 'Footer anzeigen',
      background_type: 'Hintergrund Typ',
      background_value: 'Hintergrund Wert',
      show_hero: 'Hero Bereich anzeigen',
      show_features: 'Features anzeigen',
      show_testimonials: 'Testimonials anzeigen',
      show_contact: 'Kontakt anzeigen',
      saved_templates: 'Gespeicherte Templates'
    };
    return labels[key] || key;
  };

  const exportTemplate = () => {
    const template = {
      name: `Template_${new Date().toISOString().split('T')[0]}`,
      settings: formData,
      created_at: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(template, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `landing-page-template-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Template exportiert',
      description: 'Landing Page Template wurde heruntergeladen'
    });
  };

  const importTemplate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const template = JSON.parse(e.target?.result as string);
        if (template.settings) {
          setFormData(template.settings);
          setHasChanges(true);
          toast({
            title: 'Template importiert',
            description: 'Landing Page Template wurde geladen'
          });
        }
      } catch (error) {
        toast({
          title: 'Import fehlgeschlagen',
          description: 'Ungültiges Template Format',
          variant: 'destructive'
        });
      }
    };
    reader.readAsText(file);
  };

  const previewLandingPage = () => {
    // Open preview in new tab/window
    const previewUrl = `/api/landing/preview?template=${encodeURIComponent(JSON.stringify(formData))}`;
    window.open(previewUrl, '_blank', 'width=1200,height=800');
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-500" />
                <span className="font-medium">Landing Page Builder</span>
                <Badge variant={formData.is_active ? 'default' : 'secondary'}>
                  {formData.is_active ? 'Live' : 'Entwurf'}
                </Badge>
              </div>
              {hasChanges && (
                <Badge variant="secondary" className="animate-pulse">
                  Ungespeicherte Änderungen
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".json"
                onChange={importTemplate}
                className="hidden"
                id="template-import"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('template-import')?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={exportTemplate}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={previewLandingPage}
              >
                <Eye className="w-4 h-4 mr-2" />
                Vorschau
              </Button>

              <Button
                size="sm"
                onClick={handleSaveAll}
                disabled={saving || !hasChanges}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Alle speichern
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="template" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="template">Template</TabsTrigger>
          <TabsTrigger value="content">Inhalt</TabsTrigger>
          <TabsTrigger value="design">Design</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="advanced">Erweitert</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
        </TabsList>

        {/* Template Selection */}
        <TabsContent value="template">
          <Card>
            <CardHeader>
              <CardTitle>Template Konfiguration</CardTitle>
              <CardDescription>
                Wählen Sie den Template-Typ für Ihre Landing Page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="template-type">Template Typ</Label>
                  <Select
                    value={formData.template_type}
                    onValueChange={(value) => handleInputChange('template_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Template Typ wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Standard Template</SelectItem>
                      <SelectItem value="custom">Benutzerdefiniert</SelectItem>
                      <SelectItem value="html">Reines HTML</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {formData.template_type === 'default' && 'Verwenden Sie das Standard BSM Template mit konfigurierbaren Inhalten'}
                    {formData.template_type === 'custom' && 'Erstellen Sie ein benutzerdefiniertes Design mit erweiterten Optionen'}
                    {formData.template_type === 'html' && 'Vollständige Kontrolle mit eigenem HTML, CSS und JavaScript'}
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="is-active">Landing Page aktivieren</Label>
                    <p className="text-sm text-muted-foreground">
                      Aktiviert die benutzerdefinierte Landing Page anstelle der Standard-Homepage
                    </p>
                  </div>
                  <Switch
                    id="is-active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Management */}
        <TabsContent value="content">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Hero Bereich</CardTitle>
                <CardDescription>
                  Hauptinhalt im oberen Bereich der Landing Page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-hero">Hero Bereich anzeigen</Label>
                  <Switch
                    id="show-hero"
                    checked={formData.show_hero}
                    onCheckedChange={(checked) => handleInputChange('show_hero', checked)}
                  />
                </div>

                {formData.show_hero && (
                  <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                    <div className="space-y-2">
                      <Label htmlFor="hero-title">Hero Titel</Label>
                      <Input
                        id="hero-title"
                        value={formData.hero_title}
                        onChange={(e) => handleInputChange('hero_title', e.target.value)}
                        placeholder="Willkommen bei unserem Service"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hero-subtitle">Hero Untertitel</Label>
                      <Textarea
                        id="hero-subtitle"
                        value={formData.hero_subtitle}
                        onChange={(e) => handleInputChange('hero_subtitle', e.target.value)}
                        placeholder="Beschreibung Ihres Services"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cta-text">CTA Button Text</Label>
                        <Input
                          id="cta-text"
                          value={formData.cta_button_text}
                          onChange={(e) => handleInputChange('cta_button_text', e.target.value)}
                          placeholder="Jetzt starten"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cta-url">CTA Button URL</Label>
                        <Input
                          id="cta-url"
                          value={formData.cta_button_url}
                          onChange={(e) => handleInputChange('cta_button_url', e.target.value)}
                          placeholder="/auth/sign-up"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content Bereiche</CardTitle>
                <CardDescription>
                  Aktivieren oder deaktivieren Sie verschiedene Bereiche der Landing Page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <Label htmlFor="show-features">Features</Label>
                    <Switch
                      id="show-features"
                      checked={formData.show_features}
                      onCheckedChange={(checked) => handleInputChange('show_features', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <Label htmlFor="show-pricing">Preise</Label>
                    <Switch
                      id="show-pricing"
                      checked={formData.show_pricing}
                      onCheckedChange={(checked) => handleInputChange('show_pricing', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <Label htmlFor="show-testimonials">Testimonials</Label>
                    <Switch
                      id="show-testimonials"
                      checked={formData.show_testimonials}
                      onCheckedChange={(checked) => handleInputChange('show_testimonials', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <Label htmlFor="show-contact">Kontakt</Label>
                    <Switch
                      id="show-contact"
                      checked={formData.show_contact}
                      onCheckedChange={(checked) => handleInputChange('show_contact', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Design Settings */}
        <TabsContent value="design">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Layout Einstellungen</CardTitle>
                <CardDescription>
                  Grundlegende Layout-Konfiguration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <Label htmlFor="show-navigation">Navigation</Label>
                    <Switch
                      id="show-navigation"
                      checked={formData.show_navigation}
                      onCheckedChange={(checked) => handleInputChange('show_navigation', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <Label htmlFor="show-footer">Footer</Label>
                    <Switch
                      id="show-footer"
                      checked={formData.show_footer}
                      onCheckedChange={(checked) => handleInputChange('show_footer', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hintergrund</CardTitle>
                <CardDescription>
                  Konfigurieren Sie den Hintergrund der Landing Page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="background-type">Hintergrund Typ</Label>
                  <Select
                    value={formData.background_type}
                    onValueChange={(value) => handleInputChange('background_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="color">Farbe</SelectItem>
                      <SelectItem value="gradient">Gradient</SelectItem>
                      <SelectItem value="image">Bild</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="background-value">
                    {formData.background_type === 'color' && 'Hintergrundfarbe'}
                    {formData.background_type === 'gradient' && 'CSS Gradient'}
                    {formData.background_type === 'image' && 'Bild URL'}
                  </Label>
                  <Input
                    id="background-value"
                    value={formData.background_value}
                    onChange={(e) => handleInputChange('background_value', e.target.value)}
                    placeholder={
                      formData.background_type === 'color' ? '#000000' :
                      formData.background_type === 'gradient' ? 'linear-gradient(45deg, #000, #fff)' :
                      'https://example.com/background.jpg'
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SEO Settings */}
        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>SEO Einstellungen</CardTitle>
              <CardDescription>
                Suchmaschinenoptimierung für Ihre Landing Page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meta-title">SEO Titel</Label>
                <Input
                  id="meta-title"
                  value={formData.meta_title}
                  onChange={(e) => handleInputChange('meta_title', e.target.value)}
                  placeholder="Titel für Suchmaschinen"
                />
                <p className="text-xs text-muted-foreground">
                  {formData.meta_title.length}/60 Zeichen
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta-description">SEO Beschreibung</Label>
                <Textarea
                  id="meta-description"
                  value={formData.meta_description}
                  onChange={(e) => handleInputChange('meta_description', e.target.value)}
                  placeholder="Beschreibung für Suchmaschinen"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.meta_description.length}/160 Zeichen
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta-keywords">SEO Keywords</Label>
                <Input
                  id="meta-keywords"
                  value={formData.meta_keywords}
                  onChange={(e) => handleInputChange('meta_keywords', e.target.value)}
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analytics & Tracking</CardTitle>
                <CardDescription>
                  Tracking und Analytics Konfiguration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enable-analytics">Analytics aktivieren</Label>
                  <Switch
                    id="enable-analytics"
                    checked={formData.enable_analytics}
                    onCheckedChange={(checked) => handleInputChange('enable_analytics', checked)}
                  />
                </div>

                {formData.enable_analytics && (
                  <div className="space-y-2">
                    <Label htmlFor="analytics-id">Google Analytics ID</Label>
                    <Input
                      id="analytics-id"
                      value={formData.google_analytics_id}
                      onChange={(e) => handleInputChange('google_analytics_id', e.target.value)}
                      placeholder="G-XXXXXXXXXX"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label htmlFor="enable-chat">Chat Widget aktivieren</Label>
                  <Switch
                    id="enable-chat"
                    checked={formData.enable_chat}
                    onCheckedChange={(checked) => handleInputChange('enable_chat', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Benutzerdefinierte Tags</CardTitle>
                <CardDescription>
                  Erweiterte HTML Tags für Head und Body Bereiche
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="head-tags">Head Tags</Label>
                  <Textarea
                    id="head-tags"
                    value={formData.custom_head_tags}
                    onChange={(e) => handleInputChange('custom_head_tags', e.target.value)}
                    placeholder="<meta property='og:image' content='...' />"
                    rows={4}
                    className="font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="body-tags">Body Tags</Label>
                  <Textarea
                    id="body-tags"
                    value={formData.custom_body_tags}
                    onChange={(e) => handleInputChange('custom_body_tags', e.target.value)}
                    placeholder="<!-- Tracking Pixel oder andere Body Tags -->"
                    rows={4}
                    className="font-mono"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Code Editor */}
        <TabsContent value="code">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Benutzerdefinierter Code</CardTitle>
                <CardDescription>
                  Vollständige Kontrolle über HTML, CSS und JavaScript
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="custom-html">HTML</Label>
                  <Textarea
                    id="custom-html"
                    value={formData.custom_html}
                    onChange={(e) => handleInputChange('custom_html', e.target.value)}
                    placeholder="<!DOCTYPE html><html>...</html>"
                    rows={8}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom-css">CSS</Label>
                  <Textarea
                    id="custom-css"
                    value={formData.custom_css}
                    onChange={(e) => handleInputChange('custom_css', e.target.value)}
                    placeholder="body { background: #000; }"
                    rows={8}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom-js">JavaScript</Label>
                  <Textarea
                    id="custom-js"
                    value={formData.custom_js}
                    onChange={(e) => handleInputChange('custom_js', e.target.value)}
                    placeholder="console.log('Hello World');"
                    rows={8}
                    className="font-mono text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Info Box */}
      <Card className="border-yellow-500/20 bg-yellow-500/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Wichtiger Hinweis</p>
              <p className="text-sm text-muted-foreground">
                Änderungen an der Landing Page werden sofort wirksam, wenn sie aktiviert ist.
                Testen Sie Ihre Änderungen gründlich mit der Vorschau-Funktion, bevor Sie sie live schalten.
                Benutzerdefinierter Code wird unverändert ausgeführt - achten Sie auf Sicherheit und Performance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}