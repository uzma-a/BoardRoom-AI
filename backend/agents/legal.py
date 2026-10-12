"""
Legal Agent.

Evaluates privacy, regulatory, licensing, and compliance considerations.
Has access to Web Search MCP for jurisdiction-specific regulation lookup.
Writes its raw JSON-formatted finding to session.state["legal_finding"].
"""
from __future__ import annotations

from google.adk.agents import LlmAgent

from config import get_settings
from mcp_servers.web_search import get_web_search_tool
from prompts.legal_prompt import LEGAL_INSTRUCTION
from security.tool_permissions import enforce_tool_allowlist

settings = get_settings()


def build_legal_agent() -> LlmAgent:
    enforce_tool_allowlist("legal", ["web_search"])
    return LlmAgent(
        name="legal_agent",
        model=settings.gemini_model_flash,
        description="Evaluates privacy, regulatory, licensing, and compliance risk.",
        instruction=LEGAL_INSTRUCTION,
        tools=[get_web_search_tool()],
        output_key="legal_finding",
    )
