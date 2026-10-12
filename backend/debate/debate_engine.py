"""
Debate Engine.

This is a custom ADK agent (subclassing BaseAgent, not LlmAgent) that runs
between Phase 2 (parallel specialist analysis) and Phase 4 (Risk + CEO).
It never calls an LLM and never invents dialogue -- every agreement and
conflict it reports is the deterministic result of comparing the four
specialists' structured `AgentFinding` outputs against each other. This
is intentional: a "debate" that's just another LLM call hallucinating a
plausible-sounding conversation would be worse than useless in a board
decision-support tool -- it would look authoritative while adding no
real signal. Determinism here means the same four findings always
produce the same debate summary, and every claim in it can be traced
back to a specific field on a specific agent's finding.

Pipeline position:

    CTO ─┐
    CFO ─┼─► [this: DebateEngine] ─► Risk Agent ─► CEO Agent
 Marketing┤        (deterministic)   (reviews conflicts) (cites debate)
    Legal ┘

What it does, in order:
  1. Parses each specialist's raw JSON text output into `AgentFinding`.
  2. Compares votes across all four specialists (unanimous / majority /
     direct disagreement).
  3. Compares confidence scores pairwise, flagging large gaps as tension
     even when votes nominally agree.
  4. Compares `risks_identified` text across specialists for shared
     concerns (keyword overlap), surfacing cross-domain agreement that no
     single specialist would otherwise get credit for noticing.
  5. Assembles a `DebateSummary` (agreements, conflicts, vote_alignment,
     notes) and writes it to session state as both a structured object
     (for the final API response) and a formatted text block (for the
     Risk and CEO agents' prompts).
"""
from __future__ import annotations

import itertools
import re
import time
from typing import AsyncGenerator, Dict, List

from google.adk.agents import BaseAgent
from google.adk.agents.invocation_context import InvocationContext
from google.adk.events import Event, EventActions
from google.genai import types

from models.schemas import AgentFinding, AgentName, DebateSummary, VoteChoice
from security.injection_guard import wrap_untrusted_input
from utils.logger import get_logger
from utils.parsing import parse_agent_output

logger = get_logger(__name__)

# Maps the session-state key each specialist writes to, to its canonical
# AgentName. Order here also defines display order in the debate summary.
_SPECIALIST_STATE_KEYS: Dict[str, AgentName] = {
    "cto_finding": AgentName.CTO,
    "cfo_finding": AgentName.CFO,
    "marketing_finding": AgentName.MARKETING,
    "legal_finding": AgentName.LEGAL,
}

_DISPLAY_NAME = {
    AgentName.CTO: "CTO",
    AgentName.CFO: "CFO",
    AgentName.MARKETING: "Marketing",
    AgentName.LEGAL: "Legal",
    AgentName.RISK: "Risk",
    AgentName.CEO: "CEO",
}

# Tuning constants for the deterministic comparisons below. Kept as named
# constants (not magic numbers) so future adjustments are self-documenting.
_CONFIDENCE_CONFLICT_THRESHOLD = 0.35  # min |confidence_a - confidence_b| to flag tension
_MIN_SHARED_KEYWORD_LEN = 6  # ignore short/common words when matching risk language
_MIN_SHARED_KEYWORDS_FOR_AGREEMENT = 2  # how many shared significant words counts as "agreement"

_STOPWORDS = {
    "should", "could", "would", "which", "their", "there", "these", "those",
    "about", "before", "after", "under", "while", "where", "based", "given",
}


def _extract_keywords(text: str) -> set[str]:
    """Extracts lowercase 'significant' words from a piece of text for overlap comparison."""
    words = re.findall(r"[a-zA-Z]+", text.lower())
    return {w for w in words if len(w) >= _MIN_SHARED_KEYWORD_LEN and w not in _STOPWORDS}


