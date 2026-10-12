import type { BoardStreamEvent } from "@/types/board";
import { API_BASE_URL } from "@/lib/api/config";

const STREAM_EVENT_NAMES: BoardStreamEvent["type"][] = [
  "agent_started",
  "agent_finished",
  "debate_summary",
  "resolution",
  "error",
  "done",
];

export interface OpenBoardStreamParams {
  idea: string;
  targetMarket: string | null;
  onEvent: (event: BoardStreamEvent) => void;
  /** Called when the connection fails or drops before a `done` event was received. */
  onConnectionError: () => void;
}

/**
 * Opens a live connection to GET /api/stream and dispatches each parsed
 * SSE event to `onEvent`. Returns a cleanup function that closes the
 * connection and removes all listeners -- callers must invoke this on
 * unmount, reset, or before opening a new stream.
 *
 * IMPORTANT LIMITATION (native browser API, not a shortcut taken here):
 * EventSource exposes no HTTP status code or response body on failure.
 * If the backend rejects the request before ever opening the stream
 * (422 validation, 429 rate limit -- see backend/main.py's exception
 * handlers), all the browser gives us is a generic 'error' event with
 * zero detail about *why*. This is why lib/validation/idea.ts mirrors
 * the backend's validation rules exactly: keeping client-side rejection
 * the common case is the only way to give the user a specific reason,
 * since the transport layer can't surface one after the fact.
 */
export function openBoardStream({ idea, targetMarket, onEvent, onConnectionError }: OpenBoardStreamParams): () => void {
  const url = new URL("/api/stream", API_BASE_URL);
  url.searchParams.set("idea", idea);
  if (targetMarket) url.searchParams.set("target_market", targetMarket);

  const eventSource = new EventSource(url.toString());
  let doneReceived = false;

  const handleMessage = (event: MessageEvent) => {
    try {
      const parsed = JSON.parse(event.data) as BoardStreamEvent;
      if (parsed.type === "done") doneReceived = true;
      onEvent(parsed);
    } catch {
      onConnectionError();
    }
  };

  for (const name of STREAM_EVENT_NAMES) {
    eventSource.addEventListener(name, handleMessage);
  }

  eventSource.onerror = () => {
    eventSource.close();
    if (!doneReceived) onConnectionError();
  };

  return () => {
    for (const name of STREAM_EVENT_NAMES) {
      eventSource.removeEventListener(name, handleMessage);
    }
    eventSource.close();
  };
}
