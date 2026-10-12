import { AlertCircle, CheckCircle2 } from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export function ProblemSolutionSection() {
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
      <ScrollReveal>
        <div className="rounded-2xl border border-danger/30 bg-danger/[0.04] p-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-danger/10 text-danger">
            <AlertCircle className="h-[18px] w-[18px]" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-foreground">The problem</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Founders evaluating a business idea usually get one opinion — their own, a single
            advisor&rsquo;s, or a single AI model&rsquo;s. That opinion carries whatever blind spots its
            source has, and nothing forces a technical assumption to be checked against a
            financial one, or a marketing claim against a legal constraint, before a decision gets made.
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <div className="rounded-2xl border border-success/30 bg-success/[0.04] p-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 text-success">
            <CheckCircle2 className="h-[18px] w-[18px]" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-foreground">The solution</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Boardroom AI runs five domain specialists against the same idea independently, then
            deterministically compares their findings for agreement and conflict before a sixth
            agent synthesizes a final call. The tension between perspectives isn&rsquo;t hidden —
            it&rsquo;s the point.
          </p>
        </div>
      </ScrollReveal>
    </div>
  );
}
