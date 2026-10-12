import type { ReactNode } from "react";
import { PublicNavbar } from "@/components/marketing/public-navbar";
import { PublicFooter } from "@/components/marketing/public-footer";
import { SkipToContent } from "@/components/ui/skip-to-content";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SkipToContent />
      <PublicNavbar />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