def _compare_votes(findings: Dict[AgentName, AgentFinding]) -> tuple[List[str], List[str], Dict[str, VoteChoice]]:
    """Deterministically compares votes across specialists. Returns (agreements, conflicts, vote_map)."""
    agreements: List[str] = []
    conflicts: List[str] = []
    vote_map: Dict[str, VoteChoice] = {
        name.value: finding.vote for name, finding in findings.items() if finding.vote is not None
    }

    votes_present = [v for v in vote_map.values() if v is not None]
    if not votes_present:
        return agreements, conflicts, vote_map

    distinct_votes = set(votes_present)

    if len(distinct_votes) == 1:
        vote = next(iter(distinct_votes))
        agreements.append(
            f"All {len(votes_present)} specialists independently voted '{vote.value}' -- unanimous alignment "
            "on whether the board should proceed."
        )
    elif VoteChoice.APPROVE in distinct_votes and VoteChoice.REJECT in distinct_votes:
        approvers = [_DISPLAY_NAME[AgentName(a)] for a, v in vote_map.items() if v == VoteChoice.APPROVE]
        rejecters = [_DISPLAY_NAME[AgentName(a)] for a, v in vote_map.items() if v == VoteChoice.REJECT]
        conflicts.append(
            f"Direct disagreement: {', '.join(approvers)} voted to approve while "
            f"{', '.join(rejecters)} voted to reject -- the board is not aligned on the basic go/no-go call."
        )
    else:
        # Mixed conditional + approve/reject, no direct approve-vs-reject clash.
        counts = {v.value: votes_present.count(v) for v in distinct_votes}
        summary = ", ".join(f"{count}x {vote}" for vote, count in counts.items())
        agreements.append(f"No specialist flatly rejected the idea; vote distribution was {summary}.")

    return agreements, conflicts, vote_map


def _compare_confidence(findings: Dict[AgentName, AgentFinding]) -> List[str]:
    """Deterministically flags large confidence gaps between specialist pairs as tension."""
    conflicts: List[str] = []
    for (name_a, finding_a), (name_b, finding_b) in itertools.combinations(findings.items(), 2):
        gap = abs(finding_a.confidence - finding_b.confidence)
        if gap >= _CONFIDENCE_CONFLICT_THRESHOLD:
            higher, lower = (
                (name_a, name_b) if finding_a.confidence > finding_b.confidence else (name_b, name_a)
            )
            conflicts.append(
                f"{_DISPLAY_NAME[higher]} is notably more confident ({findings[higher].confidence:.2f}) "
                f"than {_DISPLAY_NAME[lower]} ({findings[lower].confidence:.2f}) -- worth reconciling before "
                "treating either view as the board's consensus."
            )
    return conflicts


def _compare_risk_language(findings: Dict[AgentName, AgentFinding]) -> List[str]:
    """Deterministically finds shared concern language across specialists' risks_identified lists."""
    agreements: List[str] = []
    keyword_sets = {
        name: _extract_keywords(" ".join(finding.risks_identified)) for name, finding in findings.items()
    }
    for (name_a, kws_a), (name_b, kws_b) in itertools.combinations(keyword_sets.items(), 2):
        shared = kws_a & kws_b
        if len(shared) >= _MIN_SHARED_KEYWORDS_FOR_AGREEMENT:
            sample = ", ".join(sorted(shared)[:4])
            agreements.append(
                f"{_DISPLAY_NAME[name_a]} and {_DISPLAY_NAME[name_b]} independently raised overlapping "
                f"concerns around: {sample}."
            )
    return agreements


def _build_notes(agreements: List[str], conflicts: List[str], vote_map: Dict[str, VoteChoice]) -> str:
    """Assembles the one-paragraph deterministic synthesis handed to Risk and CEO."""
    vote_summary = ", ".join(f"{agent}={vote.value}" for agent, vote in vote_map.items()) or "no votes recorded"
    return (
        f"Debate Engine compared {len(vote_map)} specialist findings deterministically: "
        f"{len(agreements)} agreement(s) and {len(conflicts)} conflict(s) identified. "
        f"Vote alignment: {vote_summary}."
    )


def _format_debate_summary_text(summary: DebateSummary) -> str:
    """Renders a DebateSummary into the text block injected into Risk/CEO prompts."""
    lines = [f"Synthesis: {summary.notes}", ""]
    if summary.agreements:
        lines.append("AGREEMENTS:")
        lines.extend(f"- {a}" for a in summary.agreements)
        lines.append("")
    if summary.conflicts:
        lines.append("CONFLICTS:")
        lines.extend(f"- {c}" for c in summary.conflicts)
    return "\n".join(lines).strip()


def _format_findings_block(findings: Dict[AgentName, AgentFinding]) -> str:
    """Renders parsed findings into the text block injected into later prompts."""
    lines: List[str] = []
    for name, finding in findings.items():
        vote_text = finding.vote.value if finding.vote else "n/a"
        lines.append(f"### {_DISPLAY_NAME[name].upper()} (confidence: {finding.confidence:.2f}, vote: {vote_text})")
        lines.append(f"Summary: {finding.summary}")
        if finding.key_points:
            lines.append("Key points: " + "; ".join(finding.key_points))
        if finding.risks_identified:
            lines.append("Risks: " + "; ".join(finding.risks_identified))
        lines.append("")
    return "\n".join(lines).strip()


