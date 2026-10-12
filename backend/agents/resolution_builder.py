"""
Translates raw ADK session state into the strongly-typed BoardResolution
the API returns to the client. This is the single place where "loose"
session state (strings, dicts written by different agents/phases) becomes
a validated Pydantic object -- if anything is missing or malformed, it
fails here with a clear, attributable error rather than surfacing as a
confusing downstream KeyError.
"""
from __future__ import annotations

from typing import Dict

from models.schemas import AgentFinding, BoardResolution, DebateSummary, VoteChoice
from utils.exceptions import AgentExecutionError
from utils.logger import get_logger
from utils.parsing import extract_json_object, parse_agent_output

logger = get_logger(__name__)

_FINDING_KEYS = ("cto_finding", "cfo_finding", "marketing_finding", "legal_finding", "risk_finding")

# state key -> correct AgentName enum value (LLMs sometimes echo their internal
# agent name like "cto_agent" instead of the schema's expected "cto")
_FINDING_KEY_TO_AGENT_NAME = {
    "cto_finding": "cto",
    "cfo_finding": "cfo",
    "marketing_finding": "marketing",
    "legal_finding": "legal",
    "risk_finding": "risk",
}


def build_resolution_from_state(state: Dict) -> BoardResolution:
    """Parses every agent's raw output in `state` into a BoardResolution."""
    findings: Dict[str, AgentFinding] = {}
    for key in _FINDING_KEYS:
        raw = state.get(key)
        if not raw:
            logger.error("build_resolution_from_state: '%s' missing from session state.", key)
            raise AgentExecutionError(key, "Missing from session state -- agent may have failed.")
        findings[key] = parse_agent_output(
            raw, AgentFinding, key, force_agent_name_field=_FINDING_KEY_TO_AGENT_NAME[key]
        )

    debate_summary_raw = state.get("debate_summary_json")
    if not debate_summary_raw:
        # The Debate Engine should always have run before Risk/CEO -- if
        # this is missing, something upstream skipped a pipeline phase.
        # We degrade gracefully with an empty summary rather than failing
        # the whole request, since the specialist + CEO output is still
        # valid and useful on its own.
        logger.warning(
            "build_resolution_from_state: 'debate_summary_json' missing from session state; "
            "returning an empty DebateSummary. This should not happen in normal operation."
        )
        debate_summary = DebateSummary(notes="Debate summary unavailable for this run.")
    else:
        debate_summary = DebateSummary.model_validate(debate_summary_raw)

    ceo_raw = state.get("ceo_resolution")
    if not ceo_raw:
        logger.error("build_resolution_from_state: CEO agent produced no resolution.")
        raise AgentExecutionError("ceo_agent", "CEO did not produce a resolution.")

    ceo_data = extract_json_object(ceo_raw)

    board_votes = {
        agent: VoteChoice(vote) for agent, vote in ceo_data.get("board_votes", {}).items()
    }

    return BoardResolution(
        executive_summary=ceo_data["executive_summary"],
        technical_analysis=findings["cto_finding"],
        financial_analysis=findings["cfo_finding"],
        marketing_analysis=findings["marketing_finding"],
        legal_analysis=findings["legal_finding"],
        risk_analysis=findings["risk_finding"],
        debate_summary=debate_summary,
        board_votes=board_votes,
        overall_confidence=ceo_data["overall_confidence"],
        recommended_next_steps=ceo_data.get("recommended_next_steps", []),
        final_decision=ceo_data["final_decision"],
    )
