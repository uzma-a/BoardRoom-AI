"""
Board memory layer.

Wraps Google ADK's session service so the rest of the app doesn't need to
know whether sessions live in-memory (dev/testing) or in a persistent
store (production). Swapping InMemorySessionService for a database-backed
session service later only requires changing `_build_session_service`.

This module also keeps a lightweight index of past board resolutions so
the frontend can list "previous meetings" without re-querying ADK, and
provides a validated file-export path for persisting a completed Board
Resolution to disk (used together with the Filesystem MCP sandbox --
see mcp_servers/filesystem.py and security/file_validation.py).
"""
from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone
from typing import Dict, Optional

from google.adk.sessions import InMemorySessionService

from config import get_settings
from models.schemas import BoardResolution, BoardSessionState
from security.file_validation import (
    validate_export_filename,
    validate_export_path_within_root,
    validate_export_size,
)
from utils.exceptions import FileValidationError
from utils.logger import get_logger

from memory.db import SessionLocal, SessionRecord

logger = get_logger(__name__)
settings = get_settings()

APP_NAME = "boardroom_ai"
DEFAULT_USER_ID = "anonymous"  # replace with real auth user id once auth is added


def _build_session_service() -> InMemorySessionService:
    # NOTE: swap this for a persistent ADK session service (e.g. database-backed)
    # before going to production, so board history survives a restart.
    return InMemorySessionService()


class BoardMemory:
    """
    Facade over ADK session state + an in-process history index.

    One BoardMemory instance is created at app startup and shared across
    requests (see main.py's app.state.board_memory).
    """

    def __init__(self) -> None:
        self.session_service = _build_session_service()
        self._history: Dict[str, dict] = {}  # session_id -> lightweight summary record

    @staticmethod
    def new_session_id() -> str:
        return uuid.uuid4().hex[:16]

    async def create_session(self, session_id: str, idea: str, target_market: Optional[str]) -> None:
        await self.session_service.create_session(
            app_name=APP_NAME,
            user_id=DEFAULT_USER_ID,
            session_id=session_id,
            state={
                "session_id": session_id,
                "idea": idea,
                "target_market": target_market,
                "findings": {},
                "status": "pending",
            },
        )
        self._history[session_id] = {
            "session_id": session_id,
            "idea": idea,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "status": "pending",
        }
        logger.info("Created board session %s", session_id)

    async def get_state(self, session_id: str) -> Optional[dict]:
        session = await self.session_service.get_session(
            app_name=APP_NAME, user_id=DEFAULT_USER_ID, session_id=session_id
        )
        return session.state if session else None

    def record_resolution(self, session_id: str, idea: str, target_market: str | None, resolution) -> None:
        if session_id in self._history:
            self._history[session_id]["status"] = "completed"
            self._history[session_id]["final_decision"] = resolution.final_decision
            self._history[session_id]["overall_confidence"] = resolution.overall_confidence

        if resolution.overall_confidence == 0.0:
            return
        
        db = SessionLocal()
        try:
            record = SessionRecord(
                id=session_id,
                idea=idea,
                target_market=target_market,
                status="completed",
                overall_confidence=resolution.overall_confidence,
                final_decision=resolution.final_decision,
                resolution_json=resolution.model_dump_json(),
            )
            db.merge(record)  # merge = insert or update, safe if called twice for the same id
            db.commit()
        finally:
            db.close()

    

    def list_history(self) -> list[dict]:
        return sorted(self._history.values(), key=lambda r: r["created_at"], reverse=True)


    def list_sessions(self) -> list[dict]:
        """Returns a lightweight summary of every stored session, newest first."""
        db = SessionLocal()
        try:
            records = db.query(SessionRecord).order_by(SessionRecord.created_at.desc()).all()
            return [
                {
                    "id": r.id,
                    "idea": r.idea,
                    "target_market": r.target_market,
                    "status": r.status,
                    "overall_confidence": r.overall_confidence,
                    "final_decision": r.final_decision,
                    "created_at": r.created_at.isoformat(),
                }
                for r in records
            ]
        finally:
            db.close()

    def get_session_resolution(self, session_id: str) -> dict | None:
        """Returns the full stored BoardResolution JSON for one session, or None if not found."""
        db = SessionLocal()
        try:
            record = db.query(SessionRecord).filter(SessionRecord.id == session_id).first()
            if record is None or record.resolution_json is None:
                return None
            return json.loads(record.resolution_json)
        finally:
            db.close()

    def get_session_context(self, session_id: str) -> dict | None:
        """Returns the idea, target market and full resolution for one stored session, or None."""
        db = SessionLocal()
        try:
            record = db.query(SessionRecord).filter(SessionRecord.id == session_id).first()
            if record is None or record.resolution_json is None:
                return None
            return {
                "idea": record.idea,
                "target_market": record.target_market,
                "resolution": json.loads(record.resolution_json),
            }
        finally:
            db.close()        

            
    def export_resolution_to_file(self, session_id: str, resolution: BoardResolution) -> str:
        """
        Writes a completed BoardResolution to a JSON file inside the
        sandboxed export root (settings.mcp_filesystem_root), applying
        every layer of file validation: safe filename, extension
        allowlist, size limit, and a final "does this path actually
        resolve inside the sandbox root" check. Returns the absolute path
        written.

        Raises FileValidationError if any check fails -- callers should
        treat export as best-effort and not let a failure here affect the
        already-computed BoardResolution response to the client.
        """
        os.makedirs(settings.mcp_filesystem_root, exist_ok=True)

        filename = validate_export_filename(f"board_resolution_{session_id}", ".json")
        candidate_path = os.path.join(settings.mcp_filesystem_root, filename)
        safe_path = validate_export_path_within_root(candidate_path)

        content = json.dumps(resolution.model_dump(mode="json"), indent=2)
        validate_export_size(content)

        with open(safe_path, "w", encoding="utf-8") as f:
            f.write(content)

        logger.info("Exported board resolution for session %s to %s", session_id, safe_path)
        return safe_path
