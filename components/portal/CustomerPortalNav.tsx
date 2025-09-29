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
  FileText,
  Building,
  MessageCircle
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface CustomerPortalNavProps {
  user: SupabaseUser;
  customer: any;
}

export function CustomerPortalNav({ user, customer }: CustomerPortalNavProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const navigation = [
    {
      name: 'Dashboard',
      href: '/portal',
      icon: Home
    },
    {
      name: 'Anfragen',
      href: '/portal/requests',
      icon: MessageSquare
    },
    {
      name: 'Chat & Support',
      href: '/portal/chat',
      icon: MessageCircle
    },
    {
      name: 'Dokumente',
      href: '/portal/documents',
      icon: FileText
    },
    {
      name: 'Profil',
      href: '/portal/profile',
      icon: User
    }
  ];

  return (
    <nav className="bg-gray-900/80 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center gap-4">
            <Link href="/portal" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">BSM Portal</h1>
                <p className="text-xs text-gray-400">Kundenbereich</p>
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
            {/* Customer Info */}
            <div className="hidden md:flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  {customer?.contact_person || customer?.company_name || 'Kunde'}
                </p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
              <Badge variant="secondary" className="text-xs">
                Kunde
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
          <div className="md:hidden border-t border-white/10 py-4">
            <div className="space-y-2">
              {/* Customer Info Mobile */}
              <div className="px-3 py-2 border-b border-white/10 mb-4">
                <p className="text-sm font-medium text-white">
                  {customer?.contact_person || customer?.company_name || 'Kunde'}
                </p>
                <p className="text-xs text-gray-400">{user.email}</p>
                <Badge variant="secondary" className="text-xs mt-2">
                  Kunde
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