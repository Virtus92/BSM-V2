'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  MessageSquare,
  Users,
  FileText,
  MessageCircle,
  Calendar,
  Activity,
  Building,
  ClipboardList
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface WorkspaceNavProps {
  user: SupabaseUser;
  profile: {
    user_type: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
  };
}

export function WorkspaceNav({ user, profile }: WorkspaceNavProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const navigation = [
    {
      name: 'Workspace',
      href: '/workspace',
      icon: Home
    },
    {
      name: 'Aufgaben',
      href: '/workspace/tasks',
      icon: ClipboardList
    },
    {
      name: 'Kunden',
      href: '/workspace/customers',
      icon: Users
    },
    {
      name: 'Anfragen',
      href: '/workspace/requests',
      icon: MessageSquare
    },
    {
      name: 'Chat',
      href: '/workspace/customers/chat',
      icon: MessageCircle
    },
    {
      name: 'Workflows',
      href: '/workspace/automation',
      icon: Calendar
    }
  ];

  return (
    <nav className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center gap-4">
            <Link href="/workspace" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
                <Building className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">BSM Workspace</h1>
                <p className="text-xs text-gray-400">Mitarbeiterbereich</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {/* User Info */}
            <div className="hidden md:flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  {profile?.first_name} {profile?.last_name}
                </p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
              <Badge variant="secondary" className="text-xs">
                {profile?.user_type === 'admin' ? 'Administrator' : 'Mitarbeiter'}
              </Badge>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden"
              >
                {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </Button>

              {/* Admin Dashboard Access */}
              {profile?.user_type === 'admin' && (
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="hidden md:flex">
                    <Settings className="w-4 h-4 mr-2" />
                    Admin Dashboard
                  </Button>
                </Link>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="hidden md:flex"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Abmelden
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-slate-700/50 py-4">
            <div className="space-y-2">
              {/* User Info Mobile */}
              <div className="px-3 py-2 border-b border-slate-700/50 mb-4">
                <p className="text-sm font-medium text-white">
                  {profile?.first_name} {profile?.last_name}
                </p>
                <p className="text-xs text-gray-400">{user.email}</p>
                <Badge variant="secondary" className="text-xs mt-2">
                  {profile?.user_type === 'admin' ? 'Administrator' : 'Mitarbeiter'}
                </Badge>
              </div>

              {/* Navigation Links */}
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                );
              })}

              {/* Admin Dashboard Access Mobile */}
              {profile?.user_type === 'admin' && (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-sm font-medium">Admin Dashboard</span>
                </Link>
              )}

              {/* Sign Out */}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors w-full text-left"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Abmelden</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
