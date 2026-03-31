"""Export latest LangSmith run share link."""

from __future__ import annotations

import logging
from pathlib import Path

from langsmith import Client

from devmate.config import load_config

logger = logging.getLogger(__name__)


def main() -> None:
    """Export latest LangSmith run as a share link markdown file."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    )
    config = load_config()
    if not config.langsmith.langchain_api_key:
        logger.error("LangSmith API key is missing.")
        return

    client = Client(api_key=config.langsmith.langchain_api_key)
    runs = list(
        client.list_runs(
            project_name=config.langsmith.langchain_project,
            limit=1,
            is_root=True,
        )
    )
    if not runs:
        logger.warning(
            "No runs found for project '%s'", config.langsmith.langchain_project
        )
        return

    run = runs[0]
    output = Path(__file__).resolve().parents[3] / "LANGSMITH_TRACE_LINK.md"

    share_url = None
    try:
        share_url = client.read_run_shared_link(run.id)
    except Exception:  # pragma: no cover
        logger.exception("Failed to read run shared link.")

    if not share_url:
        try:
            share_url = client.share_run(run.id)
        except Exception:  # pragma: no cover
            logger.exception("Failed to share LangSmith run.")
            return

    output.write_text(
        f"# Latest LangSmith Trace\n\n{share_url}\n", encoding="utf-8"
    )
    logger.info("Trace link exported to %s", output)
