'use client';

import { useState, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Receipt,
  Briefcase,
  Settings,
  Home,
  Menu,
  MessageSquare,
  Zap,
} from "lucide-react";

const SidebarContext = createContext<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}>({
  isOpen: false,
  setIsOpen: () => {},
});

export const useSidebarState = () => useContext(SidebarContext);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

const sidebarItems = [
  {
    name: "Übersicht",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Dashboard und Statistiken"
  },
  {
    name: "CRM",
    href: "/dashboard/crm",
    icon: Users,
    description: "Kundenverwaltung"
  },
  {
    name: "Anfragen",
    href: "/dashboard/requests",
    icon: MessageSquare,
    description: "Kontaktanfragen"
  },
  {
    name: "Automation",
    href: "/dashboard/automation",
    icon: Zap,
    description: "Automatisierungen & Workflows"
  },
  {
    name: "Projekte",
    href: "/dashboard/projects",
    icon: BarChart3,
    description: "Projekt-Management"
  },
  {
    name: "Dokumente",
    href: "/dashboard/documents",
    icon: FileText,
    description: "Datei-Verwaltung"
  },
  {
    name: "Angebote",
    href: "/dashboard/quotes",
    icon: Receipt,
    description: "Angebotserstellung"
  },
  {
    name: "Verträge",
    href: "/dashboard/contracts",
    icon: Briefcase,
    description: "Vertragsmanagement"
  },
  {
    name: "Einstellungen",
    href: "/dashboard/settings",
    icon: Settings,
    description: "System-Einstellungen"
  },
];

export function SimpleSidebar() {
  const { isOpen, setIsOpen } = useSidebarState();
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-card border-r border-border z-50 overflow-hidden",
          "w-16 lg:transition-all lg:duration-300",
          "lg:w-16",
          isOpen && "lg:w-64"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Menu Toggle */}
          <div className="border-b border-border p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className={cn(
                "w-full h-12 hover:bg-primary/10 justify-center px-0",
                "lg:transition-all lg:duration-200",
                "lg:justify-center lg:px-0",
                isOpen && "lg:justify-start lg:px-3"
              )}
            >
              <Menu className="w-5 h-5 flex-shrink-0" />
              {isOpen && <span className="ml-3 text-sm hidden lg:inline">Menü schließen</span>}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6 overflow-y-auto">
            <div className="space-y-1 px-2">
              {sidebarItems.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 transition-all duration-200 group relative",
                      "hover:bg-primary/10",
                      isOpen ? "justify-start" : "justify-center",
                      isActive
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <item.icon className={cn(
                      "w-5 h-5 flex-shrink-0 transition-all duration-200",
                      isActive ? "text-primary" : "group-hover:text-primary"
                    )} />

                    {isOpen && (
                      <div className="flex flex-col min-w-0 hidden lg:flex">
                        <span className="text-sm font-medium truncate">{item.name}</span>
                        <span className="text-xs text-muted-foreground truncate">
                          {item.description}
                        </span>
                      </div>
                    )}

                    {/* Tooltip for collapsed state - desktop only */}
                    {!isOpen && (
                      <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-popover border border-border p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 hidden lg:block">
                        <div className="text-sm font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground">{item.description}</div>
                      </div>
                    )}

                    {isActive && (
                      <div className="absolute right-1 w-1 h-8 bg-primary" />
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Home Link */}
          <div className="border-t border-border p-2">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-3 text-muted-foreground hover:text-foreground hover:bg-primary/10 group justify-center",
                "lg:transition-all lg:duration-200",
                "lg:justify-center",
                isOpen && "lg:justify-start"
              )}
            >
              <Home className="w-5 h-5 flex-shrink-0 lg:group-hover:scale-105 lg:transition-transform" />
              {isOpen && <span className="text-sm hidden lg:inline">Zur Homepage</span>}

              {!isOpen && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-popover border border-border p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 hidden lg:block">
                  <div className="text-sm">Zur Homepage</div>
                </div>
              )}
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
