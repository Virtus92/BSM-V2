import { redirect } from 'next/navigation';
import { SettingsService } from '@/lib/settings-service';

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  try {
    // Load landing page settings
    const result = await SettingsService.getPublicSettings();

    if (!result.success) {
      console.error('Failed to load settings:', result.error);
      redirect('/');
      return;
    }

    const landingSettings = result.data?.landing;

    // If landing page is not active, redirect to home
    if (!landingSettings?.is_active) {
      redirect('/');
      return;
    }

    // Redirect to the landing API which generates the actual page
    redirect('/api/landing');
  } catch (error) {
    console.error('Error in landing page:', error);
    redirect('/');
  }
}