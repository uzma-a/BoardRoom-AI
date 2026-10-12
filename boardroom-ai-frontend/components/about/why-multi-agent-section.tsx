import { Layers, GitCompareArrows, ShieldCheck } from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

const REASONS = [
  {
    icon: Layers,
    title: "Specialization beats generality",
    description:
      "A single model asked to be a CTO, CFO, marketer, lawyer, and risk officer at once tends to average its answers. Five agents with five narrow, well-defined roles each go deeper in their own lane.",
  },
  {
    icon: GitCompareArrows,
    title: "Disagreement is signal, not noise",
    description:
      "Real boards argue. When the CFO's optimistic timeline conflicts with the CTO's engineering estimate, that tension is exactly the thing a founder needs surfaced — not smoothed over by a single model reconciling it silently.",
  },
  {
    icon: ShieldCheck,
    title: "Isolation limits blast radius",
    description:
      "Each specialist has its own scoped tool access and its own failure boundary. One agent's error degrades to a flagged fallback finding instead of corrupting the whole session.",
  },
];

export function WhyMultiAgentSection() {
  return (
    <div>
      <ScrollReveal>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Why multi-agent, specifically</h2>
      </ScrollReveal>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {REASONS.map((reason, index) => {
          const Icon = reason.icon;
          return (
            <ScrollReveal key={reason.title} delay={index * 0.05}>
              <div className="h-full rounded-2xl border border-border/60 bg-surface/40 p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                </span>
                <h3 className="mt-3 text-sm font-semibold text-foreground">{reason.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{reason.description}</p>
              </div>
            </ScrollReveal>
          );
        })}
      </div>
    </div>
  );
}
