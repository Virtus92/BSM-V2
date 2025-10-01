import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SettingsService } from '@/lib/settings-service';
import type { UserSettingUpdatePayload } from '@/lib/settings-types';

// GET /api/settings/user - Get user profile settings
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await SettingsService.getUserSettings(user.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('User settings API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/settings/user - Update user profile setting
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload: UserSettingUpdatePayload = await request.json();

    // Validate payload
    if (!payload.category || !payload.key || payload.value === undefined) {
      return NextResponse.json(
        { success: false, error: 'Category, key and value are required' },
        { status: 400 }
      );
    }

    const result = await SettingsService.updateUserSetting(user.id, payload);
    return NextResponse.json(result);
  } catch (error) {
    console.error('User settings update error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}