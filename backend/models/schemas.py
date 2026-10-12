"""
Pydantic schemas that define every data contract in the system:

- What the frontend sends us (IdeaSubmission)
- What each specialist agent produces (AgentFinding)
- What lives in the shared board session (BoardSessionState)
- What the CEO agent produces at the end (BoardResolution)

Keeping these in one place means agents, the debate engine, and the API
layer all speak the exact same language.
"""
from __future__ import annotations

from enum import Enum
from typing import Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


class AgentName(str, Enum):
    COORDINATOR = "coordinator"
    CTO = "cto"
    CFO = "cfo"
    MARKETING = "marketing"
    LEGAL = "legal"
    RISK = "risk"
    CEO = "ceo"


class VoteChoice(str, Enum):
    APPROVE = "approve"
    REJECT = "reject"
    CONDITIONAL = "conditional"


class IdeaSubmission(BaseModel):
    """Incoming request payload from the frontend."""

    idea: str = Field(..., description="The business idea submitted by the user.")
    target_market: Optional[str] = Field(
        default=None, description="Optional target market / geography for the idea."
    )
    session_id: Optional[str] = Field(
        default=None, description="Existing session id to resume, if any."
    )

    @field_validator("idea")
    @classmethod
    def idea_must_not_be_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("idea must not be empty")
        return v.strip()


class AgentFinding(BaseModel):
    """Standardized output every specialist agent must produce."""

    agent_name: AgentName
    summary: str = Field(..., description="2-4 sentence summary of the analysis.")
    key_points: List[str] = Field(default_factory=list)
    confidence: float = Field(..., ge=0.0, le=1.0)
    risks_identified: List[str] = Field(default_factory=list)
    references: List[str] = Field(
        default_factory=list, description="Sources gathered via tools/MCP servers."
    )
    cross_references: List[str] = Field(
        default_factory=list,
        description="Notes on how this finding relates to other agents' findings "
        "(populated during the debate/cross-reference phase).",
    )
    vote: Optional[VoteChoice] = None


class DebateSummary(BaseModel):
    """
    Deterministic output of the Debate Engine phase (see debate/debate_engine.py).

    This is built entirely from rule-based comparison of the four specialist
    findings -- no LLM call, no invented dialogue. `agreements` and
    `conflicts` are plain-language notes a human board member could have
    written after reading all four reports side by side.
    """

    agreements: List[str] = Field(
        default_factory=list, description="Points where specialists independently reached compatible conclusions."
    )
    conflicts: List[str] = Field(
        default_factory=list, description="Points where specialists disagree or their findings are in tension."
    )
    vote_alignment: Dict[str, VoteChoice] = Field(
        default_factory=dict, description="Each specialist's vote, gathered here for quick reference."
    )
    notes: str = Field(
        default="", description="One-paragraph deterministic synthesis of the above, handed to Risk and CEO."
    )


class BoardSessionState(BaseModel):
    """The shared 'memory' object all agents read from and write to during one run."""

    session_id: str
    idea: str
    target_market: Optional[str] = None
    findings: Dict[str, AgentFinding] = Field(default_factory=dict)
    debate_summary: Optional[DebateSummary] = None
    resolution: Optional["BoardResolution"] = None
    status: str = Field(default="pending")  # pending | in_progress | completed | failed


class BoardResolution(BaseModel):
    """Final synthesized output produced by the CEO agent."""

    executive_summary: str
    technical_analysis: AgentFinding
    financial_analysis: AgentFinding
    marketing_analysis: AgentFinding
    legal_analysis: AgentFinding
    risk_analysis: AgentFinding
    debate_summary: DebateSummary
    board_votes: Dict[str, VoteChoice]
    overall_confidence: float = Field(..., ge=0.0, le=1.0)
    recommended_next_steps: List[str]
    final_decision: str


BoardSessionState.model_rebuild()
