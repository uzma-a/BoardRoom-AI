"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Waypoints } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { AgentRollCall } from "@/components/marketing/agent-roll-call";
import { fadeInUp, staggerContainer } from "@/lib/motion/variants";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { ROUTES } from "@/lib/constants/site";

export function Hero() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const variants = prefersReducedMotion ? undefined : staggerContainer(0.1);

  return (
    <section className="relative overflow-hidden pb-20 pt-20 sm:pt-28">
      {/* Ambient glow anchored to the primary accent — restrained, single source, not a scattered gradient mesh. */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]"
        aria-hidden="true"
      />

      <Container className="relative">
        <motion.div
          className="mx-auto flex max-w-3xl flex-col items-center text-center"
          variants={variants}
          initial={prefersReducedMotion ? undefined : "hidden"}
          animate={prefersReducedMotion ? undefined : "visible"}
        >
          <motion.div variants={prefersReducedMotion ? undefined : fadeInUp}>
            <Badge variant="primary">
              <Waypoints className="h-3.5 w-3.5" aria-hidden="true" />
              Six specialists. One resolution.
            </Badge>
          </motion.div>

          <motion.h1
            variants={prefersReducedMotion ? undefined : fadeInUp}
            className="mt-6 text-5xl font-semibold tracking-tight text-foreground sm:text-6xl"
          >
            Boardroom AI
          </motion.h1>

          <motion.p
            variants={prefersReducedMotion ? undefined : fadeInUp}
            className="mt-3 text-lg font-medium text-primary-text"
          >
            Your AI Board of Directors
          </motion.p>

          <motion.p
            variants={prefersReducedMotion ? undefined : fadeInUp}
            className="mt-5 max-w-xl text-balance text-base leading-relaxed text-muted"
          >
            Submit a business idea and six specialized AI executives — CTO,
            CFO, Marketing, Legal, Risk, and CEO — independently analyze it,
            compare notes, and debate before returning one defensible
            recommendation. Not a single model&rsquo;s opinion. A boardroom&rsquo;s.
          </motion.p>

          <motion.div
            variants={prefersReducedMotion ? undefined : fadeInUp}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row"
          >
            <Link
              href={ROUTES.dashboard}
              className={buttonVariants({ variant: "primary", size: "lg", className: "group" })}
            >
              Analyze Business Idea
              <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
            <Link
              href={ROUTES.architecture}
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              View Architecture
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          className="mx-auto mt-16 max-w-4xl"
          variants={prefersReducedMotion ? undefined : fadeInUp}
          initial={prefersReducedMotion ? undefined : "hidden"}
          animate={prefersReducedMotion ? undefined : "visible"}
        >
          <AgentRollCall />
        </motion.div>
      </Container>
    </section>
  );
}
