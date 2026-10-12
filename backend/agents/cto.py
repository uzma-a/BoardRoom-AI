"""
CTO Agent.

Evaluates technical feasibility, AI complexity, infrastructure, and
scalability. Has access to Web Search MCP (tech landscape research) and,
optionally, GitHub MCP (open-source precedent search).

Writes its raw JSON-formatted finding to session.state["cto_finding"].
"""
from __future__ import annotations

from google.adk.agents import LlmAgent

from config import get_settings
from mcp_servers.github_tool import get_github_tool
from mcp_servers.web_search import get_web_search_tool
from prompts.cto_prompt import CTO_INSTRUCTION
from security.tool_permissions import enforce_tool_allowlist

settings = get_settings()


def build_cto_agent() -> LlmAgent:
    categories = ["web_search"]
    tools = [get_web_search_tool()]

    github_tool = get_github_tool()
    if github_tool is not None:
        tools.append(github_tool)
        categories.append("github")

    # Defense-in-depth: verify the tools we're about to attach match what
    # the CTO agent is actually allowed to use (see security/tool_permissions.py).
    enforce_tool_allowlist("cto", categories)

    return LlmAgent(
        name="cto_agent",
        model=settings.gemini_model_flash,
        description="Evaluates technical feasibility, AI complexity, infrastructure, and scalability.",
        instruction=CTO_INSTRUCTION,
        tools=tools,
        output_key="cto_finding",
    )
