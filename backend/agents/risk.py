"""
Risk Agent.

Runs after the four specialists and after the cross-reference step has
assembled `session.state["board_findings_text"]`. Synthesizes a
cross-cutting risk view and flags contradictions between other agents'
findings. Uses no external tools -- pure reasoning over existing state.

Writes its raw JSON-formatted finding to session.state["risk_finding"].
"""
from __future__ import annotations

from google.adk.agents import LlmAgent

from config import get_settings
from prompts.risk_prompt import RISK_INSTRUCTION
from security.tool_permissions import enforce_tool_allowlist

settings = get_settings()


def build_risk_agent() -> LlmAgent:
    # Risk reasons over prior findings only -- no external tools. This
    # call is a no-op today (empty list, empty allowlist) but keeps the
    # allowlist check consistent across every agent factory, so a future
    # change that adds a tool here can't slip through unnoticed.
    enforce_tool_allowlist("risk", [])
    return LlmAgent(
        name="risk_agent",
        model=settings.gemini_model_flash,
        description="Synthesizes execution, operational, market, and product risk across the board.",
        instruction=RISK_INSTRUCTION,
        tools=[],
        output_key="risk_finding",
    )
