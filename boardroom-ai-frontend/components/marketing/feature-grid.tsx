import { Layers, GitCompareArrows, Radio, Globe, ShieldCheck, FileDown, MessageSquare, History } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { FeatureCard } from "@/components/marketing/feature-card";

const FEATURES = [
  {
    icon: Layers,
    title: "Six specialists, not one model",
    description:
      "CTO, CFO, Marketing, Legal, and Risk each reason independently in their own domain before anyone compares notes — no single perspective dominates the analysis.",
  },
  {
    icon: GitCompareArrows,
    title: "A deterministic Debate Engine",
    description:
      "Agreements and conflicts are computed by comparing real votes, confidence scores, and language across findings — never a scripted or invented back-and-forth.",
  },
  {
    icon: Radio,
    title: "Watch the board think, live",
    description:
      "Each executive streams its status the moment it starts and finishes reasoning — no spinner, no wall of text dropped at the end.",
  },
  {
    icon: Globe,
    title: "Grounded in current research",
    description:
      "Specialists search for real, current information — market data, regulations, competitors — instead of relying on stale training knowledge.",
  },
  {
    icon: ShieldCheck,
    title: "Defense-in-depth security",
    description:
      "Prompt injection defense, per-agent tool allowlisting, rate limiting, and graceful fallback keep one bad input or one failed call from derailing a session.",
  },
  {
    icon: FileDown,
    title: "A resolution you can act on",
    description:
      "Every session ends in an exportable executive report — summary, votes, confidence, and concrete next steps — not just a chat transcript.",
  },
    {
    icon: MessageSquare,
    title: "Question the board",
    description:
      "Ask follow-ups after the verdict, like \u201CWhy?\u201D or \u201CWhat if we cut the price by 30%?\u201D. Answers come from the board's own findings, cite the specialist, and admit when a question goes beyond what was analyzed.",
  },
  {
    icon: History,
    title: "Every session is saved",
    description:
      "Completed sessions are stored, so you can reopen any past report, re-export it, and keep asking questions long after the run finished.",
  },
];

export function FeatureGrid() {
  return (
    <section className="border-t border-border/60 py-20">
      <Container>
        <ScrollReveal>
          <div className="max-w-xl">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Built like a real board, not a chatbot
            </h2>
            <p className="mt-2 text-sm text-muted">
              Every capability below maps to something that actually runs during a session — nothing is aspirational.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1} className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </ScrollReveal>
      </Container>
    </section>
  );
}
