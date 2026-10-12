"""
Robust parsing helpers for turning LLM text output into our Pydantic
schemas. LLMs occasionally wrap JSON in markdown fences or add a stray
sentence despite instructions -- these helpers tolerate that without
silently swallowing genuine malformed output.
"""
from __future__ import annotations

import json
import re
from typing import Any, Dict, Type, TypeVar

from pydantic import BaseModel

from utils.exceptions import AgentExecutionError
from utils.logger import get_logger

logger = get_logger(__name__)

T = TypeVar("T", bound=BaseModel)

_JSON_FENCE_RE = re.compile(r"```(?:json)?\s*(.*?)\s*```", re.DOTALL)


def extract_json_object(text: str) -> Dict[str, Any]:
    """Extracts the first JSON object found in `text`, tolerating markdown fences."""
    if not text or not text.strip():
        raise ValueError("Empty text; cannot extract JSON.")

    fence_match = _JSON_FENCE_RE.search(text)
    candidate = fence_match.group(1) if fence_match else text.strip()

    # If there's leading/trailing prose around the object, isolate the
    # outermost {...} span.
    start = candidate.find("{")
    end = candidate.rfind("}")
    if start == -1 or end == -1 or end < start:
        raise ValueError("No JSON object found in text.")

    return json.loads(candidate[start : end + 1])


def parse_agent_output(
    text: str, model_cls: Type[T], agent_name: str, force_agent_name_field: str | None = None
) -> T:
    """
    Parses raw LLM text into the given Pydantic model, raising AgentExecutionError on failure.

    `force_agent_name_field`: if the target schema has an `agent_name` field, the
    LLM sometimes echoes its own internal agent name (e.g. "cto_agent") instead of
    the exact enum value our schema expects (e.g. "cto"). Rather than relying on
    the model to get this exactly right, we overwrite it with a known-correct
    value after parsing. Pass the correct value here (e.g. "cto") to force it.
    """
    try:
        data = extract_json_object(text)
        if force_agent_name_field is not None:
            data["agent_name"] = force_agent_name_field
        return model_cls.model_validate(data)
    except Exception as exc:  # noqa: BLE001
        logger.error("Failed to parse output for %s: %s\nRaw text: %.500s", agent_name, exc, text)
        raise AgentExecutionError(agent_name, f"Could not parse structured output: {exc}") from exc
