/**
 * Type contract for Boardroom AI's backend integration.
 *
 * Every type below mirrors a real Pydantic model or SSE event shape from
 * the FastAPI backend (models/schemas.py and api/stream.py) — nothing
 * here is speculative. Keeping this file as the single source of truth
 * means a backend schema change surfaces as a TypeScript error at the
 * exact call site that needs updating, instead of a silent runtime bug.
 */

export type AgentKey = "cto" | "cfo" | "marketing" | "legal" | "risk" | "ceo";

/** The five specialists whose analysis actually renders as an Agent Card during the live meeting. */
export const SPECIALIST_AGENTS: readonly AgentKey[] = [
  "cto",
  "cfo",
  "marketing",
  "legal",
  "risk",
] as const;

export type VoteChoice = "approve" | "reject" | "conditional";

/** Mirrors models.schemas.AgentFinding */
export interface AgentFinding {
  agent_name: AgentKey;
  summary: string;
  key_points: string[];
  confidence: number; // 0.0 - 1.0
  risks_identified: string[];
  references: string[];
  cross_references: string[];
  vote: VoteChoice | null;
}

/** Mirrors models.schemas.DebateSummary */
export interface DebateSummary {
  agreements: string[];
  conflicts: string[];
  vote_alignment: Partial<Record<AgentKey, VoteChoice>>;
  notes: string;
}

/** Mirrors models.schemas.BoardResolution — the full /api/analyze response body. */
export interface BoardResolution {
  executive_summary: string;
  technical_analysis: AgentFinding;
  financial_analysis: AgentFinding;
  marketing_analysis: AgentFinding;
  legal_analysis: AgentFinding;
  risk_analysis: AgentFinding;
  debate_summary: DebateSummary;
  board_votes: Partial<Record<AgentKey, VoteChoice>>;
  overall_confidence: number;
  recommended_next_steps: string[];
  final_decision: string;
}

/** Maps each specialist's AgentKey to its field name on BoardResolution. */
export const RESOLUTION_FIELD_BY_AGENT: Record<
  Exclude<AgentKey, "ceo">,
  keyof Pick<
    BoardResolution,
    "technical_analysis" | "financial_analysis" | "marketing_analysis" | "legal_analysis" | "risk_analysis"
  >
> = {
  cto: "technical_analysis",
  cfo: "financial_analysis",
  marketing: "marketing_analysis",
  legal: "legal_analysis",
  risk: "risk_analysis",
};

// --- SSE event union, discriminated by `type` (mirrors api/stream.py's `_sse()` payloads) ---

export interface AgentStartedEvent {
  type: "agent_started";
  agent: AgentKey;
}

export interface AgentFinishedEvent {
  type: "agent_finished";
  agent: AgentKey;
  finding: AgentFinding;
}

export interface DebateSummaryEvent {
  type: "debate_summary";
  debate_summary: DebateSummary;
}

export interface ResolutionEvent {
  type: "resolution";
  resolution: BoardResolution;
}

export interface StreamErrorEvent {
  type: "error";
  agent?: AgentKey;
  message: string;
}

export interface DoneEvent {
  type: "done";
  session_id?: string | null;
}

export type BoardStreamEvent =
  | AgentStartedEvent
  | AgentFinishedEvent
  | DebateSummaryEvent
  | ResolutionEvent
  | StreamErrorEvent
  | DoneEvent;

// --- Client-side derived state (built by useBoardStream; not sent by the backend) ---

export type AgentStatus = "waiting" | "thinking" | "done" | "error";

export interface AgentCardState {
  key: AgentKey;
  status: AgentStatus;
  finding: AgentFinding | null;
  startedAt: number | null;
  finishedAt: number | null;
  errorMessage: string | null;
}

export type TimelineTone = "neutral" | "agree" | "disagree" | "conclusion";

export interface TimelineEvent {
  id: string;
  agent: AgentKey | "debate_engine";
  label: string;
  detail: string;
  timestamp: number;
  tone: TimelineTone;
}

export type BoardSessionStatus = "idle" | "streaming" | "completed" | "error";

export interface BoardSessionState {
  status: BoardSessionStatus;
  idea: string;
  targetMarket: string | null;
  agents: Record<AgentKey, AgentCardState>;
  debateSummary: DebateSummary | null;
  resolution: BoardResolution | null;
  timeline: TimelineEvent[];
  error: string | null;
  sessionId: string | null;
}

// --- API request payloads (mirrors models.schemas.IdeaSubmission) ---

export interface IdeaSubmissionPayload {
  idea: string;
  target_market?: string;
  session_id?: string;
}

export interface SessionSummary {
  id: string;
  idea: string;
  target_market: string | null;
  status: string;
  overall_confidence: number | null;
  final_decision: string | null;
  created_at: string;
}

export interface FollowupTurn {
  role: "user" | "board";
  text: string;
}