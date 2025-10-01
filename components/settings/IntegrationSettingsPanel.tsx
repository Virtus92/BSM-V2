'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import {
  Plug,
  Facebook,
  Mail,
  MessageSquare,
  CreditCard,
  Save,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
  ExternalLink,
  Settings2
} from 'lucide-react';
import type { IntegrationSettings } from '@/lib/settings-types';

interface IntegrationSettingsPanelProps {
  settings: IntegrationSettings;
  onUpdate: (key: string, value: any, dataType?: string) => Promise<void>;
  onChange: () => void;
  saving: boolean;
}

export function IntegrationSettingsPanel({
  settings,
  onUpdate,
  onChange,
  saving
}: IntegrationSettingsPanelProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<IntegrationSettings>(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setFormData(settings);
    setHasChanges(false);
  }, [settings]);

  const handleInputChange = (key: keyof IntegrationSettings, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    onChange();

    if (validationErrors[key]) {
      setValidationErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const handleBooleanChange = async (key: keyof IntegrationSettings, value: boolean) => {
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

  const validateField = (key: keyof IntegrationSettings, value: string): string => {
    if (key.includes('api_key') || key.includes('secret') || key.includes('token')) {
      if (!value.trim()) return '';
      if (value.length < 10) return 'API-Schlüssel sollte mindestens 10 Zeichen lang sein';
    }

    if (key.includes('app_id') || key.includes('client_id')) {
      if (!value.trim()) return '';
      if (value.length < 5) return 'ID sollte mindestens 5 Zeichen lang sein';
    }

    if (key.includes('webhook_url')) {
      if (!value.trim()) return '';
      try {
        new URL(value);
      } catch {
        return 'Ungültige Webhook-URL';
      }
    }

    return '';
  };

  const handleSave = async (key: keyof IntegrationSettings) => {
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

  const getFieldLabel = (key: keyof IntegrationSettings): string => {
    const labels = {
      facebook_app_id: 'Facebook App ID',
      facebook_app_secret: 'Facebook App Secret',
      facebook_pixel_id: 'Facebook Pixel ID',
      google_analytics_id: 'Google Analytics ID',
      google_ads_id: 'Google Ads ID',
      google_client_id: 'Google Client ID',
      google_client_secret: 'Google Client Secret',
      stripe_publishable_key: 'Stripe Publishable Key',
      stripe_secret_key: 'Stripe Secret Key',
      stripe_webhook_secret: 'Stripe Webhook Secret',
      mailchimp_api_key: 'Mailchimp API Key',
      mailchimp_list_id: 'Mailchimp List ID',
      slack_webhook_url: 'Slack Webhook URL',
      slack_bot_token: 'Slack Bot Token',
      analytics_enabled: 'Analytics aktiviert',
      marketing_enabled: 'Marketing aktiviert',
      payment_enabled: 'Zahlungen aktiviert',
      notifications_enabled: 'Benachrichtigungen aktiviert'
    };
    return labels[key] || key;
  };

  const toggleSecretVisibility = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderSecretField = (key: keyof IntegrationSettings, label: string, placeholder: string) => {
    const hasError = !!validationErrors[key];
    const isChanged = formData[key] !== settings[key];
    const isSecret = key.includes('secret') || key.includes('token') || (key.includes('key') && !key.includes('publishable'));

    return (
      <div className="space-y-3">
        <Label htmlFor={key} className="flex items-center gap-2">
          {label}
          {isChanged && (
            <Badge variant="secondary" className="text-xs">
              Geändert
            </Badge>
          )}
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id={key}
              type={isSecret && !showSecrets[key] ? 'password' : 'text'}
              value={formData[key] as string}
              onChange={(e) => handleInputChange(key, e.target.value)}
              placeholder={placeholder}
              className={hasError ? 'border-red-500' : ''}
            />
            {isSecret && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => toggleSecretVisibility(key)}
              >
                {showSecrets[key] ? (
                  <EyeOff className="w-3 h-3" />
                ) : (
                  <Eye className="w-3 h-3" />
                )}
              </Button>
            )}
          </div>
          <Button
            onClick={() => handleSave(key)}
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
            {validationErrors[key]}
          </p>
        )}
      </div>
    );
  };

  const integrationStatus = {
    facebook: formData.facebook_app_id && formData.facebook_app_secret,
    google: formData.google_client_id && formData.google_client_secret,
    stripe: formData.stripe_publishable_key && formData.stripe_secret_key,
    mailchimp: formData.mailchimp_api_key && formData.mailchimp_list_id,
    slack: formData.slack_webhook_url || formData.slack_bot_token
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={integrationStatus.facebook ? 'border-green-500/20 bg-green-500/5' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Facebook className="w-5 h-5" />
              <span className="font-medium">Facebook</span>
              {integrationStatus.facebook ? (
                <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-yellow-500 ml-auto" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {integrationStatus.facebook ? 'Konfiguriert' : 'Nicht konfiguriert'}
            </p>
          </CardContent>
        </Card>

        <Card className={integrationStatus.google ? 'border-green-500/20 bg-green-500/5' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-500 rounded-sm flex items-center justify-center text-white text-xs font-bold">G</div>
              <span className="font-medium">Google</span>
              {integrationStatus.google ? (
                <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-yellow-500 ml-auto" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {integrationStatus.google ? 'Konfiguriert' : 'Nicht konfiguriert'}
            </p>
          </CardContent>
        </Card>

        <Card className={integrationStatus.stripe ? 'border-green-500/20 bg-green-500/5' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              <span className="font-medium">Stripe</span>
              {integrationStatus.stripe ? (
                <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-yellow-500 ml-auto" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {integrationStatus.stripe ? 'Konfiguriert' : 'Nicht konfiguriert'}
            </p>
          </CardContent>
        </Card>

        <Card className={integrationStatus.mailchimp || integrationStatus.slack ? 'border-green-500/20 bg-green-500/5' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Plug className="w-5 h-5" />
              <span className="font-medium">Andere</span>
              {integrationStatus.mailchimp || integrationStatus.slack ? (
                <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-yellow-500 ml-auto" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {integrationStatus.mailchimp || integrationStatus.slack ? 'Teilweise konfiguriert' : 'Nicht konfiguriert'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            Globale Einstellungen
          </CardTitle>
          <CardDescription>
            Aktivieren oder deaktivieren Sie verschiedene Integrationskategorien.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="analytics-enabled">Analytics & Tracking</Label>
                <p className="text-sm text-muted-foreground">
                  Google Analytics, Facebook Pixel, und andere Tracking-Tools
                </p>
              </div>
              <Switch
                id="analytics-enabled"
                checked={formData.analytics_enabled}
                onCheckedChange={(checked) => handleBooleanChange('analytics_enabled', checked)}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="marketing-enabled">Marketing Tools</Label>
                <p className="text-sm text-muted-foreground">
                  E-Mail Marketing, Social Media, und Werbeplattformen
                </p>
              </div>
              <Switch
                id="marketing-enabled"
                checked={formData.marketing_enabled}
                onCheckedChange={(checked) => handleBooleanChange('marketing_enabled', checked)}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="payment-enabled">Zahlungsabwicklung</Label>
                <p className="text-sm text-muted-foreground">
                  Stripe, PayPal, und andere Zahlungsanbieter
                </p>
              </div>
              <Switch
                id="payment-enabled"
                checked={formData.payment_enabled}
                onCheckedChange={(checked) => handleBooleanChange('payment_enabled', checked)}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="notifications-enabled">Benachrichtigungen</Label>
                <p className="text-sm text-muted-foreground">
                  Slack, Discord, und andere Messaging-Plattformen
                </p>
              </div>
              <Switch
                id="notifications-enabled"
                checked={formData.notifications_enabled}
                onCheckedChange={(checked) => handleBooleanChange('notifications_enabled', checked)}
                disabled={saving}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Configuration */}
      <Tabs defaultValue="facebook" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="facebook">Facebook</TabsTrigger>
          <TabsTrigger value="google">Google</TabsTrigger>
          <TabsTrigger value="stripe">Stripe</TabsTrigger>
          <TabsTrigger value="mailchimp">Mailchimp</TabsTrigger>
          <TabsTrigger value="slack">Slack</TabsTrigger>
        </TabsList>

        {/* Facebook Configuration */}
        <TabsContent value="facebook">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Facebook className="w-5 h-5" />
                Facebook Integration
                <Badge variant={integrationStatus.facebook ? 'default' : 'secondary'}>
                  {integrationStatus.facebook ? 'Aktiv' : 'Inaktiv'}
                </Badge>
              </CardTitle>
              <CardDescription>
                Konfigurieren Sie Facebook App, Pixel und Marketing-Tools.
                <Button variant="link" size="sm" className="p-0 h-auto ml-2">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Facebook Developers
                </Button>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderSecretField('facebook_app_id', 'Facebook App ID', 'z.B. 1234567890123456')}
              {renderSecretField('facebook_app_secret', 'Facebook App Secret', 'z.B. abcdef1234567890abcdef1234567890')}
              {renderSecretField('facebook_pixel_id', 'Facebook Pixel ID', 'z.B. 1234567890123456')}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Google Configuration */}
        <TabsContent value="google">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-5 h-5 bg-blue-500 rounded-sm flex items-center justify-center text-white text-xs font-bold">G</div>
                Google Integration
                <Badge variant={integrationStatus.google ? 'default' : 'secondary'}>
                  {integrationStatus.google ? 'Aktiv' : 'Inaktiv'}
                </Badge>
              </CardTitle>
              <CardDescription>
                Konfigurieren Sie Google Analytics, Ads und OAuth.
                <Button variant="link" size="sm" className="p-0 h-auto ml-2">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Google Cloud Console
                </Button>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderSecretField('google_analytics_id', 'Google Analytics ID', 'z.B. G-XXXXXXXXXX')}
              {renderSecretField('google_ads_id', 'Google Ads ID', 'z.B. AW-1234567890')}
              {renderSecretField('google_client_id', 'Google Client ID', 'z.B. 1234567890-abcdef.apps.googleusercontent.com')}
              {renderSecretField('google_client_secret', 'Google Client Secret', 'z.B. GOCSPX-abcdef1234567890')}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stripe Configuration */}
        <TabsContent value="stripe">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Stripe Integration
                <Badge variant={integrationStatus.stripe ? 'default' : 'secondary'}>
                  {integrationStatus.stripe ? 'Aktiv' : 'Inaktiv'}
                </Badge>
              </CardTitle>
              <CardDescription>
                Konfigurieren Sie Stripe für Zahlungsabwicklung und Abonnements.
                <Button variant="link" size="sm" className="p-0 h-auto ml-2">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Stripe Dashboard
                </Button>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderSecretField('stripe_publishable_key', 'Stripe Publishable Key', 'z.B. pk_live_...')}
              {renderSecretField('stripe_secret_key', 'Stripe Secret Key', 'z.B. sk_live_...')}
              {renderSecretField('stripe_webhook_secret', 'Stripe Webhook Secret', 'z.B. whsec_...')}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mailchimp Configuration */}
        <TabsContent value="mailchimp">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Mailchimp Integration
                <Badge variant={integrationStatus.mailchimp ? 'default' : 'secondary'}>
                  {integrationStatus.mailchimp ? 'Aktiv' : 'Inaktiv'}
                </Badge>
              </CardTitle>
              <CardDescription>
                Konfigurieren Sie Mailchimp für E-Mail Marketing und Newsletter.
                <Button variant="link" size="sm" className="p-0 h-auto ml-2">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Mailchimp Dashboard
                </Button>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderSecretField('mailchimp_api_key', 'Mailchimp API Key', 'z.B. abcdef1234567890-us1')}
              {renderSecretField('mailchimp_list_id', 'Mailchimp List ID', 'z.B. 1234567890')}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Slack Configuration */}
        <TabsContent value="slack">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Slack Integration
                <Badge variant={integrationStatus.slack ? 'default' : 'secondary'}>
                  {integrationStatus.slack ? 'Aktiv' : 'Inaktiv'}
                </Badge>
              </CardTitle>
              <CardDescription>
                Konfigurieren Sie Slack für Benachrichtigungen und Team-Kommunikation.
                <Button variant="link" size="sm" className="p-0 h-auto ml-2">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Slack API
                </Button>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderSecretField('slack_webhook_url', 'Slack Webhook URL', 'https://hooks.slack.com/services/...')}
              {renderSecretField('slack_bot_token', 'Slack Bot Token', 'z.B. xoxb-...')}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Security Notice */}
      <Card className="border-yellow-500/20 bg-yellow-500/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Sicherheitshinweis</p>
              <p className="text-sm text-muted-foreground">
                API-Schlüssel und Geheimnisse werden verschlüsselt in der Datenbank gespeichert.
                Teilen Sie diese Informationen niemals mit Dritten und verwenden Sie für
                Produktionsumgebungen immer separate Schlüssel für Test- und Live-Umgebungen.
              </p>
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <div>Verschlüsselung: <span className="font-medium">AES-256</span></div>
                <div>Zugriff: <span className="font-medium">Nur Administratoren</span></div>
                <div>Logging: <span className="font-medium">Alle Änderungen werden protokolliert</span></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}