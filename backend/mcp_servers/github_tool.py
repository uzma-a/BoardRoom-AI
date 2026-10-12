"""
GitHub MCP integration (optional).

Lets the CTO agent check whether open-source precedent already exists for
a proposed idea (e.g. "AI Lawyer for India" -> search for similar repos).
Read-only: scoped via headers so the agent can never open issues, push
code, or modify a repository.
"""
from __future__ import annotations

from config import get_settings
from utils.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()


def get_github_tool():
    """Returns a read-only GitHub MCPToolset, or None if disabled/unconfigured."""
    if not settings.mcp_github_enabled or not settings.github_token:
        return None

    try:
        from google.adk.tools.mcp_tool.mcp_toolset import MCPToolset
        from google.adk.tools.mcp_tool.mcp_session_manager import StreamableHTTPServerParams

        return MCPToolset(
            connection_params=StreamableHTTPServerParams(
                url="https://api.githubcopilot.com/mcp/",
                headers={
                    "Authorization": f"Bearer {settings.github_token}",
                    "X-MCP-Toolsets": "repos,code",
                    "X-MCP-Readonly": "true",
                },
            ),
            tool_filter=["search_repositories", "search_code"],
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("GitHub MCP server unavailable (%s); skipping.", exc)
        return None
