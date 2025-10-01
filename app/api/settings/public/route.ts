import { NextRequest, NextResponse } from 'next/server';
import { SettingsService } from '@/lib/settings-service';

// GET /api/settings/public - Get public settings (no auth required)
export async function GET(request: NextRequest) {
  try {
    const result = await SettingsService.getPublicSettings();

    // Set cache headers for public settings
    const response = NextResponse.json(result);
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');

    return response;
  } catch (error) {
    console.error('Public settings API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}