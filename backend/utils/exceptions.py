"""Custom exception hierarchy used across the backend for clear, typed error handling."""


class BoardroomError(Exception):
    """Base class for all application-specific errors."""


class ValidationError(BoardroomError):
    """Raised when incoming request data fails validation."""


class AgentExecutionError(BoardroomError):
    """Raised when a specialist or CEO agent fails to produce a valid result."""

    def __init__(self, agent_name: str, message: str):
        self.agent_name = agent_name
        super().__init__(f"[{agent_name}] {message}")


class SessionNotFoundError(BoardroomError):
    """Raised when a requested board session does not exist."""


class ToolExecutionError(BoardroomError):
    """Raised when an MCP tool or function tool call fails."""


class RateLimitError(BoardroomError):
    """Raised when a client exceeds the configured request rate limit."""


class ToolPermissionError(BoardroomError):
    """Raised when an agent is configured with a tool outside its declared allowlist.

    This should only ever fire due to a programming error (someone adding a
    tool to an agent without updating its allowlist) -- it is a defense-in-depth
    check, not something a normal user request can trigger.
    """


class FileValidationError(BoardroomError):
    """Raised when a filename/path fails safety validation before a file operation."""
