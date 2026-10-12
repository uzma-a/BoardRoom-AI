"""
Rate limiting.

A simple in-memory sliding-window limiter keyed by client IP. This is
intentionally not a distributed rate limiter (no Redis, no shared state
across processes) -- for a single-instance FastAPI deployment (the
target for this project, per the Cloud Run / Render deployment plan)
that's a reasonable tradeoff: zero extra infrastructure, and it still
protects against the two realistic threats for this app: (1) a client
accidentally hammering /api/analyze in a retry loop, and (2) someone
trying to run up your Gemini API bill by scripting requests.

If this backend is ever horizontally scaled across multiple instances,
swap `_WINDOWS` for a Redis-backed counter -- the `enforce_rate_limit`
call site doesn't need to change.
"""
from __future__ import annotations

import time
from collections import defaultdict, deque
from typing import Deque, Dict

from fastapi import Request

from config import get_settings
from utils.exceptions import RateLimitError
from utils.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()

_WINDOW_SECONDS = 60.0

# client_key -> deque of request timestamps within the current window.
# Unbounded growth is prevented because we prune expired timestamps on
# every check, and the number of distinct client keys is bounded by
# actual traffic (this is an in-memory dev/single-instance limiter, not
# meant to survive a DDoS -- a reverse proxy / WAF should sit in front of
# this in a real production deployment).
_WINDOWS: Dict[str, Deque[float]] = defaultdict(deque)


def _client_key(request: Request) -> str:
    """
    Identifies the client for rate-limiting purposes.

    Uses the client IP as seen by FastAPI. If this app sits behind a
    reverse proxy (nginx, Cloud Run's load balancer, etc.), configure
    that proxy to pass the real client IP through `X-Forwarded-For` and
    ensure uvicorn is run with `--proxy-headers` so `request.client.host`
    reflects the real client rather than the proxy's own address.
    """
    if request.client is None:
        return "unknown"
    return request.client.host


def enforce_rate_limit(request: Request, limit_per_minute: int | None = None) -> None:
    """
    Raises RateLimitError if the calling client has exceeded the configured
    requests-per-minute limit. Call this at the top of any endpoint that
    triggers real LLM spend (i.e. /api/analyze and /api/stream).
    """
    limit = limit_per_minute if limit_per_minute is not None else settings.rate_limit_per_minute
    key = _client_key(request)
    now = time.monotonic()
    window = _WINDOWS[key]

    # Prune timestamps outside the sliding window.
    while window and now - window[0] > _WINDOW_SECONDS:
        window.popleft()

    if len(window) >= limit:
        logger.warning("Rate limit exceeded for client %s (%d requests in last 60s).", key, len(window))
        raise RateLimitError(
            f"Rate limit exceeded: max {limit} requests per minute. Please wait before retrying."
        )

    window.append(now)
