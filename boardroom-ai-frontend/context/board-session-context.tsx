"use client";

import { createContext, useCallback, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";
import type { BoardSessionState } from "@/types/board";
import { boardSessionReducer, createInitialBoardSessionState } from "@/lib/board/reducer";
import { mapStreamEventToAction } from "@/lib/board/map-stream-event";
import { replayResolutionAsEvents } from "@/lib/board/replay-resolution";
import { openBoardStream } from "@/lib/api/stream";
import { submitIdeaBatch } from "@/lib/api/analyze";
import { ApiError } from "@/lib/api/errors";

export interface BoardSessionContextValue {
  state: BoardSessionState;
  startAnalysis: (idea: string, targetMarket: string | null) => void;
  reset: () => void;
}

export const BoardSessionContext = createContext<BoardSessionContextValue | null>(null);

export function BoardSessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(boardSessionReducer, undefined, createInitialBoardSessionState);

  // Identifies the current session so async work from a previous one
  // (a stream event arriving late, a fallback replay still running)
  // can recognize it's stale and discard itself instead of dispatching
  // into a session the user has already reset or replaced.
  const sessionIdRef = useRef(0);
  const closeStreamRef = useRef<(() => void) | null>(null);

  const stopActiveSession = useCallback(() => {
    sessionIdRef.current += 1;
    closeStreamRef.current?.();
    closeStreamRef.current = null;
  }, []);

  const startAnalysis = useCallback(
    (idea: string, targetMarket: string | null) => {
      stopActiveSession();
      const thisSessionId = sessionIdRef.current;
      dispatch({ type: "START", idea, targetMarket });

      let receivedAnyEvent = false;
      let receivedDone = false;

      closeStreamRef.current = openBoardStream({
        idea,
        targetMarket,
        onEvent: (event) => {
          if (sessionIdRef.current !== thisSessionId) return;
          receivedAnyEvent = true;
          if (event.type === "done") receivedDone = true;
          dispatch(mapStreamEventToAction(event));
        },
        onConnectionError: () => {
          if (sessionIdRef.current !== thisSessionId) return;

          if (receivedDone) {
            // The session already completed normally -- the browser's
            // EventSource fires 'error' even on a clean server-initiated
            // close (SSE has no formal "goodbye" frame), so a late or
            // duplicate error signal after we've already seen 'done' is
            // expected noise, not a real failure. Ignore it.
            return;
          }

          if (receivedAnyEvent) {
            // The stream had already delivered real events before
            // dropping -- restarting via the batch fallback would
            // conflict with state already on screen. Surface an honest
            // error instead of silently restarting from scratch.
            dispatch({
              type: "STREAM_ERROR",
              message: "Lost connection to the board partway through the session. Please try again.",
            });
            return;
          }

          // Never received a single event: the live connection itself
          // is most likely unavailable (some networks/proxies block
          // long-lived SSE connections outright). Fall back to the
          // batch endpoint and replay its real response as a sequence
          // of events, so the experience still resembles a live session.
          void (async () => {
            try {
              const resolution = await submitIdeaBatch({ idea, target_market: targetMarket ?? undefined });
              if (sessionIdRef.current !== thisSessionId) return;
              await replayResolutionAsEvents(resolution, dispatch, () => sessionIdRef.current !== thisSessionId);
            } catch (err) {
              if (sessionIdRef.current !== thisSessionId) return;
              const message =
                err instanceof ApiError ? err.message : "Could not reach the Boardroom AI backend. Please try again.";
              dispatch({ type: "STREAM_ERROR", message });
            }
          })();
        },
      });
    },
    [stopActiveSession]
  );

  const reset = useCallback(() => {
    stopActiveSession();
    dispatch({ type: "RESET" });
  }, [stopActiveSession]);

  // Close any open connection if the provider itself unmounts (e.g. the
  // user navigates away from the dashboard mid-session).
  useEffect(() => stopActiveSession, [stopActiveSession]);

  const value = useMemo<BoardSessionContextValue>(
    () => ({ state, startAnalysis, reset }),
    [state, startAnalysis, reset]
  );

  return <BoardSessionContext.Provider value={value}>{children}</BoardSessionContext.Provider>;
}
