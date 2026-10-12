"""
Exports saved sessions into seed/example_sessions.json, which the app
loads on every startup (see memory/db.py: seed_example_sessions).

Run from the backend folder with the venv active:

    python export_example_sessions.py              # list saved sessions
    python export_example_sessions.py ID1 ID2 ID3  # export those sessions

Re-running replaces the file, so pass every id you want to keep.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from memory.db import SessionLocal, SessionRecord

SEED_FILE = Path(__file__).resolve().parent / "seed" / "example_sessions.json"

_FINDING_FIELDS = (
    "technical_analysis",
    "financial_analysis",
    "marketing_analysis",
    "legal_analysis",
    "risk_analysis",
)


def _slug(idea: str) -> str:
    words = re.findall(r"[a-z0-9]+", idea.lower())[:5]
    return ("example-" + "-".join(words))[:64]


def _problems(resolution: dict) -> list[str]:
    found = []
    for field in _FINDING_FIELDS:
        finding = resolution.get(field) or {}
        if not finding.get("confidence"):
            found.append(f"{field}: confidence is 0 (that agent probably failed)")
        if any("vertexaisearch.cloud.google.com" in ref for ref in finding.get("references", [])):
            found.append(f"{field}: contains unresolved grounding links (they may be expired)")
    return found


def list_sessions() -> None:
    db = SessionLocal()
    try:
        rows = db.query(SessionRecord).order_by(SessionRecord.created_at.desc()).all()
        if not rows:
            print("No saved sessions.")
        for r in rows:
            conf = f"{r.overall_confidence:.0%}" if r.overall_confidence is not None else "n/a"
            print(f"{r.id}  {r.created_at:%Y-%m-%d %H:%M}  {conf:>4}  {r.idea[:70]}")
    finally:
        db.close()


def export(ids: list[str]) -> None:
    db = SessionLocal()
    items: list[dict] = []
    used: set[str] = set()
    try:
        for sid in ids:
            r = db.query(SessionRecord).filter(SessionRecord.id == sid).first()
            if r is None or not r.resolution_json:
                print(f"! {sid}: not found, skipped")
                continue

            for problem in _problems(json.loads(r.resolution_json)):
                print(f"  warning ({sid}): {problem}")

            new_id = base = _slug(r.idea)
            n = 2
            while new_id in used:
                new_id = f"{base[:60]}-{n}"
                n += 1
            used.add(new_id)

            items.append(
                {
                    "id": new_id,
                    "idea": r.idea,
                    "target_market": r.target_market,
                    "status": r.status,
                    "overall_confidence": r.overall_confidence,
                    "final_decision": r.final_decision,
                    "resolution_json": r.resolution_json,
                    "created_at": r.created_at.isoformat(),
                }
            )
    finally:
        db.close()

    if not items:
        print("Nothing exported.")
        return

    SEED_FILE.parent.mkdir(parents=True, exist_ok=True)
    SEED_FILE.write_text(json.dumps(items, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {len(items)} example session(s) to {SEED_FILE}")


if __name__ == "__main__":
    args = sys.argv[1:]
    export(args) if args else list_sessions()