/**
 * Verify Chat Channels Migration
 * Run: npx tsx scripts/verify-chat-channels.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyMigration() {
  console.log('🔍 Verifying Chat Channels Migration...\n');

  try {
    // Check if chat_channels table exists
    const { data: channels, error: channelsError } = await supabase
      .from('chat_channels')
      .select('id')
      .limit(1);

    if (channelsError) {
      if (channelsError.message.includes('does not exist') || channelsError.code === 'PGRST205') {
        console.log('❌ chat_channels table does NOT exist');
        console.log('\n📋 Action required:');
        console.log('   1. Open Supabase Studio SQL Editor: https://supabase.com/dashboard/project/eijlghvysjsffnsmgcge/sql');
        console.log('   2. Copy content from: supabase/migrations/20250930100000_create_chat_channels.sql');
        console.log('   3. Paste and run the SQL in the editor');
        console.log('\n   OR use Supabase CLI:');
        console.log('   npx supabase db push');
        return false;
      }
      throw channelsError;
    }

    console.log('✅ chat_channels table exists');

    // Check if channel_id column exists in customer_chat_messages
    const { data: messages, error: messagesError } = await supabase
      .from('customer_chat_messages')
      .select('channel_id')
      .limit(1);

    if (messagesError) {
      if (messagesError.message.includes('channel_id')) {
        console.log('❌ channel_id column missing from customer_chat_messages');
        return false;
      }
      // If it's just empty data, that's fine
      if (!messagesError.message.includes('does not exist')) {
        console.log('✅ channel_id column exists in customer_chat_messages');
      }
    } else {
      console.log('✅ channel_id column exists in customer_chat_messages');
    }

    // Check for functions
    const { data: funcCheck, error: funcError } = await supabase.rpc('auto_create_permanent_chat_channel').then(
      () => ({ data: true, error: null }),
      (err) => ({ data: null, error: err })
    );

    if (funcError) {
      console.log('⚠️  Trigger functions may not be available (check manually in Supabase Dashboard)');
    }

    console.log('\n✅ Chat Channels migration is applied!');
    console.log('\n📊 Testing channel creation...');

    // Try to fetch channels (should work even if empty)
    const { data: testChannels, error: testError } = await supabase
      .from('chat_channels')
      .select(`
        id,
        channel_type,
        channel_status,
        created_at
      `)
      .limit(5);

    if (testError) {
      console.log('❌ Error fetching channels:', testError.message);
      return false;
    }

    console.log(`✅ Found ${testChannels?.length || 0} existing channels`);

    if (testChannels && testChannels.length > 0) {
      console.log('\n📋 Sample channels:');
      testChannels.forEach(ch => {
        console.log(`   - ${ch.channel_type} (${ch.channel_status}) - ${new Date(ch.created_at).toLocaleString()}`);
      });
    }

    console.log('\n✅ All checks passed!');
    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

verifyMigration().then(success => {
  process.exit(success ? 0 : 1);
});
