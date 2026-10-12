import type { BoardResolution, SessionSummary, FollowupTurn } from "@/types/board";
import { API_BASE_URL } from "@/lib/api/config";
import { ApiError } from "@/lib/api/errors";

async function getJson<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`);
  } catch {
    throw new ApiError("Could not reach the Boardroom AI backend. Check that it's running.");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(body?.message ?? `Request failed (status ${response.status}).`, response.status);
  }

  return (await response.json()) as T;
}

export function fetchSessionList(): Promise<SessionSummary[]> {
  return getJson<SessionSummary[]>("/api/sessions");
}

export function fetchSessionDetail(id: string): Promise<BoardResolution> {
  return getJson<BoardResolution>(`/api/sessions/${encodeURIComponent(id)}`);
}

export async function askFollowup(id: string, question: string, history: FollowupTurn[]): Promise<string> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/sessions/${encodeURIComponent(id)}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, history }),
    });
  } catch {
    throw new ApiError("Could not reach the Boardroom AI backend. Check that it's running.");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(body?.message ?? `The board could not answer (status ${response.status}).`, response.status);
  }

  const data = (await response.json()) as { answer: string };
  return data.answer;
}