class DebateEngine(BaseAgent):
    """Custom deterministic agent that cross-references specialist findings and builds a DebateSummary."""

    def __init__(self, name: str = "debate_engine") -> None:
        super().__init__(name=name)

    async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        start = time.monotonic()
        state = ctx.session.state
        parsed_findings: Dict[AgentName, AgentFinding] = {}

        for state_key, agent_name in _SPECIALIST_STATE_KEYS.items():
            raw_text = state.get(state_key)
            if not raw_text:
                # This specialist produced nothing -- likely a prior agent
                # failure. We log and continue with whoever DID report in,
                # rather than crashing the whole board session over one
                # missing voice (see SafeAgentWrapper for the upstream fix
                # that makes this the exceptional case, not the norm).
                logger.warning(
                    "Debate Engine: missing %s in session state; that specialist "
                    "may have failed. Continuing with remaining findings.",
                    state_key,
                )
                continue
            try:
                finding = parse_agent_output(
                    raw_text, AgentFinding, agent_name.value, force_agent_name_field=agent_name.value
                )
                parsed_findings[agent_name] = finding
            except Exception as exc:  # noqa: BLE001
                logger.error("Debate Engine: skipping unparseable finding for %s: %s", agent_name.value, exc)

        if not parsed_findings:
            # Every specialist failed -- nothing to debate. Surface this
            # clearly rather than silently producing an empty summary that
            # looks like "no conflicts found" (which would be misleading).
            logger.error("Debate Engine: no parseable specialist findings available.")
            summary = DebateSummary(
                agreements=[],
                conflicts=["No specialist findings were available to compare -- see earlier agent errors."],
                vote_alignment={},
                notes="Debate could not run: all specialist agents failed to produce parseable output.",
            )
        else:
            vote_agreements, vote_conflicts, vote_map = _compare_votes(parsed_findings)
            confidence_conflicts = _compare_confidence(parsed_findings)
            risk_agreements = _compare_risk_language(parsed_findings)

            agreements = vote_agreements + risk_agreements
            conflicts = vote_conflicts + confidence_conflicts
            notes = _build_notes(agreements, conflicts, vote_map)

            summary = DebateSummary(
                agreements=agreements,
                conflicts=conflicts,
                vote_alignment=vote_map,
                notes=notes,
            )

            # Feed the debate's conflict findings back onto each specialist's
            # own `cross_references` field too, so a client rendering
            # individual agent cards can show "this finding was flagged in
            # debate" without re-deriving it.
            for finding in parsed_findings.values():
                finding.cross_references = conflicts

        board_findings_text = _format_findings_block(parsed_findings)
        debate_summary_text = _format_debate_summary_text(summary)

        # Defense-in-depth against second-order prompt injection: every
        # specialist finding above is itself LLM output derived from
        # untrusted user input (the business idea). A specialist could in
        # principle be tricked into echoing adversarial text inside a
        # `summary` or `key_points` field. Fencing the assembled text
        # again here means Risk and CEO -- the two most "trusted" stages
        # of the pipeline, since CEO's output goes straight to the client
        # -- still treat all of it as data to analyze, not instructions,
        # even if something upstream was compromised. This is on top of,
        # not instead of, the original fencing applied to the raw idea
        # (see security/injection_guard.py and coordinator.py).
        board_findings_text = wrap_untrusted_input(board_findings_text)
        debate_summary_text = wrap_untrusted_input(debate_summary_text)

        elapsed_ms = int((time.monotonic() - start) * 1000)
        logger.info(
            "Debate Engine completed in %dms: %d agreement(s), %d conflict(s) across %d specialist(s).",
            elapsed_ms, len(summary.agreements), len(summary.conflicts), len(parsed_findings),
        )

        yield Event(
            author=self.name,
            content=types.Content(role=self.name, parts=[types.Part(text=debate_summary_text)]),
            actions=EventActions(
                state_delta={
                    "board_findings_text": board_findings_text,
                    "debate_summary_text": debate_summary_text,
                    "debate_summary_json": summary.model_dump(mode="json"),
                }
            ),
        )
