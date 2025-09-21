"use client";

import { ReactNode } from "react";
import { DashboardSidebar, SidebarProvider, useSidebar } from "@/components/dashboard-sidebar";
import DashboardHeader from "@/components/dashboard-header";
import { cn } from "@/lib/utils";

function DashboardContent({ children }: { children: ReactNode }) {
  const { isOpen } = useSidebar();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main content area */}
      <div className={cn(
        "pt-16 transition-all duration-300 ease-out",
        // Mobile: no margin, sidebar overlay
        "ml-0",
        // Desktop: margin based on sidebar state
        isOpen ? "lg:ml-64" : "lg:ml-16"
      )}>
        <main className="p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Header - Fixed top, full width - LAST to be on top */}
      <DashboardHeader />
    </div>
  );
}

export default function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  );
}