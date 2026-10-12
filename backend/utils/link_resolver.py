"""
Replaces Gemini grounding redirect links with the real source URLs.

The redirects (vertexaisearch.cloud.google.com/grounding-api-redirect/...)
expire, so they are resolved right after the board finishes, while they
still work, and the real URL is what gets stored and shown.
"""
from __future__ import annotations

import asyncio
from typing import Dict, List, Optional

import httpx

from models.schemas import BoardResolution
from utils.logger import get_logger

logger = get_logger(__name__)

_REDIRECT_PREFIX = "https://vertexaisearch.cloud.google.com/grounding-api-redirect/"
_JUNK_PREFIXES = ("https://www.google.com/search",)
_FINDING_FIELDS = (
    "technical_analysis",
    "financial_analysis",
    "marketing_analysis",
    "legal_analysis",
    "risk_analysis",
)


async def _resolve_one(client: httpx.AsyncClient, sem: asyncio.Semaphore, url: str) -> Optional[str]:
    """Returns the real URL, None if the link is dead (404), or the original if we can't tell."""
    async with sem:
        try:
            response = await client.get(url, follow_redirects=False)
        except httpx.HTTPError:
            return url  # network trouble: keep the original rather than lose a source
    location = response.headers.get("location")
    if response.is_redirect and location:
        return location
    if response.status_code == 404:
        return None
    return url


def _clean(references: List[str], resolved: Dict[str, Optional[str]]) -> List[str]:
    out: List[str] = []
    for ref in references:
        if ref.startswith(_JUNK_PREFIXES):
            continue
        if ref in resolved:
            ref = resolved[ref]  # type: ignore[assignment]
            if ref is None:
                continue
        if ref not in out:
            out.append(ref)
    return out


async def resolve_reference_links(resolution: BoardResolution) -> BoardResolution:
    findings = [getattr(resolution, field) for field in _FINDING_FIELDS]
    urls = list({ref for f in findings for ref in f.references if ref.startswith(_REDIRECT_PREFIX)})

    resolved: Dict[str, Optional[str]] = {}
    if urls:
        sem = asyncio.Semaphore(10)
        async with httpx.AsyncClient(timeout=5.0) as client:
            results = await asyncio.gather(*(_resolve_one(client, sem, u) for u in urls))
        resolved = dict(zip(urls, results))
        logger.info(
            "Resolved %d/%d grounding links (%d dead).",
            sum(1 for r in results if r), len(urls), sum(1 for r in results if r is None),
        )

    for finding in findings:
        finding.references = _clean(finding.references, resolved)
    return resolution