"use client";

import { useState } from 'react';
import { LeftSidebar } from "@/components/LeftSidebar";
import { MobileHeader } from "@/components/MobileHeader";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <LeftSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-48 flex flex-col min-h-screen">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1">
          {children}
        </main>
      </div>
    </>
  );
}
