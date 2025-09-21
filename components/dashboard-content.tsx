'use client';

import { useSidebar } from "@/components/dashboard-sidebar";
import { cn } from "@/lib/utils";

export function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isOpen } = useSidebar();
  
  return (
    <main className={cn(
      "transition-all duration-300 min-h-screen",
      // Desktop margins
      isOpen ? "lg:ml-64" : "lg:ml-16",
      // Mobile full width
      "ml-0"
    )}>
      <div className="p-4 lg:p-6 pt-16 lg:pt-6">
        {children}
      </div>
    </main>
  );
}
