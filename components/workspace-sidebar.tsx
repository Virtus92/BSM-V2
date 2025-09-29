'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/dashboard-sidebar';
import {
  Home,
  Users,
  MessageSquare,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  ClipboardList,
  Bot
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function WorkspaceSidebar() {
  const pathname = usePathname();
  const { isOpen, toggleSidebar } = useSidebar();
  const supabase = createClient();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('user_profiles')
        .select('user_type')
        .eq('id', user.id)
        .single();
      if (!cancelled) setIsAdmin(data?.user_type === 'admin');
    })();
    return () => { cancelled = true };
  }, [supabase]);

  const items = [
    { name: 'Workspace', href: '/workspace', icon: Home },
    { name: 'Kunden', href: '/workspace/customers', icon: Users },
    { name: 'Anfragen', href: '/workspace/requests', icon: MessageSquare },
    { name: 'Aufgaben', href: '/workspace/tasks', icon: ClipboardList },
    { name: 'Aktivität', href: '/workspace/activity', icon: Activity },
    { name: 'Automation', href: '/workspace/automation', icon: Bot },
    { name: 'Chat', href: '/workspace/customers/chat', icon: MessageCircle },
  ];

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={toggleSidebar} />
      )}

      <aside
        className={cn(
          'fixed top-16 left-0 h-[calc(100vh-4rem)] bg-slate-900/95 backdrop-blur-sm border-r border-slate-700/50 z-50 transition-all duration-300 ease-out flex flex-col',
          'transform -translate-x-full lg:translate-x-0',
          isOpen && 'translate-x-0',
          isOpen ? 'w-64' : 'w-64 lg:w-16'
        )}
      >
        <nav className="flex-1 py-4 space-y-1">
          {items.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/workspace' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <div key={item.name} className="px-3">
                <Link
                  href={item.href}
                  className={cn(
                    'group relative flex items-center h-12 px-3 rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white border border-blue-500/30'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  )}
                  title={!isOpen ? item.name : undefined}
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    <Icon className={cn('w-5 h-5 flex-shrink-0 transition-colors duration-200', isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-white')} />
                  </div>
                  {isActive && <div className="w-2 h-2 rounded-full bg-blue-400 ml-2" />}
                  <span className={cn('ml-3 text-sm font-medium transition-all duration-300', isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2')}>
                    {item.name}
                  </span>
                </Link>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-slate-700/50 p-3 space-y-2">
          {isAdmin && (
            <Link
              href="/dashboard"
              className="group flex items-center h-12 px-3 rounded-lg text-slate-400 hover:bg-slate-700/50 hover:text-white transition-all duration-200"
              title={!isOpen ? 'Admin Dashboard' : undefined}
            >
              <Settings className="w-5 h-5 flex-shrink-0 transition-colors duration-200 group-hover:text-white" />
              <span className={cn('ml-3 text-sm font-medium transition-all duration-300', isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2')}>
                Admin Dashboard
              </span>
            </Link>
          )}
        </div>

        <div
          className="absolute left-full top-16 cursor-pointer bg-slate-900/95 w-[30px] h-[40px] hidden lg:flex items-center justify-center"
          onClick={toggleSidebar}
          style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }}
        >
          {isOpen ? (
            <ChevronLeft className="w-4 h-4 text-slate-400 ml-[-6px]" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400 ml-[-3px]" />
          )}
        </div>
      </aside>
    </>
  );
}

