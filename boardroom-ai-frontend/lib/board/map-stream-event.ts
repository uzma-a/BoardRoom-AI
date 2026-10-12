import type { BoardStreamEvent } from "@/types/board";
import type { BoardSessionAction } from "@/lib/board/reducer";

/** Pure mapping, kept separate from the context so it's trivially testable on its own. */
export function mapStreamEventToAction(event: BoardStreamEvent): BoardSessionAction {
  switch (event.type) {
    case "agent_started":
      return { type: "AGENT_STARTED", agent: event.agent };
    case "agent_finished":
      return { type: "AGENT_FINISHED", agent: event.agent, finding: event.finding };
    case "debate_summary":
      return { type: "DEBATE_SUMMARY", debateSummary: event.debate_summary };
    case "resolution":
      return { type: "RESOLUTION", resolution: event.resolution };
    case "error":
      return { type: "STREAM_ERROR", message: event.message, agent: event.agent };
    case "done":
      return { type: "DONE", sessionId: event.session_id ?? null };
  }
}
