"""
SafeAgentWrapper.

Wraps any single ADK agent (an LlmAgent, in practice) so that if it fails
-- LLM API error, rate limit, timeout, malformed/empty output -- the
failure is caught and converted into a clearly-marked fallback finding,
instead of aborting the entire board session.

Why this matters here specifically: the pipeline is
`ParallelAgent([cto, cfo, marketing, legal]) -> DebateEngine -> risk -> ceo`.
Without this wrapper, a single transient Gemini API error on, say, the
Marketing agent would raise an exception that propagates all the way up
through the ParallelAgent, the SequentialAgent, and the Runner, aborting
CTO/CFO/Legal's perfectly good results along with it and returning a
502 to the user who then has to retry the *entire* (expensive) analysis
from scratch. With this wrapper, the board session continues with a
clearly-flagged "this specialist was unavailable" finding, and the
Debate Engine, Risk agent, and CEO all still run and produce a useful
(if less complete) result.

This is NOT a substitute for fixing the underlying failure (see logs --
every fallback is logged at ERROR level) -- it's what keeps one flaky
dependency from taking down an otherwise-successful board session.
"""
from __future__ import annotations

import json
from typing import Any, AsyncGenerator, Callable, Dict

from google.adk.agents import BaseAgent
from google.adk.agents.invocation_context import InvocationContext
from google.adk.events import Event, EventActions
from google.genai import types

from utils.logger import get_logger

logger = get_logger(__name__)

FallbackBuilder = Callable[[BaseException], Dict[str, Any]]


def specialist_fallback_builder(agent_short_name: str, display_name: str) -> FallbackBuilder:
    """
    Builds a fallback-JSON generator matching the AgentFinding schema, for
    use with CTO/CFO/Marketing/Legal/Risk agents. Confidence is pinned to
    0.0 and the vote to "conditional" so a failed agent can never silently
    swing the board's overall confidence or vote tally in either direction.
    """

    def _build(exc: BaseException) -> Dict[str, Any]:
        return {
            "agent_name": agent_short_name,
            "summary": (
                f"The {display_name} agent could not complete its analysis due to a "
                f"system error ({type(exc).__name__}). This board session proceeded "
                f"without {display_name}'s input for this run."
            ),
            "key_points": [],
            "confidence": 0.0,
            "risks_identified": [
                f"{display_name} analysis unavailable -- treat this board resolution as incomplete "
                "until it can be re-run or reviewed manually."
            ],
            "references": [],
            "cross_references": [],
            "vote": "conditional",
        }

    return _build


def ceo_fallback_builder() -> FallbackBuilder:
    """Builds a fallback-JSON generator matching the CEO's expected output contract."""

    def _build(exc: BaseException) -> Dict[str, Any]:
        return {
            "executive_summary": (
                "The CEO agent could not synthesize the board's findings due to a system "
                f"error ({type(exc).__name__}). The individual specialist and risk findings "
                "below are still valid and should be reviewed directly."
            ),
            "board_votes": {},
            "overall_confidence": 0.0,
            "recommended_next_steps": [
                "Re-run the board analysis.",
                "In the meantime, review each specialist's and the Risk agent's findings directly.",
            ],
            "final_decision": "Inconclusive -- automated synthesis failed. Manual review required.",
        }

    return _build


class SafeAgentWrapper(BaseAgent):
    """
    Wraps a single sub-agent, catching any exception it raises (or noticing
    if it produces no final response at all) and emitting a fallback event
    in its place, tagged with the SAME author name as the wrapped agent so
    downstream consumers (DebateEngine, resolution_builder, the SSE stream)
    don't need to know whether a given finding is "real" or a fallback --
    they just read session.state[output_key] as usual.
    """

    output_key: str
    build_fallback: FallbackBuilder

    def __init__(self, wrapped_agent: BaseAgent, output_key: str, build_fallback: FallbackBuilder) -> None:
        super().__init__(
            name=f"safe_{wrapped_agent.name}",
            sub_agents=[wrapped_agent],
            output_key=output_key,
            build_fallback=build_fallback,
        )

    async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        wrapped = self.sub_agents[0]
        produced_final_response = False

        try:
            async for event in wrapped.run_async(ctx):
                yield event
                if event.is_final_response():
                    produced_final_response = True

            if not produced_final_response:
                raise RuntimeError(f"{wrapped.name} completed without producing a final response.")

        except Exception as exc:  # noqa: BLE001 -- intentionally broad: any failure mode gets a fallback
            logger.error(
                "SafeAgentWrapper: '%s' failed (%s: %s). Substituting fallback finding for output_key '%s'.",
                wrapped.name, type(exc).__name__, exc, self.output_key,
            )
            fallback_data = self.build_fallback(exc)
            fallback_json = json.dumps(fallback_data)

            yield Event(
                author=wrapped.name,  # match the real agent's author so downstream mapping is unaffected
                content=types.Content(role=wrapped.name, parts=[types.Part(text=fallback_json)]),
                actions=EventActions(state_delta={self.output_key: fallback_json}),
            )
