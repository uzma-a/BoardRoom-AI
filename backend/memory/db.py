"""
SQLite persistence layer for board session history.

Separate from the in-memory ADK session service (InMemorySessionService)
used during a live run -- this only stores the final, completed record
of each session for later retrieval via GET /api/sessions and
GET /api/sessions/{id}.
"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import create_engine, Column, String, DateTime, Text, Float
from sqlalchemy.orm import declarative_base, sessionmaker, Session
import json
from pathlib import Path

from utils.logger import get_logger

DATABASE_URL = "sqlite:///./boardroom_sessions.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class SessionRecord(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, index=True)
    idea = Column(Text, nullable=False)
    target_market = Column(String, nullable=True)
    status = Column(String, nullable=False, default="completed")  # completed | error
    overall_confidence = Column(Float, nullable=True)
    final_decision = Column(Text, nullable=True)
    resolution_json = Column(Text, nullable=True)  # full BoardResolution, serialized as JSON
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


def init_db() -> None:
    """Creates the sessions table if it doesn't already exist. Call once at app startup."""
    Base.metadata.create_all(bind=engine)


def get_db() -> Session:
    """FastAPI dependency: yields a DB session, closes it after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

logger = get_logger(__name__)

SEED_FILE = Path(__file__).resolve().parent.parent / "seed" / "example_sessions.json"


def seed_example_sessions() -> int:
    """
    Inserts the bundled example sessions that aren't in the database yet.
    Runs on every startup, so examples reappear even if the host wipes
    the SQLite file on redeploy. Never overwrites existing rows.
    """
    if not SEED_FILE.exists():
        return 0

    try:
        items = json.loads(SEED_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        logger.warning("Could not read example sessions file: %s", exc)
        return 0

    db = SessionLocal()
    added = 0
    try:
        for item in items:
            if db.get(SessionRecord, item["id"]) is not None:
                continue
            db.add(
                SessionRecord(
                    id=item["id"],
                    idea=item["idea"],
                    target_market=item.get("target_market"),
                    status=item.get("status", "completed"),
                    overall_confidence=item.get("overall_confidence"),
                    final_decision=item.get("final_decision"),
                    resolution_json=item["resolution_json"],
                    created_at=datetime.fromisoformat(item["created_at"]),
                )
            )
            added += 1
        db.commit()
    finally:
        db.close()

    if added:
        logger.info("Seeded %d example session(s).", added)
    return added        