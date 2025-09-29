// Note: Server-side imports will be dynamically imported where needed

export type ActivityAction =
  | 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'ASSIGN' | 'APPROVE'
  | 'LOGIN' | 'LOGOUT' | 'ACCESS_DENIED' | 'SETUP_COMPLETE'
  | 'USER_CREATED' | 'USER_UPDATED' | 'USER_DELETED'
  | 'CUSTOMER_CREATED' | 'CUSTOMER_UPDATED' | 'CUSTOMER_DELETED'
  | 'REQUEST_RECEIVED' | 'REQUEST_UPDATED' | 'REQUEST_CONVERTED' | 'REQUEST_RESPONDED'
  | 'WORKFLOW_EXECUTED' | 'WORKFLOW_FAILED' | 'SYSTEM_EVENT';

export type ResourceType =
  | 'user' | 'customer' | 'contact_request' | 'workflow' | 'system'
  | 'authentication' | 'customer_note' | 'security_event';

export type ActivitySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ActivityLogEntry {
  user_id?: string | null;
  action: ActivityAction;
  resource_type: ResourceType;
  resource_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  request_path?: string | null;
  request_method?: string | null;
  additional_context?: Record<string, any>;
  severity?: ActivitySeverity;
  description?: string;
}

/**
 * Log user activity - Server-side function
 */
export async function logActivity(entry: ActivityLogEntry): Promise<void> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const admin = createAdminClient();

    await admin.from('user_activity_logs').insert({
      user_id: entry.user_id,
      action: entry.action,
      resource_type: entry.resource_type,
      resource_id: entry.resource_id,
      ip_address: entry.ip_address,
      user_agent: entry.user_agent,
      request_path: entry.request_path,
      request_method: entry.request_method,
      additional_context: entry.additional_context || {},
      severity: entry.severity || 'low',
      description: entry.description
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw - logging failures shouldn't break the application
  }
}

/**
 * Log authentication events
 */
export async function logAuthActivity(
  userId: string | null,
  action: 'LOGIN' | 'LOGOUT' | 'ACCESS_DENIED' | 'SETUP_COMPLETE',
  details: Record<string, any> = {},
  request?: {
    ip?: string;
    userAgent?: string;
    path?: string;
    method?: string;
  }
): Promise<void> {
  await logActivity({
    user_id: userId,
    action,
    resource_type: 'authentication',
    ip_address: request?.ip,
    user_agent: request?.userAgent,
    request_path: request?.path,
    request_method: request?.method,
    additional_context: details,
    severity: action === 'ACCESS_DENIED' ? 'medium' : 'low'
  });
}

/**
 * Log customer operations
 */
export async function logCustomerActivity(
  userId: string,
  action: 'CUSTOMER_CREATED' | 'CUSTOMER_UPDATED' | 'CUSTOMER_DELETED',
  customerId: string,
  details: Record<string, any> = {}
): Promise<void> {
  await logActivity({
    user_id: userId,
    action,
    resource_type: 'customer',
    resource_id: customerId,
    additional_context: details,
    severity: action === 'CUSTOMER_DELETED' ? 'medium' : 'low'
  });
}

/**
 * Log contact request operations
 */
export async function logRequestActivity(
  userId: string | null,
  action: 'REQUEST_RECEIVED' | 'REQUEST_UPDATED' | 'REQUEST_CONVERTED' | 'REQUEST_RESPONDED',
  requestId: string,
  details: Record<string, any> = {}
): Promise<void> {
  await logActivity({
    user_id: userId,
    action,
    resource_type: 'contact_request',
    resource_id: requestId,
    additional_context: details,
    severity: 'low'
  });
}

/**
 * Log user management operations (admin only)
 */
export async function logUserActivity(
  adminUserId: string,
  action: 'USER_CREATED' | 'USER_UPDATED' | 'USER_DELETED',
  targetUserId: string,
  details: Record<string, any> = {}
): Promise<void> {
  await logActivity({
    user_id: adminUserId,
    action,
    resource_type: 'user',
    resource_id: targetUserId,
    additional_context: details,
    severity: action === 'USER_DELETED' ? 'medium' : 'low'
  });
}

/**
 * Log system events
 */
export async function logSystemActivity(
  userId: string | null,
  action: 'SYSTEM_EVENT',
  details: Record<string, any> = {},
  severity: ActivitySeverity = 'low'
): Promise<void> {
  await logActivity({
    user_id: userId,
    action,
    resource_type: 'system',
    additional_context: details,
    severity
  });
}

/**
 * Get user activity history
 */
export async function getUserActivityHistory(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<any[]> {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('user_activity_logs')
      .select(`
        id,
        action,
        resource_type,
        resource_id,
        created_at,
        severity,
        description,
        additional_context
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Failed to fetch user activity:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch user activity:', error);
    return [];
  }
}

/**
 * Get system activity overview (admin only)
 */
export async function getSystemActivityOverview(
  limit: number = 100,
  filters: {
    severity?: ActivitySeverity;
    resource_type?: ResourceType;
    action?: ActivityAction;
    start_date?: string;
    end_date?: string;
  } = {}
): Promise<any[]> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const admin = createAdminClient();

    let query = admin
      .from('user_activity_logs')
      .select(`
        id,
        action,
        resource_type,
        resource_id,
        created_at,
        severity,
        description,
        additional_context,
        user_id,
        ip_address
      `);

    // Apply filters
    if (filters.severity) {
      query = query.eq('severity', filters.severity);
    }
    if (filters.resource_type) {
      query = query.eq('resource_type', filters.resource_type);
    }
    if (filters.action) {
      query = query.eq('action', filters.action);
    }
    if (filters.start_date) {
      query = query.gte('created_at', filters.start_date);
    }
    if (filters.end_date) {
      query = query.lte('created_at', filters.end_date);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch system activity:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch system activity:', error);
    return [];
  }
}

