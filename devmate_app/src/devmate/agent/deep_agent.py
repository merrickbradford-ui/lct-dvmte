"""DeepAgents-based agent implementation for DevMate."""

from __future__ import annotations

import asyncio
import logging
import shutil
from pathlib import Path

from deepagents import create_deep_agent
from deepagents.backends.filesystem import FilesystemBackend
from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI

from devmate.config import load_config
from devmate.mcp_client import load_mcp_tools
from devmate.models import configure_langsmith
from devmate.rag import RagService, build_rag_tool

logger = logging.getLogger(__name__)


class DeepAgentRunner:
    """Thin wrapper around DeepAgents create_deep_agent for DevMate."""

    def __init__(self) -> None:
        """Initialize models, backend, skills, and compiled agent graph."""
        self.config = load_config()
        configure_langsmith(self.config)

        workspace = Path(self.config.app.workspace_output_dir)
        workspace.mkdir(parents=True, exist_ok=True)
        self._workspace = workspace

        # FilesystemBackend scoped to workspace output directory.
        self._backend = FilesystemBackend(
            root_dir=str(workspace),
            virtual_mode=True,
        )

        # DeepAgents SkillsMiddleware reads skills via the configured backend.
        # Because backend root is workspace_output, sync configured skills into:
        # workspace_output/.skills/**/SKILL.md and point skills source there.
        self._skills_sources = ["/.skills/"]
        self._sync_skills_into_workspace()

        # Build custom tools (DeepAgents built-in filesystem tools are injected
        # automatically by FilesystemMiddleware).
        rag_service = RagService()
        rag_tool = build_rag_tool(rag_service)
        mcp_tools = asyncio.run(load_mcp_tools())
        self._custom_tools = [rag_tool, *mcp_tools]

        # LLM using ChatOpenAI with configured model
        self._model = ChatOpenAI(
            model=self.config.model.model_name,
            api_key=self.config.model.api_key,
            base_url=self.config.model.ai_base_url,
            temperature=self.config.model.temperature,
        )

        # Compile DeepAgents graph (use framework base system prompt only
        # to keep a single system-prompt layer visible in trace).
        self._agent = create_deep_agent(
            model=self._model,
            tools=self._custom_tools,
            skills=self._skills_sources,
            backend=self._backend,
            name="devmate-deep-agent",
        )
        logger.info(
            "DeepAgentRunner initialized with %d custom tools and skills from %s.",
            len(self._custom_tools),
            self._skills_sources,
        )

    def _sync_skills_into_workspace(self) -> None:
        """Copy configured SKILL.md directories into workspace_output/.skills/."""
        source_candidates = [
            Path(self.config.skills.skills_dir),
            Path(__file__).resolve().parents[3] / "devmate_app" / ".skills",
        ]
        target_root = self._workspace / ".skills"
        target_root.mkdir(parents=True, exist_ok=True)

        copied_count = 0
        for source_root in source_candidates:
            if not source_root.exists() or not source_root.is_dir():
                continue

            for skill_file in source_root.rglob("SKILL.md"):
                try:
                    rel_dir = skill_file.parent.relative_to(source_root)
                except ValueError:
                    continue

                dest_dir = target_root / rel_dir
                dest_dir.mkdir(parents=True, exist_ok=True)
                dest_file = dest_dir / "SKILL.md"
                shutil.copy2(skill_file, dest_file)
                copied_count += 1

        logger.info(
            "Synced %d SKILL.md files into %s for DeepAgents SkillsMiddleware.",
            copied_count,
            target_root,
        )

    def run(self, message: str, session_id: str) -> str:
        """Invoke the DeepAgents graph and return the final text response."""
        config = {"configurable": {"thread_id": session_id}}
        result = self._agent.invoke(
            {"messages": [HumanMessage(content=message)]},
            config=config,
        )
        messages = result.get("messages", [])
        for msg in reversed(messages):
            content = getattr(msg, "content", "")
            if content and isinstance(content, str):
                return content
        return "Task completed."
