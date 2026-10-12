import Link from "next/link";
import { Github } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Container } from "@/components/ui/container";
import { ROUTES, GITHUB_URL, SITE_TAGLINE } from "@/lib/constants/site";

const PRODUCT_LINKS = [
  { label: "Dashboard", href: ROUTES.dashboard },
  { label: "Architecture", href: ROUTES.architecture },
];

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60">
      <Container className="grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            {SITE_TAGLINE} Specialized AI executives collaborate, debate, and
            vote before every strategic recommendation reaches you.
          </p>
        </div>

        <nav aria-label="Product">
          <h3 className="text-sm font-semibold text-foreground">Product</h3>
          <ul className="mt-4 space-y-3">
            {PRODUCT_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-muted transition-colors hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

      
      </Container>

      <div className="border-t border-border/60 py-6">
        <Container className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-muted">© {year} Boardroom AI. All rights reserved.</p>
        </Container>
      </div>
    </footer>
  );
}
