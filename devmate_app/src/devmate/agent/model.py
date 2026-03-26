"""Agent state and execution models."""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum


class AgentState(StrEnum):
    """Lifecycle states for the agent run loop."""

    IDLE = "IDLE"
    RUNNING = "RUNNING"
    FINISHED = "FINISHED"
    ERROR = "ERROR"


@dataclass(slots=True)
class AgentRunResult:
    """Result object returned by one agent run."""

    session_id: str
    state: AgentState
    final_answer: str
    steps: int
