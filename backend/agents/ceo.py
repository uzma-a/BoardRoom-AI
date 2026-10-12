"""
CEO Agent.

Runs last. Synthesizes every specialist finding plus the Risk agent's
cross-cutting view into the Final Board Resolution. Uses no external
tools -- pure synthesis over existing board state. Uses the more capable
"pro" model since this is the highest-stakes single output of the run.

Writes its raw JSON-formatted resolution to session.state["ceo_resolution"].
"""
from __future__ import annotations

from google.adk.agents import LlmAgent

from config import get_settings
from prompts.ceo_prompt import CEO_INSTRUCTION
from security.tool_permissions import enforce_tool_allowlist

settings = get_settings()


def build_ceo_agent() -> LlmAgent:
    enforce_tool_allowlist("ceo", [])
    return LlmAgent(
        name="ceo_agent",
        model=settings.gemini_model_pro,
        description="Synthesizes all board findings into the final Board Resolution.",
        instruction=CEO_INSTRUCTION,
        tools=[],
        output_key="ceo_resolution",
    )
