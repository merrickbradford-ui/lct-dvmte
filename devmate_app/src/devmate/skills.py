"""Simple skill persistence and reuse tools."""

from __future__ import annotations

import json
import logging
import re
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

from langchain_core.tools import tool

from devmate.config import load_config

logger = logging.getLogger(__name__)


@dataclass(slots=True)
class SkillRecord:
    title: str
    trigger: str
    pattern: str


class SkillStore:
    """Persistent skill registry backed by local files under `.skills`."""

    def __init__(self) -> None:
        """Initialize skill storage location from config."""
        self.config = load_config()
        self.skills_dir = Path(self.config.skills.skills_dir)
        self.skills_dir.mkdir(parents=True, exist_ok=True)
        self.file_path = self.skills_dir / "skills.json"

    def _load(self) -> list[SkillRecord]:
        """Load all saved skills from JSON storage and SKILL.md folders."""
        records: list[SkillRecord] = []
        if self.file_path.exists():
            data = json.loads(self.file_path.read_text(encoding="utf-8"))
            for item in data:
                title = str(item.get("title", "untitled-skill"))
                trigger = str(item.get("trigger", ""))
                pattern = str(item.get("pattern", item.get("recipe", "")))
                records.append(
                    SkillRecord(title=title, trigger=trigger, pattern=pattern)
                )

        records.extend(self._load_directory_skills())
        return records

    def _load_directory_skills(self) -> list[SkillRecord]:
        """Load directory-based skills from `.skills/**/SKILL.md`."""
        records: list[SkillRecord] = []
        for path in self.skills_dir.rglob("SKILL.md"):
            try:
                content = path.read_text(encoding="utf-8").strip()
            except OSError:
                logger.exception("Failed to read skill file: %s", path)
                continue
            if not content:
                continue

            title = path.parent.name
            trigger = self._infer_trigger(title=title, content=content)
            records.append(
                SkillRecord(title=title, trigger=trigger, pattern=content)
            )
        return records

    def _infer_trigger(self, *, title: str, content: str) -> str:
        """Infer a lightweight trigger from SKILL.md content."""
        lines = [line.strip() for line in content.splitlines() if line.strip()]
        for line in lines[:12]:
            lowered = line.lower()
            if lowered.startswith("when to use") or lowered.startswith("trigger"):
                _, _, value = line.partition(":")
                if value.strip():
                    return value.strip()

        words = re.findall(r"[A-Za-z0-9\u4e00-\u9fff_-]+", f"{title} {content[:160]}")
        return " ".join(words[:12])

    def _save(self, records: list[SkillRecord]) -> None:
        """Persist JSON-backed skill records to disk in UTF-8 format."""
        self.file_path.write_text(
            json.dumps(
                [asdict(item) for item in records],
                ensure_ascii=False,
                indent=2,
            ),
            encoding="utf-8",
        )

    def _format_skill(self, record: SkillRecord) -> str:
        """Render one skill as specialized prompt/context text."""
        return "\n".join(
            [
                f"Skill: {record.title}",
                f"When to use: {record.trigger or 'Use when relevant.'}",
                "Specialized guidance:",
                record.pattern,
            ]
        )

    def get_relevant_skill_context(self, query: str) -> str:
        """Return top matching skill context for direct prompt injection."""
        return self.search(query)

    def search(self, query: str) -> str:
        """Return top matching reusable skills for the given query."""
        normalized_query = query.lower().strip()
        records = self._load()
        hits = [
            record
            for record in records
            if normalized_query
            and normalized_query in (
                record.trigger + record.title + record.pattern
            ).lower()
        ]
        if not hits:
            return "No reusable skill found."
        selected = hits[: self.config.skills.top_k]
        return "\n\n".join(self._format_skill(item) for item in selected)

    def load_skill(self, skill_name: str) -> str:
        """Load one named skill as specialized prompt/context."""
        normalized = skill_name.strip().lower()
        for record in self._load():
            if normalized in {record.title.lower(), record.trigger.lower()}:
                return self._format_skill(record)
        return f"Skill '{skill_name}' not found."

    def save(self, title: str, trigger: str, pattern: str) -> str:
        """Append a new reusable skill pattern and persist it."""
        records = [
            record
            for record in self._load()
            if not (
                record.title == title
                and record.trigger == trigger
                and record.pattern == pattern
            )
        ]
        records.append(SkillRecord(title=title, trigger=trigger, pattern=pattern))
        self._save(records)
        logger.info("Saved skill '%s'", title)
        return "Skill saved."


def build_skill_tools(store: SkillStore) -> list[Any]:
    """Expose skill search/save capabilities as agent tools."""

    @tool("search_skills")
    def search_skills(query: str) -> str:
        """Search previously saved skills that may help with similar requests."""
        return store.search(query)

    @tool("load_skill")
    def load_skill(skill_name: str) -> str:
        """Load a specialized skill prompt and context by skill name."""
        return store.load_skill(skill_name)

    @tool("save_skill")
    def save_skill(title: str, trigger: str, pattern: str) -> str:
        """Save successful reusable task pattern as a skill."""
        return store.save(title=title, trigger=trigger, pattern=pattern)

    return [search_skills, load_skill, save_skill]
