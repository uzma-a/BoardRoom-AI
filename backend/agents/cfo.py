"""
CFO Agent.

Evaluates development cost, revenue potential, ROI, burn rate, and
financial risk. Has access to Web Search MCP for current market pricing
data. Writes its raw JSON-formatted finding to session.state["cfo_finding"].
"""
from __future__ import annotations

from google.adk.agents import LlmAgent

from config import get_settings
from mcp_servers.web_search import get_web_search_tool
from prompts.cfo_prompt import CFO_INSTRUCTION
from security.tool_permissions import enforce_tool_allowlist

settings = get_settings()


def build_cfo_agent() -> LlmAgent:
    enforce_tool_allowlist("cfo", ["web_search"])
    return LlmAgent(
        name="cfo_agent",
        model=settings.gemini_model_flash,
        description="Evaluates cost, revenue model, ROI, burn rate, and financial risk.",
        instruction=CFO_INSTRUCTION,
        tools=[get_web_search_tool()],
        output_key="cfo_finding",
    )
