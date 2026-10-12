import type {
  AgentCardState,
  AgentFinding,
  AgentKey,
  BoardResolution,
  BoardSessionState,
  DebateSummary,
  TimelineEvent,
} from "@/types/board";
import { AGENT_ORDER } from "@/lib/constants/agents";

export type BoardSessionAction =
  | { type: "START"; idea: string; targetMarket: string | null }
  | { type: "AGENT_STARTED"; agent: AgentKey }
  | { type: "AGENT_FINISHED"; agent: AgentKey; finding: AgentFinding }
  | { type: "DEBATE_SUMMARY"; debateSummary: DebateSummary }
  | { type: "RESOLUTION"; resolution: BoardResolution }
  | { type: "STREAM_ERROR"; message: string; agent?: AgentKey }
  | { type: "DONE"; sessionId?: string | null }
  | { type: "RESET" };

function createIdleAgentState(key: AgentKey): AgentCardState {
  return { key, status: "waiting", finding: null, startedAt: null, finishedAt: null, errorMessage: null };
}

function createInitialAgents(): Record<AgentKey, AgentCardState> {
  return Object.fromEntries(AGENT_ORDER.map((key) => [key, createIdleAgentState(key)])) as Record<
    AgentKey,
    AgentCardState
  >;
}

export function createInitialBoardSessionState(): BoardSessionState {
  return {
    status: "idle",
    idea: "",
    targetMarket: null,
    agents: createInitialAgents(),
    debateSummary: null,
    resolution: null,
    timeline: [],
    error: null,
    sessionId: null,
  };
}

let timelineIdCounter = 0;
function nextTimelineId(): string {
  timelineIdCounter += 1;
  return `tl-${timelineIdCounter}`;
}

/**
 * Turns a Debate Engine agreement/conflict sentence into a timeline entry,
 * inferring which agent(s) it's about by name-matching against the
 * sentence text. The sentences themselves are real backend output (see
 * debate/debate_engine.py's _compare_votes/_compare_confidence/
 * _compare_risk_language) -- this only decides how to *label* them for
 * the timeline, never invents their content.
 */
function toTimelineEvents(debateSummary: DebateSummary): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const agreement of debateSummary.agreements) {
    events.push({
      id: nextTimelineId(),
      agent: "debate_engine",
      label: "Agreement found",
      detail: agreement,
      timestamp: Date.now(),
      tone: "agree",
    });
  }

  for (const conflict of debateSummary.conflicts) {
    events.push({
      id: nextTimelineId(),
      agent: "debate_engine",
      label: "Conflict flagged",
      detail: conflict,
      timestamp: Date.now(),
      tone: "disagree",
    });
  }

  return events;
}

export function boardSessionReducer(state: BoardSessionState, action: BoardSessionAction): BoardSessionState {
  switch (action.type) {
    case "START":
      return {
        ...createInitialBoardSessionState(),
        status: "streaming",
        idea: action.idea,
        targetMarket: action.targetMarket,
      };

    case "AGENT_STARTED": {
      const existing = state.agents[action.agent];
      if (existing.status !== "waiting") return state; // ignore duplicate/late start signals
      return {
        ...state,
        agents: {
          ...state.agents,
          [action.agent]: { ...existing, status: "thinking", startedAt: Date.now() },
        },
        timeline: [
          ...state.timeline,
          {
            id: nextTimelineId(),
            agent: action.agent,
            label: `${action.agent.toUpperCase()} began analysis`,
            detail: "Reasoning independently over the submitted idea.",
            timestamp: Date.now(),
            tone: "neutral",
          },
        ],
      };
    }

    case "AGENT_FINISHED": {
      const existing = state.agents[action.agent];
      const voteLabel = action.finding.vote ? ` — voted ${action.finding.vote}` : "";
      return {
        ...state,
        agents: {
          ...state.agents,
          [action.agent]: {
            ...existing,
            status: "done",
            finding: action.finding,
            finishedAt: Date.now(),
          },
        },
        timeline: [
          ...state.timeline,
          {
            id: nextTimelineId(),
            agent: action.agent,
            label: `${action.agent.toUpperCase()} completed analysis${voteLabel}`,
            detail: action.finding.summary,
            timestamp: Date.now(),
            tone: "neutral",
          },
        ],
      };
    }

    case "DEBATE_SUMMARY":
      return {
        ...state,
        debateSummary: action.debateSummary,
        timeline: [...state.timeline, ...toTimelineEvents(action.debateSummary)],
      };

    case "RESOLUTION": {
      const existingCeo = state.agents.ceo;
      // The real backend never emits an agent_finished event for the CEO
      // (see api/stream.py: "ceo" is deliberately absent from
      // _OUTPUT_KEY_MAP -- its completion is signaled by the resolution
      // event itself, not a separate finding). Without this, the CEO's
      // Agent Card would be stuck on "thinking" forever even after the
      // board finishes. Every value below is real data from the actual
      // resolution -- this only repackages it into the AgentCardState
      // shape so the CEO's card renders consistently with the rest.
      return {
        ...state,
        resolution: action.resolution,
        agents: {
          ...state.agents,
          ceo: {
            ...existingCeo,
            status: "done",
            finishedAt: Date.now(),
            finding: {
              agent_name: "ceo",
              summary: action.resolution.executive_summary,
              key_points: [],
              confidence: action.resolution.overall_confidence,
              risks_identified: [],
              references: [],
              cross_references: [],
              vote: null,
            },
          },
        },
        timeline: [
          ...state.timeline,
          {
            id: nextTimelineId(),
            agent: "ceo",
            label: "CEO issued the final resolution",
            detail: action.resolution.final_decision,
            timestamp: Date.now(),
            tone: "conclusion",
          },
        ],
      };
    }

    case "STREAM_ERROR": {
      if (action.agent) {
        const existing = state.agents[action.agent];
        return {
          ...state,
          agents: {
            ...state.agents,
            [action.agent]: { ...existing, status: "error", errorMessage: action.message },
          },
        };
      }
      return { ...state, status: "error", error: action.message };
    }

    case "DONE":
      return {
        ...state,
        status: state.status === "error" ? "error" : "completed",
        sessionId: action.sessionId ?? state.sessionId,
      };

    case "RESET":
      return createInitialBoardSessionState();

    default:
      return state;
  }
}
