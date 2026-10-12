"""
Input validation for anything that reaches the agent pipeline.

This is deliberately separate from Pydantic's own field validation:
Pydantic checks *shape* (types, required fields); this module checks
*content* (length limits, encoding sanity, disallowed patterns) before
a user's idea is ever interpolated into an LLM prompt.
"""
from __future__ import annotations

import re
import unicodedata

from config import get_settings
from utils.exceptions import ValidationError

settings = get_settings()

# Characters that have no legitimate place in a business-idea description
# and are commonly used to smuggle control sequences.
_SUSPICIOUS_CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")

_MIN_FOLLOWUP_LENGTH = 3
_MAX_FOLLOWUP_LENGTH = 1000

def validate_idea_text(text: str) -> str:
    """
    Validates and normalizes free-text business idea input.

    Raises ValidationError with a user-facing message on failure.
    Returns the cleaned string on success.
    """
    if text is None:
        raise ValidationError("Idea text is required.")

    cleaned = unicodedata.normalize("NFKC", text).strip()

    if len(cleaned) < settings.min_idea_length:
        raise ValidationError(
            f"Idea must be at least {settings.min_idea_length} characters long."
        )

    if len(cleaned) > settings.max_idea_length:
        raise ValidationError(
            f"Idea must be under {settings.max_idea_length} characters. "
            "Please summarize your business idea more concisely."
        )

    if _SUSPICIOUS_CONTROL_CHARS.search(cleaned):
        raise ValidationError("Idea text contains invalid control characters.")

    return cleaned


def validate_session_id(session_id: str | None) -> str | None:
    """Ensures a client-supplied session id can't be used for path traversal or injection."""
    if session_id is None:
        return None
    if not re.fullmatch(r"[a-zA-Z0-9_-]{1,64}", session_id):
        raise ValidationError("Invalid session id format.")
    return session_id

def validate_followup_question(text: str) -> str:
    """Validates a follow-up question before it reaches the model."""
    if text is None:
        raise ValidationError("Question is required.")

    cleaned = unicodedata.normalize("NFKC", text).strip()

    if len(cleaned) < _MIN_FOLLOWUP_LENGTH:
        raise ValidationError(f"Question must be at least {_MIN_FOLLOWUP_LENGTH} characters long.")
    if len(cleaned) > _MAX_FOLLOWUP_LENGTH:
        raise ValidationError(f"Question must be under {_MAX_FOLLOWUP_LENGTH} characters.")
    if _SUSPICIOUS_CONTROL_CHARS.search(cleaned):
        raise ValidationError("Question contains invalid control characters.")

    return cleaned