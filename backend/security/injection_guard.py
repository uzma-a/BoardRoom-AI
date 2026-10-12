"""
Prompt injection defense.

Two layers of protection:

1. Detection: flag user input that contains classic instruction-override
   patterns ("ignore previous instructions", "you are now...", etc.) so we
   can log/reject clearly malicious payloads.

2. Containment: even innocuous-looking input is never concatenated
   directly into an agent's system instruction. It is always wrapped in
   an explicit, delimited "user-provided data" block, and every agent's
   system prompt explicitly states that text inside that block is DATA
   to analyze, never instructions to follow.

Defense-in-depth: neither layer is assumed sufficient on its own.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

_INJECTION_PATTERNS = [
    r"ignore (all|any|the)?\s*(previous|prior|above)\s*instructions?",
    r"disregard (all|any|the)?\s*(previous|prior|above)\s*instructions?",
    r"you are now\s+",
    r"system\s*prompt",
    r"forget (everything|all)\s+",
    r"act as (if|though)",
    r"new instructions?:",
    r"override\s+(your|the)\s+(instructions|rules|guidelines)",
    r"reveal (your|the)\s+(system prompt|instructions|prompt)",
    r"</?(system|assistant|instructions)>",
]

_COMPILED_PATTERNS = [re.compile(p, re.IGNORECASE) for p in _INJECTION_PATTERNS]

# Delimiter used to fence off untrusted user content inside every agent prompt.
USER_DATA_FENCE_START = "<<<BEGIN_USER_SUBMITTED_BUSINESS_IDEA>>>"
USER_DATA_FENCE_END = "<<<END_USER_SUBMITTED_BUSINESS_IDEA>>>"


@dataclass
class InjectionScanResult:
    is_suspicious: bool
    matched_patterns: list[str]


def scan_for_injection(text: str) -> InjectionScanResult:
    """Scans text for known prompt-injection patterns. Does not modify the text."""
    matches = [p.pattern for p in _COMPILED_PATTERNS if p.search(text)]
    return InjectionScanResult(is_suspicious=bool(matches), matched_patterns=matches)


def wrap_untrusted_input(text: str) -> str:
    """
    Wraps user-supplied text in explicit delimiters for inclusion in an agent prompt.

    Every specialist agent's instruction template must reference this fenced
    block and explicitly state that its contents are data, not commands.
    """
    # Strip any pre-existing fence markers from the user's own text so they
    # can't forge a fake "end of user data" boundary.
    sanitized = (
        text.replace(USER_DATA_FENCE_START, "")
        .replace(USER_DATA_FENCE_END, "")
        .strip()
    )
    return f"{USER_DATA_FENCE_START}\n{sanitized}\n{USER_DATA_FENCE_END}"
