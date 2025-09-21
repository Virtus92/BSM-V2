'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import UserDropdown from "@/components/user-dropdown";
import { useSidebar } from "@/components/dashboard-sidebar";
import {
  Bell,
  Search,
  LayoutDashboard,
  Menu,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function DashboardHeader() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { toast } = useToast();
  const { toggleSidebar } = useSidebar();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 z-[9999]">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-slate-300 hover:text-white hover:bg-slate-700/50"
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Logo - immer sichtbar, fixe Position */}
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>

          {/* Text - immer sichtbar */}
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              BSM V2
            </h1>
          </div>
        </div>

        {/* Center - Search */}
        <div className={cn(
          "hidden md:flex items-center relative transition-all duration-300",
          searchOpen ? "w-80" : "w-60"
        )}>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Suchen..."
            className="pl-10 bg-slate-800/50 border-slate-600 focus:border-blue-500 text-white placeholder:text-slate-400"
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setSearchOpen(false)}
          />
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">

          {/* Mobile Search Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden text-slate-300 hover:text-white hover:bg-slate-700/50"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="relative text-slate-300 hover:text-white hover:bg-slate-700/50"
            onClick={() => {
              toast({
                title: "Benachrichtigungen",
                description: "Feature wird bald verfügbar sein!",
              });
            }}
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
          </Button>

          {/* User Profile Dropdown */}
          <UserDropdown />
        </div>
      </div>

      {/* Mobile Search Bar */}
      {mobileSearchOpen && (
        <div className="md:hidden border-t border-slate-700/50 p-4 bg-slate-900/95">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Suchen..."
              className="pl-10 bg-slate-800/50 border-slate-600 focus:border-blue-500 text-white placeholder:text-slate-400"
              autoFocus
              onBlur={() => setMobileSearchOpen(false)}
            />
          </div>
        </div>
      )}
    </header>
  );
}