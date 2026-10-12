"""
GET /api/stream?idea=...&target_market=...

Server-Sent Events endpoint that streams the boardroom pipeline live:
each specialist agent, the deterministic debate phase, the risk agent,
and finally the CEO's resolution -- exactly what the frontend's
Agent Cards + Debate Timeline need to animate the "board meeting" UI.

Event payloads (JSON, one per SSE `data:` line):
    {"type": "agent_started", "agent": "cto"}
    {"type": "agent_finished", "agent": "cto", "finding": {...}}
    {"type": "debate_summary", "debate_summary": {...}}
    {"type": "resolution", "resolution": {...}}
    {"type": "error", "message": "..."}
    {"type": "done"}
"""
from __future__ import annotations

import json
from typing import AsyncGenerator

from fastapi import APIRouter, Query, Request
from sse_starlette.sse import EventSourceResponse

from agents.resolution_builder import build_resolution_from_state
from models.schemas import AgentFinding
from security.injection_guard import scan_for_injection
from security.rate_limiter import enforce_rate_limit
from security.validation import validate_idea_text
from utils.logger import get_logger
from utils.parsing import parse_agent_output
from utils.link_resolver import resolve_reference_links

router = APIRouter()
logger = get_logger(__name__)

# Maps ADK agent/author names to the short keys the frontend Agent Cards use.
_AGENT_KEY_MAP = {
    "cto_agent": "cto",
    "cfo_agent": "cfo",
    "marketing_agent": "marketing",
    "legal_agent": "legal",
    "risk_agent": "risk",
    "ceo_agent": "ceo",
}

_OUTPUT_KEY_MAP = {
    "cto": "cto_finding",
    "cfo": "cfo_finding",
    "marketing": "marketing_finding",
    "legal": "legal_finding",
    "risk": "risk_finding",
}


def _sse(event_type: str, **payload) -> dict:
    return {"event": event_type, "data": json.dumps({"type": event_type, **payload})}


async def _generate_events(
    request: Request, idea: str, target_market: str | None
) -> AsyncGenerator[dict, None]:
    board_memory = request.app.state.board_memory
    coordinator = request.app.state.coordinator

    session_id = board_memory.new_session_id()
    await board_memory.create_session(session_id, idea, target_market)
    logger.info("Stream started for session %s", session_id)

    started_agents: set[str] = set()

    try:
        async for event in coordinator.stream(session_id, idea, target_market):
            if await request.is_disconnected():
                logger.info("Client disconnected from stream for session %s", session_id)
                break

            author = getattr(event, "author", None)
            agent_key = _AGENT_KEY_MAP.get(author)

            if agent_key and agent_key not in started_agents:
                started_agents.add(agent_key)
                yield _sse("agent_started", agent=agent_key)

            if author == "debate_engine" and event.actions and event.actions.state_delta:
                delta = event.actions.state_delta
                yield _sse("debate_summary", debate_summary=delta.get("debate_summary_json", {}))
                continue

            if agent_key in _OUTPUT_KEY_MAP and event.is_final_response():
                raw_text = _extract_text(event)
                try:
                    finding: AgentFinding = parse_agent_output(
                        raw_text, AgentFinding, agent_key, force_agent_name_field=agent_key
                    )
                    yield _sse("agent_finished", agent=agent_key, finding=finding.model_dump(mode="json"))
                except Exception as exc:  # noqa: BLE001
                    logger.error("Failed to parse %s output: %s", agent_key, exc)
                    yield _sse("error", agent=agent_key, message="This agent's output could not be parsed.")

            if author == "ceo_agent" and event.is_final_response():
                final_state = await board_memory.get_state(session_id)
                resolution = build_resolution_from_state(final_state)
                resolution = await resolve_reference_links(resolution)
                board_memory.record_resolution(session_id, idea, target_market, resolution)
                yield _sse("resolution", resolution=resolution.model_dump(mode="json"))

        # Only hand the client an id if the session was actually saved
        # (fully failed runs are skipped by record_resolution), so the
        # dashboard never offers a chat that would 404.
        persisted = board_memory.get_session_resolution(session_id) is not None
        yield _sse("done", session_id=session_id if persisted else None)
        logger.info("Stream completed for session %s", session_id)

    except Exception as exc:  # noqa: BLE001
        logger.exception("Streaming pipeline failed for session %s", session_id)
        yield _sse("error", message="The board encountered an error and could not finish.")


def _extract_text(event) -> str:
    if not event.content or not event.content.parts:
        return ""
    return "".join(part.text or "" for part in event.content.parts)


@router.get("/stream")
async def stream_analysis(
    request: Request,
    idea: str = Query(..., description="The business idea to analyze."),
    target_market: str | None = Query(default=None),
):
    enforce_rate_limit(request)

    clean_idea = validate_idea_text(idea)
    scan = scan_for_injection(clean_idea)
    if scan.is_suspicious:
        logger.warning("Potential prompt injection attempt detected in stream request: %s", scan.matched_patterns)

    return EventSourceResponse(_generate_events(request, clean_idea, target_market))
