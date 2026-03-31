"""CLI entrypoint for DevMate app."""

from __future__ import annotations

import logging

from devmate.agent.deep_agent import DeepAgentRunner

logger = logging.getLogger(__name__)


def main() -> None:
    """Run one sample agent task from CLI for quick validation."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    )
    agent = DeepAgentRunner()
    prompt = "我想构建一个展示附近徒步路线的网站项目。"
    result = agent.run(prompt, session_id="cli-session")
    logger.info("Agent finished. response_chars=%d", len(result))
