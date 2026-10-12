import type { Metadata } from "next";
import {
  Monitor,
  Server,
  Waypoints,
  Users,
  GitCompareArrows,
  Database,
  Search,
  Sparkles,
  ShieldAlert,
  MessageSquare,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { ArchitectureDiagram } from "@/components/architecture/architecture-diagram";
import { ArchitectureLayerCard } from "@/components/architecture/architecture-layer-card";

export const metadata: Metadata = {
  title: "Architecture",
  description: "How Boardroom AI's multi-agent pipeline actually works, end to end.",
};

const LAYERS = [
  {
    icon: Monitor,
    title: "Frontend",
    description: "Next.js 15 dashboard. Opens a live SSE connection and renders each agent's status the moment it changes — nothing waits for the full session to finish.",
  },
  {
    icon: Server,
    title: "Backend",
    description: "FastAPI. Validates every request, enforces rate limits, and exposes a streaming endpoint (/api/stream), a batch fallback (/api/analyze), and session endpoints for history and follow-up questions.",
  },
  {
    icon: Waypoints,
    title: "Coordinator",
    description: "A Google ADK Runner wrapping the entire pipeline as one composable agent — owns session state and streams every event as it's produced.",
  },
  {
    icon: Users,
    title: "ADK Agents",
    description: "Five specialist LlmAgents (CTO, CFO, Marketing, Legal, Risk) plus a CEO synthesizer, each with its own scoped instructions and tool access.",
  },
  {
    icon: GitCompareArrows,
    title: "Debate Engine",
    description: "A custom, non-LLM ADK agent. Compares votes, confidence scores, and language across findings deterministically — the same inputs always produce the same debate summary.",
  },
  {
    icon: ShieldAlert,
    title: "Resilience Layer",
    description: "Every LLM agent is wrapped so a single failure degrades to a clearly-flagged fallback finding instead of aborting the whole board session.",
  },
  {
    icon: Database,
    title: "Memory & History",
    description: "ADK session state is shared across every agent during a run, which is how the Debate Engine and CEO see earlier findings. Completed sessions are then saved to SQLite so they can be reopened later.",
  },
  {
    icon: MessageSquare,
    title: "Follow-up Q&A",
    description: "After a resolution, you can ask the board questions. A single Gemini call answers from the saved findings, names the specialist behind each point, keeps recent conversation context, and flags questions that go beyond what the board analyzed.",
  },
  {
    icon: Search,
    title: "Search grounding",
    description: "Specialists ground their findings in current information using Gemini's built-in Google Search tool. An MCP web-search server integration is also included and can be enabled with a config flag.",
  },
  {
    icon: Sparkles,
    title: "Gemini 2.5 Flash",
    description: "The LLM behind every agent's reasoning and the follow-up answers, selected for cost and latency at this scale.",
  },
];

export default function ArchitecturePage() {
  return (
    <Container className="py-16 sm:py-20">
      <ScrollReveal className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Architecture</h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          Every board session runs through the same pipeline, in the same order, every time. This is
          the literal path a request takes from the moment you submit an idea to the moment the CEO
          issues a resolution, plus what happens to it afterwards: it&rsquo;s saved to your history, and
          you can question the board about it.
        </p>
      </ScrollReveal>

      <ScrollReveal delay={0.1} className="mt-12">
        <ArchitectureDiagram />
      </ScrollReveal>

      <ScrollReveal delay={0.1} className="mt-16">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Every layer, explained</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LAYERS.map((layer) => (
            <ArchitectureLayerCard key={layer.title} {...layer} />
          ))}
        </div>
      </ScrollReveal>
    </Container>
  );
}