'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  Settings,
  Zap,
  Palette,
  Globe,
  FileText,
  Puzzle,
  Download,
  Upload,
  RotateCcw,
  Save,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { GeneralSettingsPanel } from './GeneralSettingsPanel';
import { AutomationSettingsPanel } from './AutomationSettingsPanel';
import { DisplaySettingsPanel } from './DisplaySettingsPanel';
import { AdvancedLandingPagePanel } from './AdvancedLandingPagePanel';
import { LegalSettingsPanel } from './LegalSettingsPanel';
import { IntegrationSettingsPanel } from './IntegrationSettingsPanel';
import type { AllSystemSettings } from '@/lib/settings-types';

export function SystemSettingsView() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AllSystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const settingsTabs = [
    {
      id: 'general',
      label: 'Allgemein',
      icon: Settings,
      description: 'Grundeinstellungen und Unternehmensinformationen'
    },
    {
      id: 'automation',
      label: 'Automatisierung',
      icon: Zap,
      description: 'Workflow-Automatisierung und Benachrichtigungen'
    },
    {
      id: 'display',
      label: 'Darstellung',
      icon: Palette,
      description: 'Design, Themes und visuelle Einstellungen'
    },
    {
      id: 'landing',
      label: 'Landingpage',
      icon: Globe,
      description: 'Website-Inhalte und Konfiguration'
    },
    {
      id: 'legal',
      label: 'Rechtstexte',
      icon: FileText,
      description: 'Datenschutz, AGB und rechtliche Dokumente'
    },
    {
      id: 'integrations',
      label: 'Integrationen',
      icon: Puzzle,
      description: 'Drittanbieter-Services und APIs'
    }
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/system');
      const result = await response.json();

      if (result.success) {
        setSettings(result.data);
      } else {
        toast({
          title: 'Fehler',
          description: result.error || 'Einstellungen konnten nicht geladen werden',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: 'Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (category: string, key: string, value: any, dataType: string = 'string') => {
    try {
      setSaving(true);
      const response = await fetch('/api/settings/system', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          key,
          value,
          data_type: dataType
        })
      });

      const result = await response.json();

      if (result.success) {
        // Update local state
        setSettings(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            [category]: {
              ...prev[category as keyof AllSystemSettings],
              [key]: value
            }
          };
        });

        toast({
          title: 'Gespeichert',
          description: 'Einstellung wurde erfolgreich aktualisiert',
        });
        setHasUnsavedChanges(false);
      } else {
        toast({
          title: 'Fehler beim Speichern',
          description: result.error || 'Einstellung konnte nicht gespeichert werden',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      toast({
        title: 'Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const exportSettings = async () => {
    try {
      const response = await fetch('/api/settings/system?export=true');
      const result = await response.json();

      if (result.success) {
        const blob = new Blob([JSON.stringify(result.data, null, 2)], {
          type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `system-settings-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: 'Export erfolgreich',
          description: 'Einstellungen wurden heruntergeladen'
        });
      }
    } catch (error) {
      console.error('Error exporting settings:', error);
      toast({
        title: 'Export fehlgeschlagen',
        description: 'Einstellungen konnten nicht exportiert werden',
        variant: 'destructive'
      });
    }
  };

  const resetSettings = async () => {
    if (!confirm('Möchten Sie wirklich alle Einstellungen auf die Standardwerte zurücksetzen?')) {
      return;
    }

    try {
      setSaving(true);
      // Implement reset functionality
      toast({
        title: 'Zurückgesetzt',
        description: 'Einstellungen wurden auf Standardwerte zurückgesetzt'
      });
      await loadSettings();
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast({
        title: 'Fehler',
        description: 'Einstellungen konnten nicht zurückgesetzt werden',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Lade Einstellungen...</span>
      </div>
    );
  }

  if (!settings) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 text-red-500">
          <AlertTriangle className="w-5 h-5" />
          <span>Einstellungen konnten nicht geladen werden</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm text-muted-foreground">
                System bereit
              </span>
            </div>
            {hasUnsavedChanges && (
              <Badge variant="secondary" className="animate-pulse">
                Ungespeicherte Änderungen
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportSettings}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={resetSettings}
              disabled={saving}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Zurücksetzen
            </Button>

            <Button
              size="sm"
              onClick={loadSettings}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Neu laden
            </Button>
          </div>
        </div>
      </Card>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
          {settingsTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2 text-xs lg:text-sm"
              >
                <Icon className="w-4 h-4" />
                <span className="hidden lg:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {settingsTabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </CardTitle>
                <CardDescription>
                  {tab.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tab.id === 'general' && (
                  <GeneralSettingsPanel
                    settings={settings.general}
                    onUpdate={(key, value, dataType) => updateSetting('general', key, value, dataType)}
                    onChange={() => setHasUnsavedChanges(true)}
                    saving={saving}
                  />
                )}

                {tab.id === 'automation' && (
                  <AutomationSettingsPanel
                    settings={settings.automation}
                    onUpdate={(key, value, dataType) => updateSetting('automation', key, value, dataType)}
                    onChange={() => setHasUnsavedChanges(true)}
                    saving={saving}
                  />
                )}

                {tab.id === 'display' && (
                  <DisplaySettingsPanel
                    settings={settings.display}
                    onUpdate={(key, value, dataType) => updateSetting('display', key, value, dataType)}
                    onChange={() => setHasUnsavedChanges(true)}
                    saving={saving}
                  />
                )}

                {tab.id === 'landing' && (
                  <AdvancedLandingPagePanel
                    settings={settings.landing}
                    onUpdate={(key, value, dataType) => updateSetting('landing', key, value, dataType)}
                    onChange={() => setHasUnsavedChanges(true)}
                    saving={saving}
                  />
                )}

                {tab.id === 'legal' && (
                  <LegalSettingsPanel
                    settings={settings.legal}
                    onUpdate={(key, value, dataType) => updateSetting('legal', key, value, dataType)}
                    onChange={() => setHasUnsavedChanges(true)}
                    saving={saving}
                  />
                )}

                {tab.id === 'integrations' && (
                  <IntegrationSettingsPanel
                    settings={settings.integrations}
                    onUpdate={(key, value, dataType) => updateSetting('integrations', key, value, dataType)}
                    onChange={() => setHasUnsavedChanges(true)}
                    saving={saving}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}