"""
Coordinator.

Assembles the full Boardroom AI pipeline as a single ADK SequentialAgent:

    Phase 2: ParallelAgent([CTO, CFO, Marketing, Legal])    -- concurrent
    Phase 3: DebateEngine (deterministic conflict detection) -- sequential
    Phase 4a: Risk agent (reviews the Debate Engine's output) -- sequential
    Phase 4b: CEO agent (cites every specialist + debate)    -- sequential

Every LLM-backed agent (everything except the deterministic DebateEngine)
is wrapped in a SafeAgentWrapper (see agents/safe_agent.py) so that one
agent's failure -- a Gemini rate limit, a transient API error, malformed
output -- degrades that single agent's contribution to a clearly-flagged
fallback finding instead of aborting the entire board session. This is
the core resilience mechanism for "graceful exception handling" at the
pipeline level; see main.py for the API-layer error handling that wraps
this from the outside.

The Coordinator itself has no LLM -- it is the root SequentialAgent plus a
thin Python wrapper (`BoardroomCoordinator`) that owns the ADK `Runner`
and exposes a simple async API to the FastAPI layer: `run(session_id,
idea)` (batch) and `stream(session_id, idea)` (event-by-event, for SSE).
"""
from __future__ import annotations

from typing import AsyncGenerator

from google.adk.agents import ParallelAgent, SequentialAgent
from google.adk.events import Event
from google.adk.runners import Runner
from google.genai import types

from agents.cfo import build_cfo_agent
from agents.ceo import build_ceo_agent
from agents.cto import build_cto_agent
from agents.legal import build_legal_agent
from agents.marketing import build_marketing_agent
from agents.risk import build_risk_agent
from agents.safe_agent import SafeAgentWrapper, ceo_fallback_builder, specialist_fallback_builder
from debate.debate_engine import DebateEngine
from memory.board_memory import APP_NAME, DEFAULT_USER_ID, BoardMemory
from security.injection_guard import wrap_untrusted_input
from utils.exceptions import AgentExecutionError
from utils.logger import get_logger

logger = get_logger(__name__)


def build_boardroom_pipeline() -> SequentialAgent:
    """Builds the full multi-phase agent pipeline as one composable ADK agent."""
    safe_cto = SafeAgentWrapper(
        build_cto_agent(), output_key="cto_finding", build_fallback=specialist_fallback_builder("cto", "CTO")
    )
    safe_cfo = SafeAgentWrapper(
        build_cfo_agent(), output_key="cfo_finding", build_fallback=specialist_fallback_builder("cfo", "CFO")
    )
    safe_marketing = SafeAgentWrapper(
        build_marketing_agent(),
        output_key="marketing_finding",
        build_fallback=specialist_fallback_builder("marketing", "Marketing"),
    )
    safe_legal = SafeAgentWrapper(
        build_legal_agent(), output_key="legal_finding", build_fallback=specialist_fallback_builder("legal", "Legal")
    )
    safe_risk = SafeAgentWrapper(
        build_risk_agent(), output_key="risk_finding", build_fallback=specialist_fallback_builder("risk", "Risk")
    )
    safe_ceo = SafeAgentWrapper(
        build_ceo_agent(), output_key="ceo_resolution", build_fallback=ceo_fallback_builder()
    )

    specialists = ParallelAgent(
        name="specialist_parallel_analysis",
        sub_agents=[safe_cto, safe_cfo, safe_marketing, safe_legal],
    )

    return SequentialAgent(
        name="boardroom_pipeline",
        sub_agents=[
            specialists,
            DebateEngine(),  # deterministic -- not LLM-backed, so not wrapped; see debate_engine.py
            safe_risk,
            safe_ceo,
        ],
    )


class BoardroomCoordinator:
    """
    Thin orchestration wrapper around the ADK Runner.

    Owns one Runner bound to one BoardMemory (session service) for the
    lifetime of the FastAPI app. Created once in main.py's lifespan hook.
    """

    def __init__(self, board_memory: BoardMemory) -> None:
        self.board_memory = board_memory
        self.pipeline = build_boardroom_pipeline()
        self.runner = Runner(
            agent=self.pipeline,
            app_name=APP_NAME,
            session_service=board_memory.session_service,
        )
        logger.info("BoardroomCoordinator initialized with pipeline '%s'.", self.pipeline.name)

    def _build_intake_message(self, idea: str, target_market: str | None) -> types.Content:
        # Both the idea and target market are untrusted end-user input --
        # fence them explicitly so every downstream agent prompt treats
        # them as data, never instructions (see security/injection_guard.py).
        idea_block = wrap_untrusted_input(idea)
        market_line = f"\nTarget market: {wrap_untrusted_input(target_market)}" if target_market else ""
        prompt = (
            "A user has submitted the following business idea for board review.\n\n"
            f"{idea_block}{market_line}"
        )
        return types.Content(role="user", parts=[types.Part(text=prompt)])

    async def stream(
        self, session_id: str, idea: str, target_market: str | None = None
    ) -> AsyncGenerator[Event, None]:
        """
        Streams every ADK event produced while running the full pipeline.
        The API layer's SSE endpoint consumes this directly.

        Note: with every LLM agent wrapped in SafeAgentWrapper, an
        AgentExecutionError should now only reach here for failures
        *outside* individual agent execution (e.g. the Runner or session
        service itself failing) -- genuine single-agent failures are
        caught upstream and degrade gracefully instead of raising.
        """
        message = self._build_intake_message(idea, target_market)
        try:
            async for event in self.runner.run_async(
                user_id=DEFAULT_USER_ID,
                session_id=session_id,
                new_message=message,
            ):
                yield event
        except Exception as exc:  # noqa: BLE001
            logger.exception("Pipeline execution failed for session %s", session_id)
            raise AgentExecutionError("coordinator", str(exc)) from exc

    async def run(self, session_id: str, idea: str, target_market: str | None = None) -> dict:
        """Runs the full pipeline to completion and returns the final session state."""
        async for _ in self.stream(session_id, idea, target_market):
            pass
        state = await self.board_memory.get_state(session_id)
        if state is None:
            raise AgentExecutionError("coordinator", "Session state missing after run.")
        return state
