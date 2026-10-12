import { Lock, Gauge, KeyRound, FileWarning } from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

const MEASURES = [
  {
    icon: Lock,
    title: "Prompt injection defense",
    description:
      "Every business idea is fenced as explicit data inside each agent's prompt, with instructions that anything inside the fence is content to analyze — never a command to follow.",
  },
  {
    icon: KeyRound,
    title: "Per-agent tool allowlisting",
    description:
      "Each specialist can only invoke the tools it's explicitly permitted to use. The Risk and CEO agents have no external tool access at all — they reason over prior findings only.",
  },
  {
    icon: Gauge,
    title: "Rate limiting",
    description:
      "A sliding-window limiter caps requests per client, protecting both the backend and the underlying Gemini API quota from runaway usage.",
  },
  {
    icon: FileWarning,
    title: "Input & file validation",
    description:
      "Idea length and content are validated before any agent sees them. Any file export is checked against a sandboxed root path, an extension allowlist, and a size limit.",
  },
];

export function SecuritySection() {
  return (
    <div>
      <ScrollReveal>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Security</h2>
        <p className="mt-2 max-w-xl text-sm text-muted">
          None of this is theoretical — every measure below is implemented in the backend this product runs on.
        </p>
      </ScrollReveal>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {MEASURES.map((measure, index) => {
          const Icon = measure.icon;
          return (
            <ScrollReveal key={measure.title} delay={index * 0.05}>
              <div className="flex h-full gap-3.5 rounded-2xl border border-border/60 bg-surface/40 p-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{measure.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{measure.description}</p>
                </div>
              </div>
            </ScrollReveal>
          );
        })}
      </div>
    </div>
  );
}
