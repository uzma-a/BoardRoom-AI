"""
Marketing Agent.

Evaluates target audience, competitors, pricing, GTM strategy, and
customer acquisition. Has access to Web Search MCP for competitor
research. Writes its raw JSON-formatted finding to
session.state["marketing_finding"].
"""
from __future__ import annotations

from google.adk.agents import LlmAgent

from config import get_settings
from mcp_servers.web_search import get_web_search_tool
from prompts.marketing_prompt import MARKETING_INSTRUCTION
from security.tool_permissions import enforce_tool_allowlist

settings = get_settings()


def build_marketing_agent() -> LlmAgent:
    enforce_tool_allowlist("marketing", ["web_search"])
    return LlmAgent(
        name="marketing_agent",
        model=settings.gemini_model_flash,
        description="Evaluates target audience, competitors, pricing, and go-to-market strategy.",
        instruction=MARKETING_INSTRUCTION,
        tools=[get_web_search_tool()],
        output_key="marketing_finding",
    )
