"""
File validation.

Used anywhere the backend writes a file to disk (currently: exporting a
completed Board Resolution as a report). Validates the filename itself
(no path traversal, safe characters, allowed extension) as an
application-level check that's independent of -- and in addition to --
the sandboxing already provided by the Filesystem MCP server, which is
scoped to a single root directory (see mcp_servers/filesystem.py). Two
independent layers here means a bug in either one doesn't become a path
traversal vulnerability on its own.
"""
from __future__ import annotations

import os
import re

from config import get_settings
from utils.exceptions import FileValidationError

settings = get_settings()

_SAFE_FILENAME_RE = re.compile(r"^[a-zA-Z0-9_\-]{1,100}$")
_ALLOWED_EXPORT_EXTENSIONS = {".json", ".md", ".txt"}
_MAX_EXPORT_BYTES = 2 * 1024 * 1024  # 2 MB -- a board report is a few KB of JSON/text; this is generous headroom


def validate_export_filename(filename: str, extension: str) -> str:
    """
    Validates a filename (without extension) and an extension for a file
    the backend is about to write. Returns the full validated filename.
    Raises FileValidationError on anything suspicious.
    """
    if extension not in _ALLOWED_EXPORT_EXTENSIONS:
        raise FileValidationError(
            f"Extension '{extension}' is not allowed for export. Allowed: {sorted(_ALLOWED_EXPORT_EXTENSIONS)}"
        )

    if not _SAFE_FILENAME_RE.match(filename):
        raise FileValidationError(
            "Filename must be 1-100 characters of letters, numbers, underscores, or hyphens only "
            "(no path separators, dots, or special characters)."
        )

    return f"{filename}{extension}"


def validate_export_path_within_root(full_path: str) -> str:
    """
    Confirms `full_path` resolves to somewhere inside settings.mcp_filesystem_root,
    guarding against path traversal even if a validated filename is later
    joined with an unexpected base path. Returns the resolved absolute path.
    """
    root = os.path.abspath(settings.mcp_filesystem_root)
    resolved = os.path.abspath(full_path)

    if os.path.commonpath([root, resolved]) != root:
        raise FileValidationError(
            f"Resolved export path '{resolved}' escapes the sandboxed export root '{root}'."
        )

    return resolved


def validate_export_size(content: str) -> None:
    """Raises FileValidationError if `content` exceeds the maximum allowed export size."""
    size = len(content.encode("utf-8"))
    if size > _MAX_EXPORT_BYTES:
        raise FileValidationError(
            f"Export content is {size} bytes, exceeding the {_MAX_EXPORT_BYTES}-byte limit."
        )
