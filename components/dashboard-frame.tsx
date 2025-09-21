"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SidebarProvider, useSidebar, DashboardSidebar } from "@/components/dashboard-sidebar";
import DashboardHeader from "@/components/dashboard-header";

function FrameInner({ children }: { children: ReactNode }) {
  const { isOpen } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed sidebar renders itself */}
      <DashboardSidebar />

      {/* Fixed header covers full width */}
      <DashboardHeader />

      {/* Main content area with proper spacing for fixed header and sidebar */}
      <div className={cn(
        "min-h-screen pt-16 transition-all duration-300",
        // Mobile full width; desktop shifts based on sidebar state
        "ml-0",
        isOpen ? "lg:ml-64" : "lg:ml-16"
      )}>
        {/* Page content */}
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function DashboardFrame({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <FrameInner>{children}</FrameInner>
    </SidebarProvider>
  );
}
