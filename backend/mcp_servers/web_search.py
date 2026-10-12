"""
Web Search MCP integration.

Provides a toolset that lets agents pull real, current information
(market data, competitor news, pricing) instead of relying on the LLM's
static training knowledge. Uses the community `@modelcontextprotocol` style
MCP web-search server over stdio via npx, with Google's built-in
`google_search` tool as an automatic fallback if no MCP server is
configured (e.g. npx/Node isn't available in the deployment environment).

Least privilege: this toolset is only ever attached to agents that
actually need external research (CTO, CFO, Marketing, Legal) -- never to
the Risk or CEO agents, which reason purely over other agents' findings.
"""
from __future__ import annotations

from typing import Optional

from config import get_settings
from utils.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()


def get_web_search_tool():
    """
    Returns a tool (or toolset) usable in an ADK agent's `tools=[...]` list.

    Tries, in order:
      1. A real Web Search MCP server (stdio, via npx) if enabled.
      2. ADK's built-in `google_search` grounding tool as a safe fallback.
    """
    if settings.mcp_web_search_enabled:
        try:
            from google.adk.tools.mcp_tool.mcp_toolset import MCPToolset
            from mcp import StdioServerParameters

            return MCPToolset(
                connection_params=StdioServerParameters(
                    command="npx",
                    args=["-y", "@modelcontextprotocol/server-brave-search"],
                    env={"BRAVE_API_KEY": _get_brave_key()},
                ),
                tool_filter=["brave_web_search"],
            )
        except Exception as exc:  # noqa: BLE001 - fall back gracefully, log why
            logger.warning(
                "Web Search MCP server unavailable (%s); falling back to google_search.", exc
            )

    from google.adk.tools import google_search

    return google_search


def _get_brave_key() -> str:
    import os

    return os.environ.get("BRAVE_API_KEY", "")
