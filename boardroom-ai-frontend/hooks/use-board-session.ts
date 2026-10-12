"use client";

import { useContext } from "react";
import { BoardSessionContext, type BoardSessionContextValue } from "@/context/board-session-context";

/**
 * Access to the current board session's state and actions. Throws
 * clearly if used outside a BoardSessionProvider rather than failing
 * silently with a confusing "cannot read property of null" deeper in a
 * component tree.
 */
export function useBoardSession(): BoardSessionContextValue {
  const context = useContext(BoardSessionContext);
  if (!context) {
    throw new Error("useBoardSession must be used within a BoardSessionProvider.");
  }
  return context;
}
