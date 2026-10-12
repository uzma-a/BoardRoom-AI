import type { BoardResolution, IdeaSubmissionPayload } from "@/types/board";
import { API_BASE_URL } from "@/lib/api/config";
import { ApiError } from "@/lib/api/errors";

/**
 * Calls the batch POST /api/analyze endpoint, which runs the full
 * pipeline server-side and returns the complete BoardResolution in one
 * response. Used as a fallback when the live SSE connection
 * (lib/api/stream.ts) can't be established -- some corporate networks
 * and proxies block long-lived streaming connections outright.
 */
export async function submitIdeaBatch(payload: IdeaSubmissionPayload): Promise<BoardResolution> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new ApiError(
      "Could not reach the Boardroom AI backend. Check that it's running and reachable."
    );
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(
      body?.message ?? `The board could not complete its analysis (status ${response.status}).`,
      response.status
    );
  }

  return (await response.json()) as BoardResolution;
}
