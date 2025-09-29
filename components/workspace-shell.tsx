"use client";

import { ReactNode } from "react";
import { SidebarProvider, useSidebar } from "@/components/dashboard-sidebar";
import DashboardHeader from "@/components/dashboard-header";
import { WorkspaceSidebar } from "@/components/workspace-sidebar";
import { cn } from "@/lib/utils";

function WorkspaceContent({ children }: { children: ReactNode }) {
  const { isOpen } = useSidebar();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Sidebar */}
      <WorkspaceSidebar />

      {/* Main content area */}
      <div
        className={cn(
          "pt-16 transition-all duration-300 ease-out",
          "ml-0",
          isOpen ? "lg:ml-64" : "lg:ml-16"
        )}
      >
        <main className="p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Header */}
      <DashboardHeader />
    </div>
  );
}

export default function WorkspaceShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <WorkspaceContent>{children}</WorkspaceContent>
    </SidebarProvider>
  );
}

