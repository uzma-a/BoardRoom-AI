"use client";

import { usePathname } from "next/navigation";
import { LayoutDashboard, History as HistoryIcon, Waypoints, Info } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SidebarNavItem } from "@/components/dashboard/sidebar-nav-item";
import { ROUTES } from "@/lib/constants/site";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: ROUTES.dashboard, icon: LayoutDashboard },
  { label: "Architecture", href: ROUTES.architecture, icon: Waypoints },
  { label: "About", href: ROUTES.about, icon: Info },
  { label: "History", href: ROUTES.history, icon: HistoryIcon },
] as const;

interface SidebarProps {
  /** Controls the mobile slide-over; ignored at the lg+ breakpoint where the sidebar is always visible. */
  mobileOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-4">
        <Logo />
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2" aria-label="Dashboard">
        {NAV_ITEMS.map((item) => (
          <SidebarNavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            isActive={item.href === ROUTES.dashboard ? pathname === item.href : pathname.startsWith(item.href)}
            onNavigate={onClose}
          />
        ))}
      </nav>

      <div className="flex items-center justify-between border-t border-border/60 px-4 py-3">
        <span className="text-xs text-muted">Theme</span>
        <ThemeToggle />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: static rail, always visible at lg+ */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-60 lg:flex-col lg:border-r lg:border-border/60 lg:bg-surface/40">
        {content}
      </aside>

      {/* Mobile: slide-over, toggled from TopNav's menu button */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!mobileOpen}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/60 transition-opacity duration-200",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={onClose}
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 w-64 border-r border-border/60 bg-surface transition-transform duration-200 ease-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {content}
        </aside>
      </div>
    </>
  );
}
