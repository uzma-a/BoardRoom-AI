import { Container } from "@/components/ui/container";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { HowItWorksStep } from "@/components/marketing/how-it-works-step";

const STEPS = [
  {
    title: "Submit your idea",
    description:
      "Describe the business idea in plain language, with an optional target market. That's the only input the board needs.",
  },
  {
    title: "Specialists analyze in parallel",
    description:
      "CTO, CFO, Marketing, and Legal each reason independently and simultaneously, searching for current information where it matters.",
  },
  {
    title: "The Debate Engine compares findings",
    description:
      "Votes, confidence scores, and language across all four findings are compared deterministically — surfacing real agreements and real conflicts.",
  },
  {
    title: "Risk and CEO synthesize",
    description:
      "Risk addresses the debate's conflicts directly, then the CEO weighs every specialist by name into a single, defensible resolution.",
  },
  {
    title: "You get a board resolution",
    description:
      "A confidence score, a vote from every executive, concrete next steps, and a report you can export. Every session is saved to your History, so you can reopen it any time.",
  },
  {
    title: "Ask the board follow-ups",
    description:
      "Question the resolution with things like \u201CWhy?\u201D or \u201CWhat if we cut the price by 30%?\u201D. Answers come from the board's saved findings, name the specialist behind each point, and say so when a question goes beyond what was analyzed.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="border-t border-border/60 py-20">
      <Container className="max-w-3xl">
        <ScrollReveal>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            How it works
          </h2>
          <p className="mt-2 text-sm text-muted">
            Six stages, every time — the same pipeline that actually runs in the background.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.1} className="mt-10">
          {STEPS.map((step, index) => (
            <HowItWorksStep
              key={step.title}
              number={index + 1}
              title={step.title}
              description={step.description}
              isLast={index === STEPS.length - 1}
            />
          ))}
        </ScrollReveal>
      </Container>
    </section>
  );
}