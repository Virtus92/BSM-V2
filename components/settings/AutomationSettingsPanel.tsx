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
  Zap,
  Clock,
  Users,
  Bell,
  Save,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Activity,
  Settings2
} from 'lucide-react';
import type { AutomationSettings } from '@/lib/settings-types';

interface AutomationSettingsPanelProps {
  settings: AutomationSettings;
  onUpdate: (key: string, value: any, dataType?: string) => Promise<void>;
  onChange: () => void;
  saving: boolean;
}

export function AutomationSettingsPanel({
  settings,
  onUpdate,
  onChange,
  saving
}: AutomationSettingsPanelProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<AutomationSettings>(settings);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setFormData(settings);
    setHasChanges(false);
  }, [settings]);

  const handleBooleanChange = async (key: keyof AutomationSettings, value: boolean) => {
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

  const handleNumberChange = (key: keyof AutomationSettings, value: number) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    onChange();
  };

  const handleSaveNumber = async (key: keyof AutomationSettings) => {
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

  const getFieldLabel = (key: keyof AutomationSettings): string => {
    const labels = {
      auto_assign_enabled: 'Automatische Zuweisung',
      notification_delay_minutes: 'Benachrichtigungsverzögerung',
      max_concurrent_workflows: 'Maximale gleichzeitige Workflows'
    };
    return labels[key];
  };

  const getStatusColor = (enabled: boolean) => {
    return enabled ? 'text-green-500' : 'text-gray-500';
  };

  const getStatusText = (enabled: boolean) => {
    return enabled ? 'Aktiv' : 'Inaktiv';
  };

  return (
    <div className="space-y-6">
      {/* Task Assignment Automation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Automatische Aufgabenzuweisung
            <Badge
              variant={formData.auto_assign_enabled ? 'default' : 'secondary'}
              className={getStatusColor(formData.auto_assign_enabled)}
            >
              {getStatusText(formData.auto_assign_enabled)}
            </Badge>
          </CardTitle>
          <CardDescription>
            Neue Aufgaben automatisch an verfügbare Mitarbeiter zuweisen basierend auf
            Arbeitsbelastung, Fähigkeiten und Verfügbarkeit.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="auto-assign">Automatische Zuweisung aktivieren</Label>
              <p className="text-sm text-muted-foreground">
                Tasks werden automatisch zugewiesen wenn sie erstellt werden
              </p>
            </div>
            <Switch
              id="auto-assign"
              checked={formData.auto_assign_enabled}
              onCheckedChange={(checked) => handleBooleanChange('auto_assign_enabled', checked)}
              disabled={saving}
            />
          </div>

          {formData.auto_assign_enabled && (
            <Card className="border-green-500/20 bg-green-500/5">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Automatische Zuweisung ist aktiv</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Neue Aufgaben werden automatisch an den am besten geeigneten Mitarbeiter
                  zugewiesen. Die Zuweisung basiert auf aktueller Arbeitsbelastung und
                  Verfügbarkeit.
                </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Benachrichtigungseinstellungen
          </CardTitle>
          <CardDescription>
            Konfigurieren Sie Verzögerungen und Timing für automatische Benachrichtigungen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notification-delay">
                Benachrichtigungsverzögerung: {formData.notification_delay_minutes} Minuten
              </Label>
              <p className="text-sm text-muted-foreground">
                Wartezeit bevor Benachrichtigungen versendet werden (1-60 Minuten)
              </p>
            </div>

            <div className="space-y-3">
              <Slider
                id="notification-delay"
                min={1}
                max={60}
                step={1}
                value={[formData.notification_delay_minutes]}
                onValueChange={([value]) => handleNumberChange('notification_delay_minutes', value)}
                className="w-full"
                disabled={saving}
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Aktuell: {formData.notification_delay_minutes} Minuten
                  </span>
                </div>

                <Button
                  onClick={() => handleSaveNumber('notification_delay_minutes')}
                  disabled={saving || formData.notification_delay_minutes === settings.notification_delay_minutes}
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

            <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
              <div className="text-center">
                <div>1 Min</div>
                <div>Sofort</div>
              </div>
              <div className="text-center">
                <div>30 Min</div>
                <div>Standard</div>
              </div>
              <div className="text-center">
                <div>60 Min</div>
                <div>Verzögert</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Workflow-Performance
          </CardTitle>
          <CardDescription>
            Einstellungen für die Leistung und Parallelverarbeitung von Workflows.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="max-workflows">
                Maximale gleichzeitige Workflows: {formData.max_concurrent_workflows}
              </Label>
              <p className="text-sm text-muted-foreground">
                Anzahl der Workflows die gleichzeitig ausgeführt werden können (1-50)
              </p>
            </div>

            <div className="space-y-3">
              <Slider
                id="max-workflows"
                min={1}
                max={50}
                step={1}
                value={[formData.max_concurrent_workflows]}
                onValueChange={([value]) => handleNumberChange('max_concurrent_workflows', value)}
                className="w-full"
                disabled={saving}
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Aktuell: {formData.max_concurrent_workflows} Workflows
                  </span>
                </div>

                <Button
                  onClick={() => handleSaveNumber('max_concurrent_workflows')}
                  disabled={saving || formData.max_concurrent_workflows === settings.max_concurrent_workflows}
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

            <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
              <div className="text-center">
                <div>1-5</div>
                <div>Konservativ</div>
              </div>
              <div className="text-center">
                <div>10-20</div>
                <div>Ausgewogen</div>
              </div>
              <div className="text-center">
                <div>30-50</div>
                <div>Leistung</div>
              </div>
            </div>
          </div>

          {/* Performance Warning */}
          {formData.max_concurrent_workflows > 25 && (
            <Card className="border-yellow-500/20 bg-yellow-500/5">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-sm text-yellow-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Hohe Anzahl gleichzeitiger Workflows</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Eine hohe Anzahl gleichzeitiger Workflows kann die Systemleistung
                  beeinträchtigen. Überwachen Sie die Serverressourcen entsprechend.
                </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* System Status */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Settings2 className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Automatisierungsstatus</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Automatische Zuweisung:</span>
                  <span className={getStatusColor(formData.auto_assign_enabled)}>
                    {getStatusText(formData.auto_assign_enabled)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Benachrichtigungsverzögerung:</span>
                  <span>{formData.notification_delay_minutes} Min</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Max. Workflows:</span>
                  <span>{formData.max_concurrent_workflows}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}