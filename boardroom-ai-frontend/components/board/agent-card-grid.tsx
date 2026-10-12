"use client";

import { motion } from "framer-motion";
import type { AgentCardState, AgentKey } from "@/types/board";
import { AGENT_ORDER } from "@/lib/constants/agents";
import { AgentCard } from "@/components/board/agent-card";
import { staggerContainer } from "@/lib/motion/variants";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

interface AgentCardGridProps {
  agents: Record<AgentKey, AgentCardState>;
}

export function AgentCardGrid({ agents }: AgentCardGridProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <motion.div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      variants={prefersReducedMotion ? undefined : staggerContainer(0.08)}
      initial={prefersReducedMotion ? undefined : "hidden"}
      animate={prefersReducedMotion ? undefined : "visible"}
    >
      {AGENT_ORDER.map((key) => (
        <AgentCard key={key} agentState={agents[key]} />
      ))}
    </motion.div>
  );
}
