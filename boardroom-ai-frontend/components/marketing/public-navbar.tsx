"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { buttonVariants } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { ROUTES } from "@/lib/constants/site";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Architecture", href: ROUTES.architecture },
  { label: "About", href: ROUTES.about },
] as const;

export function PublicNavbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-150",
                  isActive
                    ? "text-foreground"
                    : "text-muted hover:text-foreground hover:bg-white/[0.03]"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href={ROUTES.dashboard} className={buttonVariants({ variant: "primary", size: "sm" })}>
            Open Dashboard
          </Link>
        </div>

        <IconButton
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          className="md:hidden"
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </IconButton>
      </div>

      {mobileOpen && (
        <nav
          className="border-t border-border/60 px-6 py-4 md:hidden"
          aria-label="Primary mobile"
        >
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted hover:bg-white/[0.03] hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={ROUTES.dashboard}
              onClick={() => setMobileOpen(false)}
              className={buttonVariants({ variant: "primary", size: "md", className: "mt-2 w-full" })}
            >
              Open Dashboard
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
