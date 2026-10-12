"""
Boardroom AI -- FastAPI application entrypoint.

Wires together configuration, the ADK-backed BoardroomCoordinator, and the
API routers. Run locally with:

    uvicorn main:app --reload --port 8000

Security posture (see security/ package for details):
  - Every custom exception type has a dedicated handler below that
    returns a clean, minimal error payload -- no stack traces, no
    internal file paths, no secrets ever reach the client. Full detail
    goes to the server-side log instead.
  - A catch-all handler for *any* unexpected exception ensures this holds
    even for bugs no one has written a specific handler for yet -- FastAPI's
    default behavior of returning a raw traceback in debug mode is
    explicitly overridden.
  - GOOGLE_API_KEY is validated at startup (fail fast) rather than
    discovered missing on the first user request.
"""
from __future__ import annotations

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from agents.coordinator import BoardroomCoordinator
from api import analyze, stream, sessions, followup
from config import get_settings
from memory.board_memory import BoardMemory
from utils.exceptions import (
    AgentExecutionError,
    BoardroomError,
    FileValidationError,
    RateLimitError,
    SessionNotFoundError,
    ToolPermissionError,
    ValidationError,
)
from utils.logger import get_logger, redact
from memory.db import init_db, seed_example_sessions

settings = get_settings()
logger = get_logger(__name__)


def _validate_environment() -> None:
    """
    Fail-fast check for required secrets/config at startup, rather than
    letting the app boot successfully and only discover a missing key when
    the first user request hits Gemini. Logs the key in redacted form only
    -- never the full value -- so ops can confirm *a* key is loaded without
    it ever appearing in plaintext in logs.
    """
    if not settings.google_api_key:
        if settings.environment == "production":
            raise RuntimeError(
                "GOOGLE_API_KEY is not set. Refusing to start in production without it. "
                "Set it in your environment or .env file."
            )
        logger.warning(
            "GOOGLE_API_KEY is not set. The app will start, but every board analysis "
            "request will fail until it's configured (see .env.example)."
        )
    else:
        logger.info("GOOGLE_API_KEY loaded (%s).", redact(settings.google_api_key))

    if settings.mcp_github_enabled and not settings.github_token:
        logger.warning("MCP_GITHUB_ENABLED is true but GITHUB_TOKEN is empty -- GitHub MCP will be skipped.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---
    init_db()
    seed_example_sessions()
    _validate_environment()

    if settings.google_api_key:
        os.environ.setdefault("GOOGLE_API_KEY", settings.google_api_key)
    os.environ.setdefault(
        "GOOGLE_GENAI_USE_VERTEXAI", "TRUE" if settings.google_genai_use_vertexai else "FALSE"
    )

    board_memory = BoardMemory()
    coordinator = BoardroomCoordinator(board_memory=board_memory)

    app.state.board_memory = board_memory
    app.state.coordinator = coordinator

    logger.info("Boardroom AI backend started (env=%s)", settings.environment)
    yield
    # --- Shutdown ---
    logger.info("Boardroom AI backend shutting down")


app = FastAPI(
    title=settings.app_name,
    description="Your AI Board of Directors that debates before making business decisions.",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# --- Centralized error handling: never leak stack traces or secrets to clients ---
# Each handler logs full detail server-side, and returns a minimal, safe
# payload to the client. Order doesn't matter here (FastAPI dispatches on
# exact/most-specific exception type), but each is listed roughly in the
# order a request would encounter them: rate limit -> validation -> tool
# permission/file issues -> agent execution -> generic boardroom errors ->
# truly unexpected errors.


@app.exception_handler(RateLimitError)
async def handle_rate_limit_error(request: Request, exc: RateLimitError):
    return JSONResponse(status_code=429, content={"error": "rate_limit_exceeded", "message": str(exc)})


@app.exception_handler(ValidationError)
async def handle_validation_error(request: Request, exc: ValidationError):
    return JSONResponse(status_code=422, content={"error": "validation_error", "message": str(exc)})


@app.exception_handler(SessionNotFoundError)
async def handle_session_not_found(request: Request, exc: SessionNotFoundError):
    return JSONResponse(status_code=404, content={"error": "session_not_found", "message": str(exc)})


@app.exception_handler(ToolPermissionError)
async def handle_tool_permission_error(request: Request, exc: ToolPermissionError):
    # This indicates a programming error (an agent misconfigured with a
    # disallowed tool), never something a client request can trigger --
    # but if it somehow surfaces at request time, fail safely and loudly
    # in the logs rather than exposing internal wiring to the client.
    logger.critical("Tool permission violation: %s", exc)
    return JSONResponse(status_code=500, content={"error": "internal_error", "message": "Something went wrong."})


@app.exception_handler(FileValidationError)
async def handle_file_validation_error(request: Request, exc: FileValidationError):
    logger.error("File validation error: %s", exc)
    return JSONResponse(status_code=500, content={"error": "internal_error", "message": "Something went wrong."})


@app.exception_handler(AgentExecutionError)
async def handle_agent_error(request: Request, exc: AgentExecutionError):
    logger.error("Agent execution error: %s", exc)
    return JSONResponse(
        status_code=502,
        content={
            "error": "agent_execution_error",
            "message": "The board could not complete its analysis. Please try again.",
        },
    )


@app.exception_handler(BoardroomError)
async def handle_generic_boardroom_error(request: Request, exc: BoardroomError):
    logger.error("Unhandled boardroom error: %s", exc)
    return JSONResponse(status_code=500, content={"error": "internal_error", "message": "Something went wrong."})


@app.exception_handler(Exception)
async def handle_unexpected_error(request: Request, exc: Exception):
    # Last line of defense: any exception type we haven't explicitly
    # planned for still gets logged with full detail server-side, and the
    # client still only ever sees a generic message -- never a raw
    # traceback, file path, or internal exception message.
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"error": "internal_error", "message": "Something went wrong."})


@app.get("/health")
async def health_check():
    return {"status": "healthy", "app": settings.app_name, "environment": settings.environment}


app.include_router(analyze.router, prefix="/api", tags=["analyze"])
app.include_router(stream.router, prefix="/api", tags=["stream"])
app.include_router(sessions.router, prefix="/api", tags=["sessions"])
app.include_router(followup.router, prefix="/api", tags=["followup"])