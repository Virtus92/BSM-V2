import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/chat/channels/[id]/close
 * Close an active chat channel
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (!profile || !['employee', 'admin'].includes(profile.user_type)) {
      return NextResponse.json(
        { error: 'Only employees and admins can close channels' },
        { status: 403 }
      );
    }

    const channelId = params.id;

    // Get channel to verify it exists and is active
    const { data: channel, error: channelError } = await supabase
      .from('chat_channels')
      .select('id, channel_status, channel_type, employee_id')
      .eq('id', channelId)
      .single();

    if (channelError || !channel) {
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      );
    }

    // Check if channel is already closed
    if (channel.channel_status === 'closed') {
      return NextResponse.json(
        { error: 'Channel is already closed' },
        { status: 400 }
      );
    }

    // Only allow closing if user is the assigned employee or admin
    if (profile.user_type !== 'admin' && channel.employee_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only close your own channels' },
        { status: 403 }
      );
    }

    // Don't allow closing permanent channels
    if (channel.channel_type === 'permanent') {
      return NextResponse.json(
        { error: 'Permanent channels cannot be manually closed' },
        { status: 400 }
      );
    }

    // Close the channel
    const { data: updatedChannel, error: updateError } = await supabase
      .from('chat_channels')
      .update({
        channel_status: 'closed',
        closed_at: new Date().toISOString()
      })
      .eq('id', channelId)
      .select()
      .single();

    if (updateError) {
      console.error('Error closing channel:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Channel closed successfully',
      channel: updatedChannel
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/chat/channels/[id]/close:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
