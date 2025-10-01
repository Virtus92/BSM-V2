'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

type NotificationRow = {
  id: string;
  created_at: string;
  read_at: string | null;
  title: string;
  body: string | null;
  type: string;
  resource_type: string | null;
  resource_id: string | null;
};

export function NotificationsBell() {
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [unread, setUnread] = useState<NotificationRow[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUserId(data.user?.id || null);
    });
    return () => { mounted = false };
  }, [supabase]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const fetchUnread = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('id, created_at, read_at, title, body, type, resource_type, resource_id')
        .eq('user_id', userId)
        .is('read_at', null)
        .order('created_at', { ascending: false })
        .limit(10);
      if (!cancelled) setUnread(data || []);
    };
    fetchUnread();

    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, payload => {
        setUnread(prev => [payload.new as any, ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, payload => {
        setUnread(prev => prev.filter(n => n.id !== (payload.new as any).id));
      })
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel) };
  }, [userId, supabase]);

  const count = unread.length;
  const items = useMemo(() => unread.slice(0, 5), [unread]);

  const markAllRead = async () => {
    if (!userId || unread.length === 0) return;
    const now = new Date().toISOString();
    await supabase
      .from('notifications')
      .update({ read_at: now })
      .eq('user_id', userId)
      .is('read_at', null);
    setUnread([]);
    setOpen(false);
  };

  const goToItem = async (n: NotificationRow) => {
    // Best-effort mark read, then navigate based on resource
    if (userId) await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', n.id);
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    const inWorkspace = path.startsWith('/workspace') || path.startsWith('/dashboard');

    if (n.type === 'chat_new') {
      if (inWorkspace && n.resource_id) {
        router.push(`/workspace/customers/chat/${n.resource_id}`);
        return;
      }
      router.push('/portal/chat');
      return;
    }
    if (n.type === 'request_new' || n.resource_type === 'contact_request') {
      if (inWorkspace) {
        router.push('/workspace/requests');
        return;
      }
      router.push('/portal/requests');
      return;
    }
  };

  return (
    <div className="relative">
      <Button variant="ghost" size="sm" className="relative text-slate-300 hover:text-white hover:bg-white/10" onClick={() => setOpen(!open)}>
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-600 text-white text-[10px] leading-4 rounded-full text-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </Button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-md shadow-lg z-50">
          <div className="p-2 border-b border-slate-800 flex items-center justify-between">
            <div className="text-sm text-slate-200">Benachrichtigungen</div>
            <button className="text-xs text-blue-400 hover:underline" onClick={markAllRead}>Alle gelesen</button>
          </div>
          <div className="max-h-80 overflow-auto">
            {items.length === 0 ? (
              <div className="p-4 text-sm text-slate-400">Keine neuen Benachrichtigungen</div>
            ) : (
              items.map(n => (
                <button key={n.id} className="w-full text-left p-3 border-b border-slate-800 hover:bg-slate-800/60" onClick={() => goToItem(n)}>
                  <div className="text-sm text-white">{n.title}</div>
                  {n.body && <div className="text-xs text-slate-400 mt-1">{n.body}</div>}
                  <div className="text-[10px] text-slate-500 mt-1">{new Date(n.created_at).toLocaleString('de-DE')}</div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
