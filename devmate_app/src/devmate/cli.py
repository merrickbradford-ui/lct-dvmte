"""CLI entrypoint for DevMate app."""

from __future__ import annotations

import logging

from devmate.agent.devmate_agent import DevMateTemplateAgent

logger = logging.getLogger(__name__)


def main() -> None:
    """Run one sample agent task from CLI for quick validation."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    )
    agent = DevMateTemplateAgent()
    prompt = "我想构建一个展示附近徒步路线的网站项目。"
    result = agent.run(prompt)
    logger.info(
        "Agent finished. state=%s steps=%d response_chars=%d",
        result.state.value,
        result.steps,
        len(result.final_answer),
    )
