import type { Metadata } from 'next';
import { SettingsService } from '@/lib/settings-service';

export class MetadataService {
  private static cache: {
    metadata: Metadata;
    timestamp: number;
    viewport: any;
  } | null = null;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static async generateMetadata(): Promise<{ metadata: Metadata; viewport: any }> {
    // Return cached metadata if still valid
    if (this.cache && Date.now() - this.cache.timestamp < this.CACHE_DURATION) {
      return {
        metadata: this.cache.metadata,
        viewport: this.cache.viewport
      };
    }

    try {
      const settingsResult = await SettingsService.getPublicSettings();
      const settings = settingsResult.success ? settingsResult.data : null;

      const defaultUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";

      const siteName = settings?.general?.site_name || "Rising BSM V2";
      const siteDescription = settings?.general?.site_description || "Business Service Management Platform - Next Generation";
      const logoUrl = settings?.display?.logo_url;
      const faviconUrl = settings?.display?.favicon_url;

      const metadata: Metadata = {
        metadataBase: new URL(defaultUrl),
        title: {
          default: siteName,
          template: `%s | ${siteName}`
        },
        description: siteDescription,
        keywords: [
          'Business Service Management',
          'BSM',
          'ITSM',
          'Service Management',
          'Enterprise Software',
          'Workflow Management'
        ],
        authors: [
          {
            name: settings?.general?.company_name || siteName,
            url: defaultUrl
          }
        ],
        creator: settings?.general?.company_name || siteName,
        publisher: settings?.general?.company_name || siteName,
        applicationName: siteName,
        generator: 'Next.js',
        referrer: 'origin-when-cross-origin',
        icons: {
          icon: faviconUrl ? [
            { url: faviconUrl, sizes: '32x32' },
            { url: faviconUrl, sizes: '16x16' }
          ] : [
            { url: '/favicon.ico', sizes: '32x32' },
            { url: '/favicon.ico', sizes: '16x16' }
          ],
          shortcut: faviconUrl || '/favicon.ico',
          apple: logoUrl ? [
            { url: logoUrl, sizes: '180x180' }
          ] : undefined,
          other: logoUrl ? [
            {
              rel: 'apple-touch-icon-precomposed',
              url: logoUrl,
            }
          ] : undefined
        },
        manifest: '/manifest.json',
        openGraph: {
          type: 'website',
          locale: 'de_DE',
          url: defaultUrl,
          siteName: siteName,
          title: siteName,
          description: siteDescription,
          images: logoUrl ? [
            {
              url: logoUrl,
              width: 1200,
              height: 630,
              alt: `${siteName} Logo`
            }
          ] : []
        },
        twitter: {
          card: 'summary_large_image',
          title: siteName,
          description: siteDescription,
          images: logoUrl ? [logoUrl] : [],
          creator: settings?.general?.company_name || siteName
        },
        robots: {
          index: true,
          follow: true,
          nocache: false,
          googleBot: {
            index: true,
            follow: true,
            noimageindex: false,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
        category: 'technology'
      };

      const viewport = {
        width: 'device-width',
        initialScale: 1,
        maximumScale: 1,
        userScalable: false,
        themeColor: [
          { media: '(prefers-color-scheme: light)', color: settings?.display?.primary_color || '#a855f7' },
          { media: '(prefers-color-scheme: dark)', color: settings?.display?.primary_color || '#a855f7' }
        ],
        colorScheme: settings?.display?.default_theme === 'light' ? 'light' : 'dark',
      };

      // Cache the result
      this.cache = {
        metadata,
        viewport,
        timestamp: Date.now()
      };

      return { metadata, viewport };
    } catch (error) {
      console.error('Error generating metadata from settings:', error);

      // Return fallback metadata
      const fallbackMetadata: Metadata = {
        title: "Rising BSM V2",
        description: "Business Service Management Platform - Next Generation",
      };

      const fallbackViewport = {
        width: 'device-width',
        initialScale: 1,
        maximumScale: 1,
        userScalable: false,
      };

      return { metadata: fallbackMetadata, viewport: fallbackViewport };
    }
  }

  static async generatePageMetadata(
    title: string,
    description?: string,
    path?: string,
    image?: string
  ): Promise<Metadata> {
    const { metadata: baseMetadata } = await this.generateMetadata();
    const settingsResult = await SettingsService.getPublicSettings();
    const settings = settingsResult.success ? settingsResult.data : null;

    const defaultUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const siteName = settings?.general?.site_name || "Rising BSM V2";
    const fullTitle = `${title} | ${siteName}`;
    const pageDescription = description || settings?.general?.site_description || "Business Service Management Platform";
    const pageUrl = path ? `${defaultUrl}${path}` : defaultUrl;
    const pageImage = image || settings?.display?.logo_url;

    return {
      ...baseMetadata,
      title: fullTitle,
      description: pageDescription,
      openGraph: {
        ...baseMetadata.openGraph,
        title: fullTitle,
        description: pageDescription,
        url: pageUrl,
        images: pageImage ? [
          {
            url: pageImage,
            width: 1200,
            height: 630,
            alt: title
          }
        ] : baseMetadata.openGraph?.images || []
      },
      twitter: {
        ...baseMetadata.twitter,
        title: fullTitle,
        description: pageDescription,
        images: pageImage ? [pageImage] : baseMetadata.twitter?.images || []
      },
      alternates: {
        canonical: pageUrl
      }
    };
  }

  static clearCache(): void {
    this.cache = null;
  }
}
