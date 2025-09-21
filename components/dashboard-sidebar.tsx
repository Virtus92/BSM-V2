'use client';

import { createContext, useContext, useState, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Home,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Bot,
  Settings
} from "lucide-react";

const SidebarContext = createContext<{
  isOpen: boolean;
  toggleSidebar: () => void;
}>({
  isOpen: false,
  toggleSidebar: () => {}
});

export const useSidebar = () => useContext(SidebarContext);

export function SidebarProvider({ children }: { children: ReactNode }) {
  // Default to open on desktop, closed on mobile
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <SidebarContext.Provider value={{ isOpen, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

const sidebarItems = [
  {
    name: "Übersicht",
    href: "/dashboard",
    icon: LayoutDashboard
  },
  {
    name: "CRM",
    href: "/dashboard/crm",
    icon: Users
  },
  {
    name: "Anfragen",
    href: "/dashboard/requests",
    icon: MessageSquare
  },
  {
    name: "Automation Center",
    href: "/dashboard/automation",
    icon: Bot
  }
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { isOpen, toggleSidebar } = useSidebar();

  return (
    <>
      {/* Mobile Blur Overlay - nur auf Mobile wenn sidebar offen ist */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-16 left-0 h-[calc(100vh-4rem)] bg-slate-900/95 backdrop-blur-sm border-r border-slate-700/50 z-50 transition-all duration-300 ease-out flex flex-col",
          // Mobile: Hidden by default, full width when open
          "transform -translate-x-full lg:translate-x-0",
          isOpen && "translate-x-0",
          // Desktop: Fixed width based on state
          isOpen ? "w-64" : "w-64 lg:w-16"
        )}
      >

        {/* Navigation */}
        <nav className="flex-1 py-4 space-y-1">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <div key={item.name} className="px-3">
                <Link
                  href={item.href}
                  className={cn(
                    "group relative flex items-center h-12 px-3 rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white border border-blue-500/30"
                      : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                  )}
                  title={!isOpen ? item.name : undefined}
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    <item.icon className={cn(
                      "w-5 h-5 flex-shrink-0 transition-colors duration-200",
                      isActive ? "text-blue-400" : "text-slate-400 group-hover:text-white"
                    )} />
                  </div>

                  {/* Active indicator neben dem Icon */}
                  {isActive && (
                    <div className="w-2 h-2 rounded-full bg-blue-400 ml-2" />
                  )}

                  <span className={cn(
                    "ml-3 text-sm font-medium transition-all duration-300",
                    isOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
                  )}>
                    {item.name}
                  </span>
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-slate-700/50 p-3">
          <Link
            href="/"
            className="group flex items-center h-12 px-3 rounded-lg text-slate-400 hover:bg-slate-700/50 hover:text-white transition-all duration-200"
            title={!isOpen ? "Exit to Home" : undefined}
          >
            <Home className="w-5 h-5 flex-shrink-0 transition-colors duration-200 group-hover:text-white" />
            <span className={cn(
              "ml-3 text-sm font-medium transition-all duration-300",
              isOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
            )}>
              Exit to Home
            </span>
          </Link>
        </div>

        {/* Desktop Toggle Button - nur auf Desktop sichtbar */}
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
