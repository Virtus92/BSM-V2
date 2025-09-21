"use client";

import { ReactNode } from "react";
import { SimpleSidebar, SidebarProvider, useSidebarState } from "@/components/dashboard-sidebar-simple";
import DashboardHeader from "@/components/dashboard-header";

function FrameContent({ children }: { children: ReactNode }) {
  const { isOpen } = useSidebarState();

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed header covers full width */}
      <DashboardHeader />

      {/* Fixed sidebar */}
      <SimpleSidebar />

      {/* Main content area with dynamic spacing */}
      <div
        className={`min-h-screen pt-16 ml-16 lg:transition-all lg:duration-300 lg:${
          isOpen ? "ml-64" : "ml-16"
        }`}
        style={{ minHeight: '100vh' }}
      >
        {/* Page content */}
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function SimpleDashboardFrame({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <FrameContent>{children}</FrameContent>
    </SidebarProvider>
  );
}