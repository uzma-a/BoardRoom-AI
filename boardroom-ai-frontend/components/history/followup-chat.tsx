"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { MessageSquare, SendHorizontal } from "lucide-react";
import type { FollowupTurn } from "@/types/board";
import { askFollowup } from "@/lib/api/sessions";
import { WorkspaceSection } from "@/components/dashboard/workspace-section";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "What would change the board's decision?",
  "What should I do in the first 30 days?",
  "Which risk is the most serious, and why?",
];

const STORAGE_PREFIX = "boardroom-followup:";

function loadTurns(sessionId: string): FollowupTurn[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + sessionId);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as FollowupTurn[]) : [];
  } catch {
    return [];
  }
}

function saveTurns(sessionId: string, turns: FollowupTurn[]): void {
  try {
    if (turns.length === 0) window.localStorage.removeItem(STORAGE_PREFIX + sessionId);
    else window.localStorage.setItem(STORAGE_PREFIX + sessionId, JSON.stringify(turns));
  } catch {
    // Storage can be full or blocked (private mode). The chat still works, it just won't persist.
  }
}

export function FollowupChat({ sessionId }: { sessionId: string }) {
  const [turns, setTurns] = useState<FollowupTurn[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollOnNextUpdate = useRef(false);

  // Restore after mount (not in the initial state) so server and client render the same HTML.
  useEffect(() => {
    scrollOnNextUpdate.current = false; // restoring must not scroll the page
    setTurns(loadTurns(sessionId));
  }, [sessionId]);

  useEffect(() => {
    if (!scrollOnNextUpdate.current) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [turns, pending]);

  async function send(question: string) {
    const trimmed = question.trim();
    if (trimmed.length < 3 || pending) return;

    const history = turns;
    scrollOnNextUpdate.current = true;
    setTurns([...history, { role: "user", text: trimmed }]);
    setInput("");
    setError(null);
    setPending(true);

    try {
      const answer = await askFollowup(sessionId, trimmed, history);
      const next: FollowupTurn[] = [...history, { role: "user", text: trimmed }, { role: "board", text: answer }];
      setTurns(next);
      saveTurns(sessionId, next); // also runs if you left the page while waiting
    } catch (err) {
      setTurns(history); // put the question back so nothing typed is lost
      setInput(trimmed);
      setError(err instanceof Error ? err.message : "The board could not answer right now.");
    } finally {
      setPending(false);
    }
  }

  function clearChat() {
    setTurns([]);
    setError(null);
    saveTurns(sessionId, []);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void send(input);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void send(input);
    }
  }

  return (
    <WorkspaceSection
      title="Ask the Board"
      icon={MessageSquare}
      description="Follow-up questions, answered from this session's findings"
      action={
        turns.length > 0 && !pending ? (
          <button
            type="button"
            onClick={clearChat}
            className="text-xs text-muted transition-colors hover:text-foreground"
          >
            Clear chat
          </button>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-4">
        {turns.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => void send(suggestion)}
                disabled={pending}
                className="rounded-full border border-border/60 bg-white/[0.02] px-3 py-1.5 text-xs text-muted transition-colors hover:border-muted/50 hover:text-foreground disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3" aria-live="polite">
          {turns.map((turn, index) => (
            <div key={index} className={cn("flex", turn.role === "user" ? "justify-end" : "justify-start")}>
              <p
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  turn.role === "user"
                    ? "bg-primary/15 text-foreground"
                    : "border border-border/60 bg-white/[0.03] text-muted"
                )}
              >
                {turn.text}
              </p>
            </div>
          ))}

          {pending && (
            <div className="flex items-center gap-2 text-xs text-muted">
              <Spinner className="h-3.5 w-3.5 text-primary" />
              The board is reviewing its findings…
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <label htmlFor="followup-input" className="sr-only">
            Ask a follow-up question
          </label>
          <Textarea
            id="followup-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. What if we cut the price by 30%?"
            rows={2}
            maxLength={1000}
            disabled={pending}
          />
          <Button type="submit" size="lg" disabled={pending || input.trim().length < 3} aria-label="Send question">
            <SendHorizontal className="h-4 w-4" aria-hidden="true" />
          </Button>
        </form>
      </div>
    </WorkspaceSection>
  );
}