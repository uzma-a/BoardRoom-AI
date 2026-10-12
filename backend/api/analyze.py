"""
POST /api/analyze

Runs the full Boardroom AI pipeline to completion and returns the final
Board Resolution as a single JSON response. For a live, agent-by-agent
view, see /api/stream instead.

Security notes (see security/ package for implementation details):
  - Rate limiting: enforced first, before any validation or LLM spend,
    so an abusive client is rejected as cheaply as possible.
  - Input validation: length/content checks on the idea text itself.
  - Prompt injection scanning: logged, not blocking -- the request still
    proceeds because every downstream agent prompt fences user input as
    data (see security/injection_guard.py), which is the real defense.
    The scan here exists purely for observability/alerting.
"""
from __future__ import annotations

import time

from fastapi import APIRouter, Request

from agents.resolution_builder import build_resolution_from_state
from models.schemas import BoardResolution, IdeaSubmission
from security.injection_guard import scan_for_injection
from security.rate_limiter import enforce_rate_limit
from security.validation import validate_idea_text, validate_session_id
from utils.logger import get_logger
from utils.link_resolver import resolve_reference_links

router = APIRouter()
logger = get_logger(__name__)


@router.post("/analyze", response_model=BoardResolution)
async def analyze_idea(payload: IdeaSubmission, request: Request) -> BoardResolution:
    enforce_rate_limit(request)

    idea = validate_idea_text(payload.idea)
    validate_session_id(payload.session_id)

    scan = scan_for_injection(idea)
    if scan.is_suspicious:
        logger.warning("Potential prompt injection attempt detected: %s", scan.matched_patterns)
        # We don't reject outright -- the board still reviews it, but every
        # agent prompt fences this input as data (see injection_guard.py),
        # and the attempt is logged for monitoring.

    board_memory = request.app.state.board_memory
    coordinator = request.app.state.coordinator

    session_id = payload.session_id or board_memory.new_session_id()
    await board_memory.create_session(session_id, idea, payload.target_market)

    start = time.monotonic()
    logger.info("analyze: starting board session %s", session_id)

    final_state = await coordinator.run(session_id, idea, payload.target_market)
    resolution = build_resolution_from_state(final_state)
    resolution = await resolve_reference_links(resolution)
    board_memory.record_resolution(session_id, idea, payload.target_market, resolution)

    try:
        board_memory.export_resolution_to_file(session_id, resolution)
    except Exception as exc:  # noqa: BLE001
        # Export is a nice-to-have, not a hard requirement -- a failure
        # here (disk full, permissions, validation) should never cost the
        # client their already-computed resolution.
        logger.warning("Failed to export resolution for session %s to disk: %s", session_id, exc)

    elapsed = time.monotonic() - start
    logger.info(
        "analyze: session %s completed in %.1fs -- final_decision=%r, overall_confidence=%.2f",
        session_id, elapsed, resolution.final_decision[:80], resolution.overall_confidence,
    )

    return resolution
