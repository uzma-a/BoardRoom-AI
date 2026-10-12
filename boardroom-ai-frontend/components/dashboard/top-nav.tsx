"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { ROUTES } from "@/lib/constants/site";

interface TopNavProps {
  onMenuClick: () => void;
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const pathname = usePathname();
  const title = pathname.startsWith(ROUTES.history) ? "History" : "Dashboard";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-md lg:px-8">
      <IconButton aria-label="Open sidebar" className="lg:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" aria-hidden="true" />
      </IconButton>

      <h1 className="text-sm font-semibold text-foreground">{title}</h1>
    </header>
  );
}
