"""
POST /api/sessions/{session_id}/ask

Answers a follow-up question about a stored board session. Stateless:
the client sends the recent conversation with each request.
"""
from __future__ import annotations

from typing import List, Literal

from fastapi import APIRouter, Request
from pydantic import BaseModel, Field

from agents.followup import answer_followup
from security.injection_guard import scan_for_injection
from security.rate_limiter import enforce_rate_limit
from security.validation import validate_followup_question, validate_session_id
from utils.exceptions import SessionNotFoundError
from utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)

MAX_HISTORY_TURNS = 6


class ChatTurn(BaseModel):
    role: Literal["user", "board"]
    text: str = Field(..., max_length=4000)


class FollowupRequest(BaseModel):
    question: str
    history: List[ChatTurn] = Field(default_factory=list, max_length=20)


class FollowupResponse(BaseModel):
    answer: str


@router.post("/sessions/{session_id}/ask", response_model=FollowupResponse)
async def ask_followup(session_id: str, payload: FollowupRequest, request: Request) -> FollowupResponse:
    enforce_rate_limit(request)
    validate_session_id(session_id)
    question = validate_followup_question(payload.question)

    scan = scan_for_injection(question)
    if scan.is_suspicious:
        logger.warning("Potential prompt injection in follow-up question: %s", scan.matched_patterns)

    context = request.app.state.board_memory.get_session_context(session_id)
    if context is None:
        raise SessionNotFoundError(f"Session '{session_id}' not found.")

    history = [{"role": t.role, "text": t.text.strip()} for t in payload.history[-MAX_HISTORY_TURNS:]]

    answer = await answer_followup(
        idea=context["idea"],
        target_market=context["target_market"],
        resolution=context["resolution"],
        question=question,
        history=history,
    )
    return FollowupResponse(answer=answer)