import { notFound } from 'next/navigation';
import { MetadataService } from '@/lib/services/metadata-service';
import { SettingsService } from '@/lib/settings-service';
import type { Metadata } from 'next';

interface LegalPageParams { type: string }

const legalDocumentTypes = {
  'privacy': {
    title: 'Datenschutzerklärung',
    defaultContent: `
# Datenschutzerklärung

## 1. Verantwortlicher

[Hier wird automatisch der Firmenname aus den Einstellungen eingefügt]

## 2. Erhebung und Speicherung personenbezogener Daten

Wir erheben und verwenden Ihre personenbezogenen Daten nur, soweit dies gesetzlich erlaubt ist oder Sie in die Datenerhebung einwilligen.

## 3. Ihre Rechte

Sie haben das Recht auf:
- Auskunft über Ihre gespeicherten Daten
- Berichtigung unrichtiger Daten
- Löschung Ihrer Daten
- Einschränkung der Verarbeitung
- Datenübertragbarkeit

## 4. Kontakt

Bei Fragen zum Datenschutz wenden Sie sich an: [Support E-Mail aus Einstellungen]
    `
  },
  'terms': {
    title: 'Allgemeine Geschäftsbedingungen',
    defaultContent: `
# Allgemeine Geschäftsbedingungen

## 1. Geltungsbereich

Diese Allgemeinen Geschäftsbedingungen gelten für alle Leistungen von [Firmenname].

## 2. Vertragsschluss

Der Vertrag kommt durch Ihre Anmeldung und unsere Bestätigung zustande.

## 3. Leistungen

Wir erbringen die im jeweiligen Tarif beschriebenen Leistungen.

## 4. Vergütung

Die Vergütung richtet sich nach der gewählten Tarifoption.

## 5. Laufzeit und Kündigung

Details zur Vertragslaufzeit finden Sie in Ihrem gewählten Tarif.

## 6. Kontakt

[Firmenname]
[Kontakt E-Mail]
    `
  },
  'cookies': {
    title: 'Cookie-Richtlinie',
    defaultContent: `
# Cookie-Richtlinie

## Was sind Cookies?

Cookies sind kleine Textdateien, die von Websites auf Ihrem Gerät gespeichert werden.

## Welche Cookies verwenden wir?

### Notwendige Cookies
- Session-Cookies für die Anmeldung
- Sicherheits-Cookies

### Analyse-Cookies
${'{ANALYTICS_ENABLED}' ? '- Google Analytics (wenn aktiviert)' : '- Keine Analyse-Cookies'}

### Marketing-Cookies
${'{MARKETING_ENABLED}' ? '- Facebook Pixel (wenn aktiviert)' : '- Keine Marketing-Cookies'}

## Cookie-Einstellungen

Sie können Ihre Cookie-Einstellungen jederzeit ändern.

## Kontakt

Bei Fragen zu Cookies: [Support E-Mail]
    `
  },
  'imprint': {
    title: 'Impressum',
    defaultContent: `
# Impressum

## Angaben gemäß § 5 TMG

[Firmenname aus Einstellungen]
[Adresse wird hier eingefügt]

## Vertreten durch
[Geschäftsführer/Inhaber]

## Kontakt
E-Mail: [Kontakt E-Mail aus Einstellungen]

## Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
[Name]
[Adresse]

## EU-Streitschlichtung
Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit.

## Verbraucherstreitbeilegung
Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
    `
  }
};

export async function generateMetadata({ params }: { params: Promise<LegalPageParams> }): Promise<Metadata> {
  const { type } = await params;
  const docType = legalDocumentTypes[type as keyof typeof legalDocumentTypes];

  if (!docType) {
    return {
      title: 'Dokument nicht gefunden'
    };
  }

  return await MetadataService.generatePageMetadata(
    docType.title,
    `${docType.title} - Rechtliche Informationen`,
    `/legal/${type}`
  );
}

