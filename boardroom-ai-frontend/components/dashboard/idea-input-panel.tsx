"use client";

import { useId, useState, type FormEvent, type KeyboardEvent } from "react";
import { Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useBoardSession } from "@/hooks/use-board-session";
import { validateIdea, IDEA_MAX_LENGTH } from "@/lib/validation/idea";
import { cn } from "@/lib/utils";

const IDEA_PLACEHOLDER =
  "I want to launch an AI Healthcare Startup that provides instant symptom triage and connects patients with licensed doctors within minutes...";

export function IdeaInputPanel() {
  const { state, startAnalysis } = useBoardSession();
  const [idea, setIdea] = useState("");
  const [targetMarket, setTargetMarket] = useState("");
  const [touched, setTouched] = useState(false);

  const ideaFieldId = useId();
  const marketFieldId = useId();
  const errorId = useId();

  const isStreaming = state.status === "streaming";
  const validationError = validateIdea(idea);
  const showError = touched && validationError !== null;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (validationError || isStreaming) return;
    startAnalysis(idea.trim(), targetMarket.trim() || null);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    const isSubmitShortcut = (event.metaKey || event.ctrlKey) && event.key === "Enter";
    if (isSubmitShortcut) {
      event.preventDefault();
      handleSubmit(event);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border/60 bg-surface/40 p-5 sm:p-6"
      aria-label="Submit a business idea for board analysis"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-foreground">New Board Analysis</h2>
      </div>

      <div className="mt-4">
        <label htmlFor={ideaFieldId} className="sr-only">
          Business idea
        </label>
        <Textarea
          id={ideaFieldId}
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          onBlur={() => setTouched(true)}
          onKeyDown={handleKeyDown}
          placeholder={IDEA_PLACEHOLDER}
          rows={5}
          maxLength={IDEA_MAX_LENGTH}
          disabled={isStreaming}
          hasError={showError}
          aria-describedby={showError ? errorId : undefined}
        />
        <div className="mt-1.5 flex items-center justify-between">
          <p
            id={errorId}
            className={cn("text-xs", showError ? "text-danger" : "text-transparent")}
            aria-live="polite"
          >
            {showError ? validationError : "\u00A0"}
          </p>
          <p className="text-xs text-muted">
            {idea.length}/{IDEA_MAX_LENGTH}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <label htmlFor={marketFieldId} className="mb-1.5 block text-xs font-medium text-muted">
          Target market <span className="text-muted/60">(optional)</span>
        </label>
        <Input
          id={marketFieldId}
          value={targetMarket}
          onChange={(e) => setTargetMarket(e.target.value)}
          placeholder="e.g. United States, India, Southeast Asia"
          disabled={isStreaming}
        />
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="hidden text-xs text-muted sm:block">
          <kbd className="rounded border border-border/60 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px]">
            {typeof navigator !== "undefined" && navigator.platform?.includes("Mac") ? "⌘" : "Ctrl"}
          </kbd>{" "}
          + <kbd className="rounded border border-border/60 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd> to
          submit
        </p>
        <Button type="submit" size="lg" disabled={isStreaming} className="ml-auto">
          {isStreaming ? (
            <>
              <Spinner />
              Convening the board…
            </>
          ) : (
            "Analyze Business Idea"
          )}
        </Button>
      </div>
    </form>
  );
}
