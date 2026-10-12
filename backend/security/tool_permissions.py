"""
Tool permission validation (least-privilege enforcement).

Each agent factory in agents/ declares which tool *categories* it is
attaching before constructing its LlmAgent, and this module checks that
declaration against a hardcoded allowlist. This is a defense-in-depth
check against a specific failure mode: a future code change accidentally
giving an agent a tool it shouldn't have (e.g. someone copy-pastes the
CTO agent's tool setup into the Risk agent, which should never make
external calls).

This does NOT replace the sandboxing already built into each MCP
integration (see mcp_servers/) -- it's an additional, cheap, explicit
check that fails loudly and immediately at startup rather than silently
granting excess privilege.
"""
from __future__ import annotations

from typing import Dict, Iterable, Set

from utils.exceptions import ToolPermissionError
from utils.logger import get_logger

logger = get_logger(__name__)

# The canonical source of truth for which tool categories each agent is
# permitted to use. Keep this in sync with the KAGGLE/architecture docs --
# if you need to give an agent a new tool, update this map FIRST, then the
# agent factory, so the allowlist is always the more conservative side of
# any merge conflict.
ALLOWED_TOOL_CATEGORIES: Dict[str, Set[str]] = {
    "cto": {"web_search", "github"},
    "cfo": {"web_search"},
    "marketing": {"web_search"},
    "legal": {"web_search"},
    # Risk and CEO reason over prior board findings only -- no external
    # tools. Giving either of them live web access would let a maliciously
    # crafted business idea trigger unreviewed outbound requests at the
    # most trusted stage of the pipeline.
    "risk": set(),
    "ceo": set(),
}


def enforce_tool_allowlist(agent_name: str, requested_categories: Iterable[str]) -> None:
    """
    Raises ToolPermissionError if `requested_categories` contains anything
    not in `agent_name`'s allowlist. Call this in every agent factory,
    immediately before constructing the LlmAgent, with the exact tool
    categories you're about to attach.
    """
    allowed = ALLOWED_TOOL_CATEGORIES.get(agent_name)
    if allowed is None:
        raise ToolPermissionError(f"Unknown agent '{agent_name}' has no declared tool allowlist.")

    requested = set(requested_categories)
    disallowed = requested - allowed

    if disallowed:
        raise ToolPermissionError(
            f"Agent '{agent_name}' attempted to attach disallowed tool categories "
            f"{sorted(disallowed)}. Allowed categories for '{agent_name}' are "
            f"{sorted(allowed) or '(none)'}. Update security/tool_permissions.py "
            "if this tool grant is intentional."
        )

    logger.debug("Tool allowlist check passed for '%s': categories=%s", agent_name, sorted(requested))
