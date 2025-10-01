import { createAdminClient } from '@/lib/supabase/admin';

async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error) return null;
    return data.user?.email || null;
  } catch {
    return null;
  }
}

async function isNotificationsEnabled(userId: string): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('user_profiles')
      .select('notifications_enabled')
      .eq('id', userId)
      .maybeSingle();
    return data?.notifications_enabled !== false; // default true
  } catch {
    return true;
  }
}

async function sendSlack(text: string) {
  const webhook = process.env.NOTIFICATIONS_SLACK_WEBHOOK_URL;
  if (!webhook) return;
  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
  } catch (e) {
    console.error('Slack notification error:', (e as Error).message);
  }
}

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATIONS_EMAIL_FROM || 'notifications@localhost';
  if (!apiKey) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ from, to, subject, html })
    });
  } catch (e) {
    console.error('Email notification error:', (e as Error).message);
  }
}

async function deliverNotification(opts: { userId: string; role: 'admin'|'employee'|'customer'; title: string; body?: string; type: string; data?: Record<string, any> }) {
  const enabled = await isNotificationsEnabled(opts.userId);
  if (!enabled) return;

  const email = await getUserEmail(opts.userId);
  const subject = opts.title;
  const html = `<div><p>${opts.body || ''}</p><pre style="font-size:12px;color:#666">${opts.type}</pre></div>`;

  // Fire-and-forget external sends; do not block
  void sendSlack(`(${opts.role}) ${opts.title}${opts.body ? ` — ${opts.body}` : ''}`);
  if (email) void sendEmail(email, subject, html);
}

type CreateNotificationInput = {
  userId: string;
  role: 'admin' | 'employee' | 'customer';
  type: 'request_new' | 'request_status' | 'chat_new' | 'system';
  resourceType?: string;
  resourceId?: string;
  title: string;
  body?: string;
  data?: Record<string, any>;
};

export async function createNotification(input: CreateNotificationInput) {
  const admin = createAdminClient();
  const { error } = await admin
    .from('notifications')
    .insert({
      user_id: input.userId,
      role: input.role,
      type: input.type,
      resource_type: input.resourceType || null,
      resource_id: input.resourceId || null,
      title: input.title,
      body: input.body || null,
      data: input.data || {}
    });
  if (error) throw error;

  // Try external delivery (email/slack) in background
  void deliverNotification({
    userId: input.userId,
    role: input.role,
    title: input.title,
    body: input.body,
    type: input.type,
    data: input.data
  });
}

export async function notifyAdmins(title: string, body?: string, payload?: { type?: CreateNotificationInput['type']; resourceType?: string; resourceId?: string; data?: Record<string, any> }) {
  const admin = createAdminClient();
  const { data: admins } = await admin
    .from('user_profiles')
    .select('id')
    .eq('user_type', 'admin')
    .eq('is_active', true);

  if (!admins || admins.length === 0) return;

  const rows = admins.map(a => ({
    user_id: a.id,
    role: 'admin',
    type: payload?.type || 'system',
    resource_type: payload?.resourceType || null,
    resource_id: payload?.resourceId || null,
    title,
    body: body || null,
    data: payload?.data || {}
  }));

  const { error } = await admin.from('notifications').insert(rows);
  if (error) throw error;
}
