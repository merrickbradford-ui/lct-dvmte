"""Base agent abstraction with explicit state and run lifecycle."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from devmate.agent.model import AgentRunResult, AgentState


class BaseAgent(ABC):
    """Base class that drives a stateful run loop."""

    def __init__(self, *, max_steps: int = 10) -> None:
        """Initialize agent lifecycle state and max loop steps."""
        self.max_steps = max_steps
        self.current_step = 0
        self.state = AgentState.IDLE

    def run(self, user_request: str, session_id: str | None = None) -> AgentRunResult:
        """Execute one full agent run and return structured result metadata."""
        request = self._preprocess_request(user_request)
        if not request:
            self._emit_event(
                "error",
                "Empty request is not allowed.",
                state=AgentState.ERROR.value,
            )
            return AgentRunResult(
                session_id=session_id or "",
                state=AgentState.ERROR,
                final_answer="Empty request is not allowed.",
                steps=0,
            )

        self.state = AgentState.RUNNING
        self.current_step = 0
        run_session_id = self._ensure_session(session_id)
        self._emit_event(
            "run_started",
            "Agent run started.",
            session_id=run_session_id,
            state=self.state.value,
        )

        try:
            result = self._run_loop(request=request, session_id=run_session_id)
            if self.state != AgentState.ERROR:
                self.state = AgentState.FINISHED
            self._emit_event(
                "run_finished",
                "Agent run finished.",
                session_id=run_session_id,
                state=self.state.value,
                steps=self.current_step,
            )
            return AgentRunResult(
                session_id=run_session_id,
                state=self.state,
                final_answer=result,
                steps=self.current_step,
            )
        except Exception as exc:
            self.state = AgentState.ERROR
            self._emit_event(
                "error",
                f"Agent execution error: {exc}",
                session_id=run_session_id,
                state=self.state.value,
                steps=self.current_step,
            )
            return AgentRunResult(
                session_id=run_session_id,
                state=self.state,
                final_answer=f"Agent execution error: {exc}",
                steps=self.current_step,
            )
        finally:
            self._cleanup()

    def _preprocess_request(self, user_request: str) -> str:
        """Normalize user request before entering the run loop."""
        return user_request.strip()

    def _run_loop(self, request: str, session_id: str) -> str:
        """Drive iterative step() execution until termination condition."""
        final_answer = ""
        for step in range(1, self.max_steps + 1):
            self.current_step = step
            self._emit_event(
                "step_started",
                f"Starting step {step}.",
                session_id=session_id,
                step=step,
            )
            should_continue, answer = self.step(
                request=request,
                session_id=session_id,
                step_number=step,
            )
            final_answer = answer
            if not should_continue:
                break
        return final_answer

    def _emit_event(self, event_type: str, message: str, **payload: Any) -> None:
        """Emit runtime events for UIs or telemetry hooks."""
        return None

    @abstractmethod
    def step(self, request: str, session_id: str, step_number: int) -> tuple[bool, str]:
        """Execute one iteration; return continue-flag and latest output."""
        raise NotImplementedError

    @abstractmethod
    def _ensure_session(self, session_id: str | None) -> str:
        """Resolve session id for memory-aware implementations."""
        raise NotImplementedError

    def _cleanup(self) -> None:
        """Hook for optional resource cleanup after run."""
        return None


class ReActAgent(BaseAgent, ABC):
    """ReAct-style base agent with think/act split."""

    @abstractmethod
    def think(
        self,
        request: str,
        session_id: str,
        step_number: int,
    ) -> tuple[bool, str]:
        """Plan the next action or finish with a direct final answer."""
        raise NotImplementedError

    @abstractmethod
    def act(self, session_id: str) -> str:
        """Execute planned tool actions and return action summary."""
        raise NotImplementedError

    def step(self, request: str, session_id: str, step_number: int) -> tuple[bool, str]:
        """Run one ReAct cycle: think first, then optionally act."""
        should_act, reasoning_or_answer = self.think(
            request=request,
            session_id=session_id,
            step_number=step_number,
        )
        if not should_act:
            return False, reasoning_or_answer
        action_result = self.act(session_id=session_id)
        if self.state == AgentState.FINISHED:
            return False, action_result
        return True, action_result
