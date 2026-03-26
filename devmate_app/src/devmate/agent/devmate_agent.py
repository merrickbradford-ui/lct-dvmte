"""Stateful ReAct-style DevMate agent implementation."""

from __future__ import annotations

import asyncio
import json
import logging
from collections.abc import Callable
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage
from langchain_core.tools import BaseTool, tool

from devmate.agent.base import ReActAgent
from devmate.agent.memory import ConversationMemoryStore
from devmate.agent.model import AgentState
from devmate.config import load_config
from devmate.mcp_client import load_mcp_tools
from devmate.models import configure_langsmith, create_chat_model
from devmate.rag import RagService, build_rag_tool
from devmate.skills import SkillStore, build_skill_tools
from devmate.tools import build_file_tools

logger = logging.getLogger(__name__)


SYSTEM_PROMPT = """You are DevMate, an autonomous AI web development agent.

Your primary job is to understand the user's product intent, build or improve a runnable website project, and present results that the user can preview, test, and iterate on.

Operating principles:
- Decide autonomously whether you need local knowledge retrieval, web search, skills, or direct coding. Do not follow a fixed tool order.
- Prefer the simplest architecture that can satisfy the request and run successfully.
- Keep changes minimal when modifying an existing project. Do not rewrite working parts without a clear reason.
- When requirements are incomplete, make practical product and implementation decisions that keep the project coherent and runnable.

Web development focus:
- You are primarily a web developer. Most requests should result in a website or web application the user can preview.
- Unless the user explicitly asks for a single-file prototype, generate a complete project structure with the files needed to run, preview, and maintain the solution.
- Use FastAPI or a Python web backend only when the request needs server-side behavior such as APIs, dynamic processing, persistence, authentication, or Python-based integrations.
- If a static site is sufficient, you may generate a simpler multi-file HTML/CSS/JavaScript project instead of adding unnecessary backend complexity.
- Always favor runnable output over over-engineered architecture.

Tool guidance:
- Use `search_knowledge_base` when internal guidelines, templates, hidden requirements, or repository conventions are likely relevant.
- Use `search_web` when you need up-to-date documentation, APIs, versions, or implementation best practices.
- Use `search_skills` and `load_skill` when a previously successful task pattern appears relevant.
- Use `create_python_uv_project_scaffold` only when a Python project is actually needed.
- Use `create_project_file` to create or update full file contents.
- Use `save_skill` only after you have completed a task with a reusable pattern.
- Use `terminate` only when the requested work is actually complete.

Quality rules:
- Generated Python projects must target Python 3.13, use `uv`, and manage dependencies with `pyproject.toml`.
- Follow PEP 8 strictly.
- Never use standard output calls in Python code; use `logging` instead.
- Keep file structure clear and implementation maintainable.
- Include concise run instructions when generating a new runnable project.
- If internal knowledge base context is relevant, reflect it in the generated solution.
- If web search results are relevant, use them to improve correctness without blindly copying them.
- If a skill is loaded, adapt it to the current request instead of applying it mechanically.

Final answer rules:
- Respond to the user in clear Chinese.
- Summarize what you built or changed.
- Mention important generated files or outputs when relevant.
"""


