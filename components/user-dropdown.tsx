'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import {
  User as UserIcon,
  Settings,
  LogOut,
  Shield,
  Building2,
  Mail,
  Clock,
  ChevronDown,
  Bell,
  CreditCard,
  HelpCircle
} from "lucide-react";

interface UserProfile {
  full_name?: string;
  role?: string;
  team?: string;
  avatar_url?: string;
  department?: string;
  last_login?: string;
}

export default function UserDropdown() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const unsub: { current?: (() => void) } = { current: undefined };

    const loadUserData = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('UserDropdown: Session error:', sessionError);
          setLoading(false);
          return;
        }

        const currentUser = sessionData.session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          setUserProfile({
            full_name: currentUser.user_metadata?.full_name ||
                      currentUser.user_metadata?.name ||
                      currentUser.email?.split('@')[0] ||
                      "Benutzer",
            role: "Administrator",
            team: "Development Team",
            department: "IT",
            last_login: new Date().toISOString()
          });
        } else {
          setUserProfile(null);
        }

        setLoading(false);
      } catch (error) {
        console.error('UserDropdown: Error loading user data:', error);
        setLoading(false);
      }
    };

    loadUserData();

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);

      if (newUser) {
        setUserProfile({
          full_name: newUser.user_metadata?.full_name ||
                    newUser.user_metadata?.name ||
                    newUser.email?.split('@')[0] ||
                    "Benutzer",
          role: "Administrator",
          team: "Development Team",
          department: "IT",
          last_login: new Date().toISOString()
        });
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

        unsub.current = () => data.subscription.unsubscribe();
    return () => { if (unsub.current) unsub.current(); };
  }, [supabase]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getRoleColor = (role?: string) => {
    switch (role?.toLowerCase()) {
      case 'administrator': case 'admin': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'manager': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'developer': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'designer': return 'bg-pink-500/10 text-pink-500 border-pink-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  if (loading) {
    return (
      <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
    );
  }

  if (!user || !userProfile) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="outline" className="glass-effect border-white/20">
          <a href="/auth/login">Anmelden</a>
        </Button>
      </div>
    );
  }

  const userInitials = userProfile.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || 'U';

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-3 h-auto p-2 hover:bg-white/5 transition-all duration-200"
        >
          {/* Avatar */}
          <div className="relative">
            <Avatar className="w-8 h-8 ring-2 ring-primary/20">
              <AvatarFallback className="bg-mystery-gradient text-white font-medium text-sm">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
          </div>

          {/* User Info - Hidden on mobile */}
          <div className="hidden lg:flex flex-col items-start">
            <span className="text-sm font-medium">
              {userProfile.full_name}
            </span>
            <span className="text-xs text-muted-foreground">
              {userProfile.role}
            </span>
          </div>

          <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-80 glass-effect border-white/20 bg-card/95 backdrop-blur-xl"
        align="end"
        sideOffset={8}
      >
        {/* User Info Header */}
        <DropdownMenuLabel className="p-4 pb-2">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 ring-2 ring-primary/20">
              <AvatarFallback className="bg-mystery-gradient text-white font-medium">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-base">
                {userProfile.full_name}
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {user.email}
              </div>
            </div>
          </div>
        </DropdownMenuLabel>

        {/* Role & Team Info */}
        <div className="px-4 pb-2 space-y-2">
          <div className="flex items-center justify-between">
            <Badge className={cn("text-xs px-2 py-1", getRoleColor(userProfile.role))}>
              <Shield className="w-3 h-3 mr-1" />
              {userProfile.role}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>Online</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Building2 className="w-3 h-3" />
            <span>{userProfile.team} • {userProfile.department}</span>
          </div>
        </div>

        <DropdownMenuSeparator className="bg-white/10" />

        {/* Profile Actions */}
        <DropdownMenuItem className="cursor-pointer hover:bg-white/5 focus:bg-white/5">
          <UserIcon className="w-4 h-4 mr-3" />
          Mein Profil
        </DropdownMenuItem>

        <DropdownMenuItem
          className="cursor-pointer hover:bg-white/5 focus:bg-white/5"
          onClick={() => router.push('/dashboard/settings')}
        >
          <Settings className="w-4 h-4 mr-3" />
          Einstellungen
        </DropdownMenuItem>

        <DropdownMenuItem className="cursor-pointer hover:bg-white/5 focus:bg-white/5">
          <Bell className="w-4 h-4 mr-3" />
          Benachrichtigungen
          <Badge variant="destructive" className="ml-auto text-xs">
            3
          </Badge>
        </DropdownMenuItem>

        <DropdownMenuItem className="cursor-pointer hover:bg-white/5 focus:bg-white/5">
          <CreditCard className="w-4 h-4 mr-3" />
          Abrechnung
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-white/10" />

        <DropdownMenuItem className="cursor-pointer hover:bg-white/5 focus:bg-white/5">
          <HelpCircle className="w-4 h-4 mr-3" />
          Hilfe & Support
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-white/10" />

        {/* Sign Out */}
        <DropdownMenuItem
          className="cursor-pointer hover:bg-red-500/10 focus:bg-red-500/10 text-red-500"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-3" />
          Abmelden
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}