import type { BoardResolution } from "@/types/board";
import { RESOLUTION_FIELD_BY_AGENT } from "@/types/board";
import type { BoardSessionAction } from "@/lib/board/reducer";

const SPECIALIST_SEQUENCE = ["cto", "cfo", "marketing", "legal"] as const;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * When the live SSE stream can't be established, we fall back to the
 * batch POST /api/analyze endpoint, which returns the complete
 * BoardResolution in a single response. To preserve the "live board
 * meeting" feel instead of every card populating simultaneously, this
 * replays the exact same sequence of reducer actions the real stream
 * would have produced, spaced a short delay apart.
 *
 * Every value dispatched here is real data from the actual API
 * response -- only the *pacing* between dispatches is synthetic, purely
 * for presentation. `isCancelled` is checked between every step so a
 * page navigation or a new submission stops the replay immediately
 * rather than dispatching into a session the user has already left.
 */
export async function replayResolutionAsEvents(
  resolution: BoardResolution,
  dispatch: (action: BoardSessionAction) => void,
  isCancelled: () => boolean,
  stepDelayMs = 350
): Promise<void> {
  for (const agent of SPECIALIST_SEQUENCE) {
    if (isCancelled()) return;
    dispatch({ type: "AGENT_STARTED", agent });
    await sleep(stepDelayMs);

    if (isCancelled()) return;
    dispatch({ type: "AGENT_FINISHED", agent, finding: resolution[RESOLUTION_FIELD_BY_AGENT[agent]] });
    await sleep(stepDelayMs / 2);
  }

  if (isCancelled()) return;
  dispatch({ type: "DEBATE_SUMMARY", debateSummary: resolution.debate_summary });
  await sleep(stepDelayMs);

  if (isCancelled()) return;
  dispatch({ type: "AGENT_STARTED", agent: "risk" });
  await sleep(stepDelayMs);

  if (isCancelled()) return;
  dispatch({ type: "AGENT_FINISHED", agent: "risk", finding: resolution.risk_analysis });
  await sleep(stepDelayMs);

  if (isCancelled()) return;
  dispatch({ type: "AGENT_STARTED", agent: "ceo" });
  await sleep(stepDelayMs);

  if (isCancelled()) return;
  dispatch({ type: "RESOLUTION", resolution });
  dispatch({ type: "DONE" });
}
