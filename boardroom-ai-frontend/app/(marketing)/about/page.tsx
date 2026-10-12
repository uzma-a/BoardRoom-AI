import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { ProblemSolutionSection } from "@/components/about/problem-solution-section";
import { WhyMultiAgentSection } from "@/components/about/why-multi-agent-section";
import { SecuritySection } from "@/components/about/security-section";

export const metadata: Metadata = {
  title: "About",
  description: "The problem Boardroom AI solves, why it's built as a multi-agent system, and how it's secured.",
};

export default function AboutPage() {
  return (
    <>
      <Container className="py-16 sm:py-20">
        <ScrollReveal className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">About Boardroom AI</h1>
          
        </ScrollReveal>

        <div className="mt-14">
          <ProblemSolutionSection />
        </div>

        <div className="mt-16">
          <WhyMultiAgentSection />
        </div>

        <div className="mt-16">
          <SecuritySection />
        </div>
      </Container>
    </>
  );
}
