'use client';

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AuthButtonClient } from "@/components/auth-button-client";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { cn } from "@/lib/utils";
import { 
  Menu, 
  X, 
  Users, 
  FileText, 
  BarChart3, 
  MessageSquare,
  Home,
  Briefcase,
  Receipt
} from "lucide-react";

const navigationItems = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "CRM", href: "/crm", icon: Users },
  { name: "Projekte", href: "/projects", icon: BarChart3 },
  { name: "Dokumente", href: "/documents", icon: FileText },
  { name: "Angebote", href: "/quotes", icon: Receipt },
  { name: "Verträge", href: "/contracts", icon: Briefcase },
  { name: "Kontakt", href: "/contact", icon: MessageSquare },
];

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 glass-effect border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-mystery-gradient rounded-lg flex items-center justify-center mystery-glow">
              <span className="text-white font-bold text-sm">BSM</span>
            </div>
            <span className="text-xl font-bold text-mystery-gradient">
              Rising BSM V2
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group",
                    isActive
                      ? "bg-primary/10 text-primary shadow-mystery"
                      : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                  )}
                >
                  <item.icon className={cn(
                    "w-4 h-4 transition-transform duration-200 group-hover:scale-110",
                    isActive ? "text-primary" : ""
                  )} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Section */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeSwitcher />
            <AuthButtonClient />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeSwitcher />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-background/95 backdrop-blur-lg border-b border-white/10 shadow-lg">
            <div className="px-4 py-6 space-y-2">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary shadow-mystery"
                        : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                    )}
                  >
                    <item.icon className={cn(
                      "w-5 h-5",
                      isActive ? "text-primary" : ""
                    )} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              <div className="pt-4 border-t border-white/10">
                <AuthButtonClient />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}