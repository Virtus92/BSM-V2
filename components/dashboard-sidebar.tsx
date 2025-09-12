'use client';

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AuthButtonClient } from "@/components/auth-button-client";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard,
  Users, 
  FileText, 
  BarChart3, 
  Receipt,
  Briefcase,
  Settings,
  ChevronLeft,
  ChevronRight,
  Home
} from "lucide-react";

const sidebarItems = [
  { name: "Übersicht", href: "/dashboard", icon: LayoutDashboard },
  { name: "CRM", href: "/dashboard/crm", icon: Users },
  { name: "Projekte", href: "/dashboard/projects", icon: BarChart3 },
  { name: "Dokumente", href: "/dashboard/documents", icon: FileText },
  { name: "Angebote", href: "/dashboard/quotes", icon: Receipt },
  { name: "Verträge", href: "/dashboard/contracts", icon: Briefcase },
  { name: "Einstellungen", href: "/dashboard/settings", icon: Settings },
];

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full glass-effect border-r border-white/10 transition-all duration-300 z-40",
        collapsed ? "w-16" : "w-64"
      )}>
        <div className="p-4">
          {/* Logo */}
          <div className="flex items-center justify-between mb-8">
            {!collapsed && (
              <Link href="/" className="flex items-center space-x-2 group">
                <div className="w-8 h-8 bg-mystery-gradient rounded-lg flex items-center justify-center mystery-glow">
                  <span className="text-white font-bold text-sm">BSM</span>
                </div>
                <span className="text-lg font-bold text-mystery-gradient">
                  Rising BSM V2
                </span>
              </Link>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className="p-2"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group",
                    isActive
                      ? "bg-primary/10 text-primary shadow-mystery border border-primary/20"
                      : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon className={cn(
                    "flex-shrink-0 w-5 h-5 transition-transform duration-200 group-hover:scale-110",
                    isActive ? "text-primary" : ""
                  )} />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Section */}
          <div className="absolute bottom-4 left-4 right-4">
            {/* Back to Home */}
            <Link
              href="/"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200 mb-4 group"
              title={collapsed ? "Zur Homepage" : undefined}
            >
              <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
              {!collapsed && <span>Zur Homepage</span>}
            </Link>
            
            {/* User Info */}
            {!collapsed && (
              <div className="glass-effect p-3 rounded-lg border border-white/10">
                <AuthButtonClient />
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      <div className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-30" />
    </>
  );
}