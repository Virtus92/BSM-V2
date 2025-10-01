import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { SettingsProvider } from "@/lib/contexts/settings-context";
import { MetadataService } from "@/lib/services/metadata-service";
import { SettingsService } from "@/lib/settings-service";
import { CookieConsent } from "@/components/cookie-consent";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

// Generate dynamic metadata from settings
export async function generateMetadata(): Promise<Metadata> {
  const { metadata } = await MetadataService.generateMetadata();
  return metadata;
}

// Generate dynamic viewport from settings
export async function generateViewport() {
  const { viewport } = await MetadataService.generateMetadata();
  return viewport;
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Load settings for the provider
  const settingsResult = await SettingsService.getPublicSettings();
  const publicSettings = settingsResult.success ? settingsResult.data : null;

  // Get user for admin check
  let isAdmin = false;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('user_type')
        .eq('id', user.id)
        .single();

      isAdmin = profile?.user_type === 'admin';
    }
  } catch (error) {
    // Ignore auth errors in layout
  }

  // Get theme from settings or default to system
  const defaultTheme = publicSettings?.display?.default_theme || 'system';
  const toasterTheme = defaultTheme === 'light' ? 'light' : 'dark';

  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        {/* Preload settings API for faster access */}
        <link rel="preload" href="/api/settings/public" as="fetch" crossOrigin="anonymous" />

        {/* Dynamic favicon */}
        {publicSettings?.display?.favicon_url && (
          <link rel="icon" href={publicSettings.display.favicon_url} />
        )}
      </head>
      <body className={`${geistSans.className} antialiased`}>
        <SettingsProvider isAdmin={isAdmin} initialSettings={publicSettings as any}>
          <ThemeProvider
            attribute="class"
            defaultTheme={defaultTheme}
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster
              theme={toasterTheme as any}
              position="top-right"
              richColors
            />

            {/* Cookie Consent Banner */}
            <CookieConsent />
          </ThemeProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
