import {
  Monitor,
  Server,
  Waypoints,
  GitCompareArrows,
  ShieldAlert,
  Gavel,
  ArrowDown,
  Database,
  Search,
  Sparkles,
  History,
  MessageSquare,
} from "lucide-react";

interface FlowNodeProps {
  icon: typeof Monitor;
  title: string;
  subtitle: string;
}

function FlowNode({ icon: Icon, title, subtitle }: FlowNodeProps) {
  return (
    <div className="flex w-full items-center gap-4 rounded-xl border border-border/60 bg-white/[0.03] px-5 py-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted">{subtitle}</p>
      </div>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="flex justify-center py-1.5" aria-hidden="true">
      <ArrowDown className="h-4 w-4 text-muted/50" />
    </div>
  );
}

const SUPPORTING_SERVICES = [
  {
    icon: Database,
    title: "Memory & History",
    subtitle: "Live session state shared across agents; completed sessions saved to SQLite",
  },
  {
    icon: Search,
    title: "Search grounding",
    subtitle: "Gemini's Google Search tool by default; an MCP web-search server is available behind a flag",
  },
  { icon: Sparkles, title: "Gemini 2.5 Flash", subtitle: "The LLM behind every agent's reasoning" },
];

export function ArchitectureDiagram() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_260px]">
      <div className="rounded-2xl border border-border/60 bg-surface/40 p-5 sm:p-6">
        <FlowNode icon={Monitor} title="Frontend" subtitle="Next.js dashboard — submits an idea, opens a live stream" />
        <FlowArrow />
        <FlowNode icon={Server} title="Backend" subtitle="FastAPI — validates, rate-limits, and opens the SSE stream" />
        <FlowArrow />
        <FlowNode icon={Waypoints} title="Coordinator" subtitle="ADK Runner — orchestrates the full pipeline" />
        <FlowArrow />

        <div className="rounded-xl border border-dashed border-border/60 p-4">
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-muted">
            Four specialists, running in parallel
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {["CTO", "CFO", "Marketing", "Legal"].map((label) => (
              <div key={label} className="rounded-lg bg-white/[0.03] py-3 text-center text-xs font-medium text-foreground">
                {label}
              </div>
            ))}
          </div>
        </div>

        <FlowArrow />
        <FlowNode icon={GitCompareArrows} title="Debate Engine" subtitle="Deterministic comparison — no LLM call, no invented dialogue" />
        <FlowArrow />
        <FlowNode icon={ShieldAlert} title="Risk Agent" subtitle="Reviews the debate's conflicts, synthesizes cross-cutting risk" />
        <FlowArrow />
        <FlowNode icon={Gavel} title="CEO Agent" subtitle="Cites every specialist by name, issues the final resolution" />
        <FlowArrow />
        <FlowNode icon={History} title="Session History" subtitle="The resolution is saved, so any past session can be reopened" />
        <FlowArrow />
        <FlowNode
          icon={MessageSquare}
          title="Ask the Board"
          subtitle="Follow-up Q&A — one grounded Gemini call over the saved resolution, with conversation memory"
        />
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Supporting services</p>
        {SUPPORTING_SERVICES.map((service) => {
          const Icon = service.icon;
          return (
            <div key={service.title} className="rounded-xl border border-border/60 bg-white/[0.02] p-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <p className="mt-2.5 text-sm font-medium text-foreground">{service.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{service.subtitle}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}