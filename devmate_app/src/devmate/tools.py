"""File generation tools used by the agent."""

from __future__ import annotations

import logging
import os
import re
from pathlib import Path
from textwrap import dedent
from typing import Any

from langchain_core.tools import tool

from devmate.config import load_config

logger = logging.getLogger(__name__)


def _resolve_path(relative_path: str) -> Path:
    """Resolve user path safely under workspace_output (path traversal guard)."""
    config = load_config()
    base = Path(config.app.workspace_output_dir).resolve()
    base.mkdir(parents=True, exist_ok=True)

    sanitized = relative_path.replace("\\", "/").strip()
    sanitized = re.sub(r"^[A-Za-z]:/+", "", sanitized)
    sanitized = sanitized.removeprefix("/app/")
    sanitized = sanitized.removeprefix("app/")
    sanitized = sanitized.lstrip("/")
    sanitized = sanitized.lstrip("./")
    workspace_marker = "workspace_output/"
    if workspace_marker in sanitized:
        sanitized = sanitized.split(workspace_marker, maxsplit=1)[1]

    candidate = Path(sanitized)
    if candidate.is_absolute():
        candidate = Path(*candidate.parts[1:])

    target = (base / candidate).resolve()
    base_norm = os.path.normcase(str(base))
    target_norm = os.path.normcase(str(target))
    if not target_norm.startswith(base_norm):
        logger.warning(
            "Remapping out-of-root path '%s' into workspace_output.",
            relative_path,
        )
        safe_name = candidate.name or "generated_project"
        target = (base / safe_name).resolve()
    return target


def build_file_tools() -> list[Any]:
    """Build file/directory/scaffold tools used by the coding agent."""

    def _write_if_missing(path: Path, content: str) -> None:
        """Create file with content only when target file does not exist."""
        if not path.exists():
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding="utf-8")

    @tool("create_project_directory")
    def create_project_directory(path: str) -> str:
        """Create a directory inside workspace output."""
        target = _resolve_path(path)
        target.mkdir(parents=True, exist_ok=True)
        logger.info("Created directory: %s", target)
        return f"Created directory: {target}"

    @tool("create_project_file")
    def create_project_file(path: str, content: str) -> str:
        """Create or overwrite a file inside workspace output."""
        target = _resolve_path(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")
        logger.info("Created file: %s", target)
        return f"Created file: {target}"

    @tool("create_python_uv_project_scaffold")
    def create_python_uv_project_scaffold(
        project_root: str,
        project_name: str = "generated_app",
        app_package: str = "app",
    ) -> str:
        """Create a minimal runnable Python 3.13 + uv FastAPI project scaffold."""
        root = _resolve_path(project_root)
        app_dir = root / app_package
        routers_dir = app_dir / "routers"
        services_dir = app_dir / "services"

        root.mkdir(parents=True, exist_ok=True)
        app_dir.mkdir(parents=True, exist_ok=True)
        routers_dir.mkdir(parents=True, exist_ok=True)
        services_dir.mkdir(parents=True, exist_ok=True)

        normalized_name = project_name.strip().lower().replace(" ", "-")
        pyproject = dedent(
            f"""
            [project]
            name = "{normalized_name}"
            version = "0.1.0"
            description = "Generated FastAPI project by DevMate"
            readme = "README.md"
            requires-python = ">=3.13"
            dependencies = [
              "fastapi>=0.115.0",
              "uvicorn>=0.30.0",
              "pydantic>=2.8.0"
            ]

            [build-system]
            requires = ["hatchling"]
            build-backend = "hatchling.build"
            """
        ).strip() + "\n"

        readme = dedent(
            f"""
            # {project_name}

            ## Run

            1. Install dependencies:

               uv sync

            2. Start server:

                    uv run uvicorn {app_package}.main:app --reload \
                      --host 127.0.0.1 --port 8000
            """
        ).strip() + "\n"

        _write_if_missing(root / "pyproject.toml", pyproject)
        _write_if_missing(root / "README.md", readme)
        _write_if_missing(app_dir / "__init__.py", "")
        _write_if_missing(routers_dir / "__init__.py", "")
        _write_if_missing(services_dir / "__init__.py", "")

        logger.info("Created Python uv scaffold at: %s", root)
        return f"Created Python uv scaffold at: {root}"

    return [
        create_project_directory,
        create_project_file,
        create_python_uv_project_scaffold,
    ]
