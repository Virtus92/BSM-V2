'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { usePublicSettings } from '@/lib/contexts/settings-context';
import {
  Cookie,
  Settings,
  Check,
  X,
  ExternalLink,
  Shield,
  BarChart3,
  Target
} from 'lucide-react';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

export function CookieConsent() {
  const { settings: publicSettings } = usePublicSettings();
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    preferences: false
  });

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent');
    const consentDate = localStorage.getItem('cookie-consent-date');

    if (!consent || !consentDate) {
      // Show banner if no consent given
      setIsVisible(true);
    } else {
      // Check if consent is older than 1 year (GDPR requirement)
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      if (new Date(consentDate) < oneYearAgo) {
        setIsVisible(true);
      } else {
        // Load existing preferences
        const savedPreferences = JSON.parse(consent);
        setPreferences(savedPreferences);
        loadCookies(savedPreferences);
      }
    }
  }, []);

  // Don't show if GDPR is not enabled
  if (!publicSettings?.legal?.cookie_consent_required) {
    return null;
  }

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem('cookie-consent', JSON.stringify(prefs));
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    setPreferences(prefs);
    loadCookies(prefs);
    setIsVisible(false);
  };

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: publicSettings?.integrations?.analytics_enabled || false,
      marketing: publicSettings?.integrations?.marketing_enabled || false,
      preferences: true
    };
    saveConsent(allAccepted);
  };

  const acceptNecessary = () => {
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false
    });
  };

  const saveCustomPreferences = () => {
    saveConsent(preferences);
  };

  const loadCookies = (prefs: CookiePreferences) => {
    // Load analytics cookies
    if (prefs.analytics && publicSettings?.integrations?.google_analytics_id) {
      loadGoogleAnalytics(publicSettings.integrations.google_analytics_id);
    }

    // Load marketing cookies
    if (prefs.marketing && publicSettings?.integrations?.facebook_pixel_id) {
      loadFacebookPixel(publicSettings.integrations.facebook_pixel_id);
    }

    // Dispatch custom event for other components to listen to
    window.dispatchEvent(new CustomEvent('cookieConsentChanged', {
      detail: prefs
    }));
  };

  const loadGoogleAnalytics = (trackingId: string) => {
    // Load Google Analytics
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${trackingId}', {
        anonymize_ip: true,
        cookie_flags: 'SameSite=Strict;Secure'
      });
    `;
    document.head.appendChild(script2);
  };

  const loadFacebookPixel = (pixelId: string) => {
    // Load Facebook Pixel
    const script = document.createElement('script');
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);

    const noscript = document.createElement('noscript');
    noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1" />`;
    document.head.appendChild(noscript);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-end justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Cookie className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Cookie-Einstellungen</CardTitle>
                <CardDescription>
                  Wir verwenden Cookies, um Ihre Erfahrung zu verbessern
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {!showDetails ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Wir verwenden Cookies und ähnliche Technologien, um die Nutzung unserer Website zu analysieren,
                Inhalte zu personalisieren und unsere Services zu verbessern. Weitere Informationen finden Sie in unserer{' '}
                <a href="/legal/privacy" className="text-primary hover:underline">
                  Datenschutzerklärung
                </a>{' '}
                und{' '}
                <a href="/legal/cookies" className="text-primary hover:underline">
                  Cookie-Richtlinie
                </a>.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={acceptAll}
                  className="flex-1"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Alle akzeptieren
                </Button>
                <Button
                  onClick={acceptNecessary}
                  variant="outline"
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Nur notwendige
                </Button>
                <Button
                  onClick={() => setShowDetails(true)}
                  variant="ghost"
                  className="flex-1"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Anpassen
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Cookie-Kategorien
                </h3>

                {/* Necessary Cookies */}
                <div className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-500" />
                      <span className="font-medium">Notwendige Cookies</span>
                      <Badge variant="secondary">Erforderlich</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Diese Cookies sind für die Grundfunktionen der Website erforderlich.
                    </p>
                  </div>
                  <Switch
                    checked={true}
                    disabled={true}
                    className="opacity-50"
                  />
                </div>

                {/* Analytics Cookies */}
                {publicSettings?.integrations?.analytics_enabled && (
                  <div className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">Analyse-Cookies</span>
                        <Badge variant="outline">Optional</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Helfen uns zu verstehen, wie Besucher mit der Website interagieren.
                      </p>
                    </div>
                    <Switch
                      checked={preferences.analytics}
                      onCheckedChange={(checked) =>
                        setPreferences(prev => ({ ...prev, analytics: checked }))
                      }
                    />
                  </div>
                )}

                {/* Marketing Cookies */}
                {publicSettings?.integrations?.marketing_enabled && (
                  <div className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-purple-500" />
                        <span className="font-medium">Marketing-Cookies</span>
                        <Badge variant="outline">Optional</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Werden verwendet, um Werbung relevanter zu gestalten.
                      </p>
                    </div>
                    <Switch
                      checked={preferences.marketing}
                      onCheckedChange={(checked) =>
                        setPreferences(prev => ({ ...prev, marketing: checked }))
                      }
                    />
                  </div>
                )}

                {/* Preferences Cookies */}
                <div className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-orange-500" />
                      <span className="font-medium">Einstellungs-Cookies</span>
                      <Badge variant="outline">Optional</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Speichern Ihre Präferenzen wie Sprache und Region.
                    </p>
                  </div>
                  <Switch
                    checked={preferences.preferences}
                    onCheckedChange={(checked) =>
                      setPreferences(prev => ({ ...prev, preferences: checked }))
                    }
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={saveCustomPreferences}
                  className="flex-1"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Auswahl speichern
                </Button>
                <Button
                  onClick={() => setShowDetails(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Zurück
                </Button>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  Ihre Einwilligung können Sie jederzeit widerrufen. Weitere Informationen:
                </p>
                <div className="flex flex-wrap gap-4">
                  <a href="/legal/privacy" className="hover:text-primary">
                    <ExternalLink className="w-3 h-3 inline mr-1" />
                    Datenschutzerklärung
                  </a>
                  <a href="/legal/cookies" className="hover:text-primary">
                    <ExternalLink className="w-3 h-3 inline mr-1" />
                    Cookie-Richtlinie
                  </a>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}