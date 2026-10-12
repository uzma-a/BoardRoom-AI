import { Container } from "@/components/ui/container";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

interface TechGroup {
  label: string;
  items: string[];
}

const TECH_GROUPS: TechGroup[] = [
  { label: "Frontend", items: ["Next.js 15", "TypeScript", "Tailwind CSS", "Framer Motion"] },
  { label: "AI & Backend", items: ["FastAPI", "Google ADK", "Gemini 2.5", "Model Context Protocol"] },
];

/**
 * Grouping by layer (rather than one flat badge row) is the structural
 * choice doing real work here — it tells the reader which technology
 * powers which half of the product, not just "we use a lot of things."
 */
export function TechStackSection() {
  return (
    <section className="border-t border-border/60 py-20">
      <Container>
        <ScrollReveal>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Built on a real production stack
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted">
            No mocked responses, no simulated agents — every layer below is running in this build.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.1} className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2">
          {TECH_GROUPS.map((group) => (
            <div key={group.label}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                {group.label}
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <span
                    key={item}
                    className="rounded-lg border border-border/60 bg-surface/40 px-3 py-1.5 text-sm font-medium text-foreground transition-colors duration-150 hover:border-primary/40 hover:bg-primary/[0.06]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </ScrollReveal>
      </Container>
    </section>
  );
}
