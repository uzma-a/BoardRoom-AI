"""
Filesystem MCP integration.

Used by the Coordinator to persist board sessions and export the final
Board Resolution report to disk. Sandboxed to a single root directory
(`settings.mcp_filesystem_root`) -- the MCP filesystem server is only ever
given that one path, so no agent can read or write anywhere else on disk.
"""
from __future__ import annotations

import os

from config import get_settings
from utils.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()


def get_filesystem_tool():
    """
    Returns an MCPToolset scoped to settings.mcp_filesystem_root, or None if
    filesystem MCP integration is disabled.
    """
    if not settings.mcp_filesystem_enabled:
        return None

    os.makedirs(settings.mcp_filesystem_root, exist_ok=True)

    try:
        from google.adk.tools.mcp_tool.mcp_toolset import MCPToolset
        from mcp import StdioServerParameters

        return MCPToolset(
            connection_params=StdioServerParameters(
                command="npx",
                args=[
                    "-y",
                    "@modelcontextprotocol/server-filesystem",
                    os.path.abspath(settings.mcp_filesystem_root),
                ],
            ),
            # Least privilege: only allow read/write/list, never delete.
            tool_filter=["read_file", "write_file", "list_directory"],
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("Filesystem MCP server unavailable (%s); persistence disabled.", exc)
        return None
