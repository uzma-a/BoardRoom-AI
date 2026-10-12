import { Cpu, Wallet, Megaphone, Scale, ShieldAlert, Gavel } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AgentKey } from "@/types/board";

export interface AgentMeta {
  key: AgentKey;
  /** Short label used in compact UI (cards, badges). */
  label: string;
  /** Full title used in prose and page copy. */
  role: string;
  icon: LucideIcon;
  /** One-line description of what this agent evaluates. */
  description: string;
}

/**
 * Single source of truth for agent identity (icon, title, description).
 * Used by the landing page's board roll-call, and by the dashboard's
 * Agent Cards and Board Votes panel in later steps — keeping this in one
 * place means the CTO always looks and reads the same way everywhere.
 */
export const AGENT_META: Record<AgentKey, AgentMeta> = {
  cto: {
    key: "cto",
    label: "CTO",
    role: "Chief Technology Officer",
    icon: Cpu,
    description: "Technical feasibility, AI complexity, and scalability.",
  },
  cfo: {
    key: "cfo",
    label: "CFO",
    role: "Chief Financial Officer",
    icon: Wallet,
    description: "Development cost, revenue model, and financial risk.",
  },
  marketing: {
    key: "marketing",
    label: "Marketing",
    role: "Chief Marketing Officer",
    icon: Megaphone,
    description: "Market size, competitors, and go-to-market strategy.",
  },
  legal: {
    key: "legal",
    label: "Legal",
    role: "General Counsel",
    icon: Scale,
    description: "Compliance, licensing, and regulatory risk.",
  },
  risk: {
    key: "risk",
    label: "Risk",
    role: "Chief Risk Officer",
    icon: ShieldAlert,
    description: "Cross-cutting execution, market, and product risk.",
  },
  ceo: {
    key: "ceo",
    label: "CEO",
    role: "Chief Executive Officer",
    icon: Gavel,
    description: "Synthesizes the board into one final resolution.",
  },
};

/** Canonical display order — the order the board actually convenes in. */
export const AGENT_ORDER: readonly AgentKey[] = ["cto", "cfo", "marketing", "legal", "risk", "ceo"];
