import Link from "next/link";
import { ArrowRight, ArrowUpRight, Lightbulb, Users, GitCompareArrows, Gavel, FileCheck, MessageSquare } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { ROUTES } from "@/lib/constants/site";


interface PipelineStep {
  label: string;
  icon: typeof Lightbulb;
}

const PIPELINE_STEPS: PipelineStep[] = [
  { label: "Idea submitted", icon: Lightbulb },
  { label: "Board convenes", icon: Users },
  { label: "Debate Engine", icon: GitCompareArrows },
  { label: "Risk & CEO", icon: Gavel },
  { label: "Resolution", icon: FileCheck },
  { label: "Ask follow-ups", icon: MessageSquare },
];

/**
 * A compact, literal read of the pipeline — not a decorative diagram.
 * The full annotated version (with the ADK/MCP/Gemini layer detail)
 * lives on the dedicated Architecture page; this is intentionally the
 * five-second version.
 */
export function ArchitecturePreview() {
  return (
    <section className="border-t border-border/60 py-20">
      <Container>
        <ScrollReveal>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                How a decision actually gets made
              </h2>
              <p className="mt-2 max-w-xl text-sm text-muted">
                Every run follows the same deterministic pipeline — nothing here is
                staged after the fact.
              </p>
            </div>
            <Link
              href={ROUTES.architecture}
              className="group flex shrink-0 items-center gap-1 text-sm font-medium text-primary-text"
            >
              View full architecture
              <ArrowUpRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
            </Link>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1} className="mt-10 flex flex-col items-stretch gap-3 rounded-2xl border border-border/60 bg-surface/40 p-4 sm:flex-row sm:items-center sm:gap-2 sm:p-6">
          {PIPELINE_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isLast = index === PIPELINE_STEPS.length - 1;
            return (
              <div key={step.label} className="flex flex-1 items-center gap-2">
                <div className="flex flex-1 items-center gap-3 rounded-xl bg-white/[0.03] px-4 py-3 sm:flex-col sm:gap-2 sm:py-4 sm:text-center transition-colors duration-200 hover:bg-white/[0.06]">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-medium text-foreground sm:text-xs">{step.label}</span>
                </div>
                {!isLast && (
                  <ArrowRight
                    className="hidden h-4 w-4 shrink-0 text-muted sm:block"
                    aria-hidden="true"
                  />
                )}
              </div>
            );
          })}
        </ScrollReveal>
      </Container>
    </section>
  );
}
