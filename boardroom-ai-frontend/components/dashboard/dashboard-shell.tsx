"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TopNav } from "@/components/dashboard/top-nav";
import { SkipToContent } from "@/components/ui/skip-to-content";

/**
 * The only piece of the dashboard layout that needs client-side state
 * (whether the mobile sidebar is open) — kept separate from
 * app/dashboard/layout.tsx so that file stays a plain server component.
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <SkipToContent />
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="lg:pl-60">
        <TopNav onMenuClick={() => setMobileOpen(true)} />
        <main id="main-content" className="scrollbar-thin px-4 py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
