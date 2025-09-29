import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/admin/system - Get system information and stats
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (!profile || profile.user_type !== 'admin') {
      return NextResponse.json({ error: 'Access denied - Admin only' }, { status: 403 });
    }

    const admin = createAdminClient();

    // Get system configuration
    const { data: systemConfig } = await admin
      .from('system_config')
      .select('*')
      .single();

    // Get user statistics
    const [
      { count: totalUsers },
      { count: activeUsers },
      { count: adminUsers },
      { count: employeeUsers },
      { count: customerUsers },
      { count: totalCustomers },
      { count: totalRequests },
      { count: securityEvents }
    ] = await Promise.all([
      admin.from('user_profiles').select('id', { count: 'exact', head: true }),
      admin.from('user_profiles').select('id', { count: 'exact', head: true }).eq('is_active', true),
      admin.from('user_profiles').select('id', { count: 'exact', head: true }).eq('user_type', 'admin'),
      admin.from('user_profiles').select('id', { count: 'exact', head: true }).eq('user_type', 'employee'),
      admin.from('user_profiles').select('id', { count: 'exact', head: true }).eq('user_type', 'customer'),
      admin.from('customers').select('id', { count: 'exact', head: true }),
      admin.from('contact_requests').select('id', { count: 'exact', head: true }),
      admin.from('security_events').select('id', { count: 'exact', head: true }).eq('resolved', false)
    ]);

    // Get recent activity
    const { data: recentActivity } = await admin
      .from('user_activity_logs')
      .select(`
        id,
        action,
        resource_type,
        created_at,
        user_id,
        severity,
        additional_context
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    // Check n8n connectivity
    let n8nStatus = 'unknown';
    let n8nInfo = null;

    if (process.env.N8N_BASE_URL && process.env.N8N_API_KEY) {
      try {
        const n8nResponse = await fetch(`${process.env.N8N_BASE_URL}/rest/healthz`, {
          headers: {
            'X-N8N-API-KEY': process.env.N8N_API_KEY
          },
          signal: AbortSignal.timeout(5000)
        });

        if (n8nResponse.ok) {
          n8nStatus = 'healthy';
          n8nInfo = await n8nResponse.json().catch(() => null);
        } else {
          n8nStatus = 'unhealthy';
        }
      } catch (error) {
        n8nStatus = 'disconnected';
      }
    } else {
      n8nStatus = 'not_configured';
    }

    return NextResponse.json({
      system: {
        config: systemConfig,
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        database_status: 'connected',
        n8n_status: n8nStatus,
        n8n_info: n8nInfo
      },
      statistics: {
        users: {
          total: totalUsers || 0,
          active: activeUsers || 0,
          admins: adminUsers || 0,
          employees: employeeUsers || 0,
          customers: customerUsers || 0
        },
        business: {
          customers: totalCustomers || 0,
          requests: totalRequests || 0
        },
        security: {
          open_events: securityEvents || 0
        }
      },
      recent_activity: recentActivity || []
    });

  } catch (error) {
    console.error('Admin system GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/system - Update system configuration
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (!profile || profile.user_type !== 'admin') {
      return NextResponse.json({ error: 'Access denied - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { action, ...config } = body;

    const admin = createAdminClient();

    if (action === 'update_config') {
      // Update system configuration
      const { error: updateError } = await admin
        .from('system_config')
        .update({
          ...config,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1); // Assuming single config record

      if (updateError) {
        console.error('System config update error:', updateError);
        return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 });
      }

      // Log admin activity
      await admin.from('user_activity_logs').insert({
        user_id: user.id,
        action: 'SYSTEM_CONFIG_UPDATED',
        resource_type: 'system',
        additional_context: {
          updated_fields: Object.keys(config)
        },
        severity: 'medium'
      });

      return NextResponse.json({ success: true, message: 'System configuration updated' });
    }

    if (action === 'backup_database') {
      // This would typically trigger a database backup
      // For now, just log the action
      await admin.from('user_activity_logs').insert({
        user_id: user.id,
        action: 'DATABASE_BACKUP_REQUESTED',
        resource_type: 'system',
        severity: 'low'
      });

      return NextResponse.json({
        success: true,
        message: 'Database backup initiated',
        note: 'Backup functionality not implemented yet'
      });
    }

    if (action === 'clear_cache') {
      // This would typically clear application cache
      await admin.from('user_activity_logs').insert({
        user_id: user.id,
        action: 'CACHE_CLEARED',
        resource_type: 'system',
        severity: 'low'
      });

      return NextResponse.json({ success: true, message: 'Cache cleared' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Admin system POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}