export default async function LegalPage({ params }: { params: Promise<LegalPageParams> }) {
  const { type } = await params;
  const docType = legalDocumentTypes[type as keyof typeof legalDocumentTypes];

  if (!docType) {
    notFound();
  }

  // Load settings to populate dynamic content
  const settingsResult = await SettingsService.getPublicSettings();
  const settings = settingsResult.success ? settingsResult.data : null;

  // Load custom legal document content if available
  let customContent: string | null = null;

  try {
    // Try to load custom legal document from database
    // This would require implementing a legal documents table
    // For now, we'll use the default content with dynamic replacements
  } catch (error) {
    console.error('Error loading custom legal document:', error);
  }

  // Use custom content if available, otherwise use default with replacements
  let content = customContent || docType.defaultContent;

  // Replace placeholders with actual settings
  if (settings) {
    content = content
      .replace(/\[Firmenname aus Einstellungen\]/g, settings.general?.company_name || '[Firmenname]')
      .replace(/\[Firmenname\]/g, settings.general?.company_name || '[Firmenname]')
      .replace(/\[Kontakt E-Mail aus Einstellungen\]/g, settings.general?.contact_email || '[kontakt@example.com]')
      .replace(/\[Kontakt E-Mail\]/g, settings.general?.contact_email || '[kontakt@example.com]')
      .replace(/\[Support E-Mail aus Einstellungen\]/g, settings.general?.support_email || '[support@example.com]')
      .replace(/\[Support E-Mail\]/g, settings.general?.support_email || '[support@example.com]');

    // Handle conditional content for cookies
    if (type === 'cookies') {
      const analyticsEnabled = settings.integrations?.analytics_enabled || false;
      const marketingEnabled = settings.integrations?.marketing_enabled || false;

      content = content
        .replace(/\{\{ANALYTICS_ENABLED\}\}/g, analyticsEnabled.toString())
        .replace(/\{\{MARKETING_ENABLED\}\}/g, marketingEnabled.toString());

      // Replace conditional blocks
      if (analyticsEnabled) {
        content = content.replace(/\$\{'{ANALYTICS_ENABLED}' \? '([^']+)' : '([^']+)'\}/g, '$1');
      } else {
        content = content.replace(/\$\{'{ANALYTICS_ENABLED}' \? '([^']+)' : '([^']+)'\}/g, '$2');
      }

      if (marketingEnabled) {
        content = content.replace(/\$\{'{MARKETING_ENABLED}' \? '([^']+)' : '([^']+)'\}/g, '$1');
      } else {
        content = content.replace(/\$\{'{MARKETING_ENABLED}' \? '([^']+)' : '([^']+)'\}/g, '$2');
      }
    }
  }

  // Convert markdown-like content to HTML (simple implementation)
  const formatContent = (text: string) => {
    return text
      .split('\n')
      .map(line => {
        // Headers
        if (line.startsWith('# ')) {
          return `<h1 class="text-3xl font-bold mb-6 text-primary">${line.slice(2)}</h1>`;
        }
        if (line.startsWith('## ')) {
          return `<h2 class="text-2xl font-semibold mb-4 mt-8 text-foreground">${line.slice(3)}</h2>`;
        }
        if (line.startsWith('### ')) {
          return `<h3 class="text-xl font-medium mb-3 mt-6 text-foreground">${line.slice(4)}</h3>`;
        }

        // Lists
        if (line.startsWith('- ')) {
          return `<li class="ml-4 mb-1">${line.slice(2)}</li>`;
        }

        // Empty lines
        if (line.trim() === '') {
          return '<br>';
        }

        // Regular paragraphs
        return `<p class="mb-4 text-muted-foreground leading-relaxed">${line}</p>`;
      })
      .join('\n');
  };

  const lastUpdated = new Date().toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">
                  {settings?.general?.site_name?.slice(0, 3).toUpperCase() || 'BSM'}
                </span>
              </div>
              <span className="text-xl font-bold">
                {settings?.general?.site_name || 'BSM'}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Zurück zur Website
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-card rounded-lg border p-8 shadow-sm">
          {/* Header */}
          <div className="mb-8 pb-6 border-b">
            <h1 className="text-4xl font-bold mb-2">{docType.title}</h1>
            <p className="text-muted-foreground">
              Letzte Aktualisierung: {lastUpdated}
            </p>
          </div>

          {/* Content */}
          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: formatContent(content) }}
          />

          {/* Footer */}
          <div className="mt-12 pt-6 border-t">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="text-sm text-muted-foreground">
                <p>Bei Fragen zu diesem Dokument:</p>
                <a
                  href={`mailto:${settings?.general?.support_email || 'support@example.com'}`}
                  className="text-primary hover:underline"
                >
                  {settings?.general?.support_email || 'support@example.com'}
                </a>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <a
                  href="/legal/privacy"
                  className={`text-sm ${params.type === 'privacy' ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'} transition-colors`}
                >
                  Datenschutz
                </a>
                <a
                  href="/legal/terms"
                  className={`text-sm ${params.type === 'terms' ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'} transition-colors`}
                >
                  AGB
                </a>
                <a
                  href="/legal/cookies"
                  className={`text-sm ${params.type === 'cookies' ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'} transition-colors`}
                >
                  Cookies
                </a>
                <a
                  href="/legal/imprint"
                  className={`text-sm ${params.type === 'imprint' ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'} transition-colors`}
                >
                  Impressum
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
