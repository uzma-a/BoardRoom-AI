"""
GET /api/sessions            -> summary list of past sessions, newest first
GET /api/sessions/{id}       -> the full stored BoardResolution for one session
"""
from __future__ import annotations

from fastapi import APIRouter, Request

from security.validation import validate_session_id
from utils.exceptions import SessionNotFoundError

router = APIRouter()

@router.get("/sessions")
async def list_sessions(request: Request) -> list[dict]:
    return request.app.state.board_memory.list_sessions()


@router.get("/sessions/{session_id}")
async def get_session(session_id: str, request: Request) -> dict:
    validate_session_id(session_id)
    resolution = request.app.state.board_memory.get_session_resolution(session_id)
    if resolution is None:
        raise SessionNotFoundError(f"Session '{session_id}' not found.")
    return resolution