class DevMateTemplateAgent(ReActAgent):
    """ReAct agent with explicit think/act loop and multi-turn memory."""

    def __init__(
        self,
        *,
        max_steps: int = 20,
        memory_store: ConversationMemoryStore | None = None,
        event_handler: Callable[[dict[str, Any]], None] | None = None,
    ) -> None:
        """Initialize models, memory, tools, and runtime state."""
        super().__init__(max_steps=max_steps)
        self.config = load_config()
        self.memory = memory_store or ConversationMemoryStore()
        self.rag = RagService()
        self.skill_store = SkillStore()
        self.llm = create_chat_model(self.config)
        configure_langsmith(self.config)

        self._event_handler = event_handler
        self._tools: list[BaseTool] = []
        self._tool_map: dict[str, BaseTool] = {}
        self._model_with_tools = None
        self._pending_tool_calls: dict[str, list[dict[str, Any]]] = {}
        self._completed_tools: dict[str, set[str]] = {}

        self._initialize_tools()

    def _emit_event(self, event_type: str, message: str, **payload: Any) -> None:
        """Forward runtime events to an external observer when configured."""
        if self._event_handler is None:
            return
        event = {"type": event_type, "message": message, **payload}
        self._event_handler(event)

    def _initialize_tools(self) -> None:
        """Load local tools and MCP tools, then bind them to the chat model."""
        rag_tool = build_rag_tool(self.rag)
        skill_tools = build_skill_tools(self.skill_store)
        file_tools = build_file_tools()
        mcp_tools = asyncio.run(load_mcp_tools())

        @tool("terminate")
        def terminate() -> str:
            """Call this when ALL requested work is complete and files are written."""
            return "Task completed successfully."

        all_tools = [rag_tool, *skill_tools, *file_tools, *mcp_tools, terminate]
        self._tools = all_tools
        self._tool_map = {tool_item.name: tool_item for tool_item in self._tools}
        self._model_with_tools = self.llm.bind_tools(self._tools)
        logger.info("Agent initialized with %d tools.", len(self._tools))
        self._emit_event(
            "agent_ready",
            "Agent initialized and tools loaded.",
            tool_count=len(self._tools),
        )

    def _ensure_session(self, session_id: str | None) -> str:
        """Ensure a valid memory session id exists for this run."""
        resolved_session_id = self.memory.ensure_session(session_id)
        self._completed_tools.setdefault(resolved_session_id, set())
        return resolved_session_id

    def _get_rag_context(self, request: str) -> str:
        """Retrieve request-relevant local knowledge for prompt augmentation."""
        try:
            context = self.rag.search(query=request)
        except Exception as exc:
            logger.exception("RAG retrieval failed.")
            self._emit_event(
                "rag_error",
                f"Knowledge retrieval failed: {exc}",
            )
            return ""

        if context.startswith("No relevant knowledge base context found"):
            return ""
        return context.strip()

    def _build_messages(
        self,
        *,
        request: str,
        history: list[Any],
        rag_context: str,
        skill_context: str,
    ) -> list[Any]:
        """Build model messages with explicit retrieved-context injection."""
        messages: list[Any] = [SystemMessage(content=SYSTEM_PROMPT)]
        if rag_context:
            messages.append(
                SystemMessage(
                    content=(
                        "Relevant local knowledge base context retrieved for this "
                        "request. Use it when applicable:\n\n"
                        f"{rag_context}"
                    )
                )
            )
        if skill_context:
            messages.append(
                SystemMessage(
                    content=(
                        "Relevant reusable skill guidance was found for this request. "
                        "Adapt it to the current task instead of following it "
                        "mechanically:\n\n"
                        f"{skill_context}"
                    )
                )
            )
        messages.extend(history)
        return messages

    def think(
        self,
        request: str,
        session_id: str,
        step_number: int,
    ) -> tuple[bool, str]:
        """Plan next step by invoking the model with prompt + history."""
        history = self.memory.get(session_id)

        if step_number == 1:
            history.append(HumanMessage(content=request))
            self.memory.append(session_id, HumanMessage(content=request))

        self._emit_event(
            "thinking",
            f"Analyzing request at step {step_number}.",
            session_id=session_id,
            step=step_number,
        )
        rag_context = self._get_rag_context(request)
        skill_context = self.skill_store.get_relevant_skill_context(request)
        if skill_context.startswith("No reusable skill found"):
            skill_context = ""
        if rag_context and step_number == 1:
            self._emit_event(
                "rag_context_loaded",
                "Loaded relevant knowledge base context for prompt augmentation.",
                session_id=session_id,
                step=step_number,
                context_preview=rag_context[:800],
            )
        if skill_context and step_number == 1:
            self._emit_event(
                "skill_context_loaded",
                "Loaded relevant reusable skill context for prompt augmentation.",
                session_id=session_id,
                step=step_number,
                context_preview=skill_context[:800],
            )
        messages = self._build_messages(
            request=request,
            history=history,
            rag_context=rag_context if step_number == 1 else "",
            skill_context=skill_context if step_number == 1 else "",
        )
        ai_message = self._model_with_tools.invoke(messages)
        self.memory.append(session_id, ai_message)

        tool_calls = getattr(ai_message, "tool_calls", []) or []
        if not tool_calls:
            text = str(ai_message.content or "Task completed.")
            self._emit_event(
                "final_answer",
                "Model returned a direct answer.",
                session_id=session_id,
                step=step_number,
                content=text,
            )
            return False, text

        self._pending_tool_calls[session_id] = tool_calls
        tool_names = [call.get("name", "unknown") for call in tool_calls]
        summary = ", ".join(tool_names)
        logger.info("Step %d planned tools: %s", step_number, summary)
        self._emit_event(
            "tool_plan",
            f"Planned tools: {summary}",
            session_id=session_id,
            step=step_number,
            tools=tool_names,
        )
        return True, f"Planned: {summary}"

    def _finalize_response(self, session_id: str) -> str:
        """Ask the model for a final user-facing answer after tools complete."""
        history = self.memory.get(session_id)
        final_prompt = HumanMessage(
            content=(
                "All required tool work is complete. "
                "Now provide the final user-facing answer in clear Chinese. "
                "Summarize what you completed, mention key outputs or files "
                "when relevant, and do not call any tools."
            )
        )
        messages = [SystemMessage(content=SYSTEM_PROMPT), *history, final_prompt]
        final_message = self.llm.invoke(messages)
        self.memory.append(session_id, final_message)
        return str(final_message.content or "Task completed.")

    def act(self, session_id: str) -> str:
        """Execute model-planned tool calls and append outputs to memory."""
        tool_calls = self._pending_tool_calls.pop(session_id, [])
        if not tool_calls:
            return "No tool calls to execute."

        terminated = False
        outputs: list[str] = []

        for call in tool_calls:
            name = str(call.get("name", ""))
            tool_obj = self._tool_map.get(name)
            args = call.get("args", {}) or {}
            call_id = str(call.get("id", ""))

            self._emit_event(
                "tool_started",
                f"Running tool `{name}`.",
                session_id=session_id,
                tool_name=name,
                tool_args=json.dumps(args, ensure_ascii=False),
            )

            if tool_obj is None:
                result = f"Tool '{name}' not found."
            else:
                try:
                    result = str(tool_obj.invoke(args))
                except NotImplementedError:
                    result = str(asyncio.run(tool_obj.ainvoke(args)))
                except Exception as exc:
                    logger.exception("Tool '%s' execution failed.", name)
                    result = f"Tool '{name}' failed: {exc}"

            logger.info("Tool '%s' result length: %d", name, len(result))
            self._completed_tools.setdefault(session_id, set()).add(name)
            outputs.append(f"{name}: {result}")
            self.memory.append(
                session_id,
                ToolMessage(content=result, tool_call_id=call_id),
            )
            self._emit_event(
                "tool_finished",
                f"Finished tool `{name}`.",
                session_id=session_id,
                tool_name=name,
                result_preview=result[:800],
            )

            if name == "terminate":
                terminated = True

        if terminated:
            self.state = AgentState.FINISHED
            final_answer = self._finalize_response(session_id)
            self._emit_event(
                "final_answer",
                "Generated final response after tool execution.",
                session_id=session_id,
                content=final_answer,
            )
            return final_answer

        return "\n".join(outputs)
