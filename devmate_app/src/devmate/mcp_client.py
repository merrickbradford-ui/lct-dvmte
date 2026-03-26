"""MCP client helpers using langchain-mcp-adapters."""

from __future__ import annotations

import asyncio
import logging

from langchain_core.tools import BaseTool
from langchain_mcp_adapters.client import MultiServerMCPClient

from devmate.config import load_config

logger = logging.getLogger(__name__)


async def load_mcp_tools() -> list[BaseTool]:
    """Connect to MCP server and return discovered tools."""
    config = load_config()
    client = MultiServerMCPClient(
        {
            "search": {
                "transport": "streamable_http",
                "url": config.mcp.server_url,
            }
        }
    )
    try:
        tools = await client.get_tools()
        logger.info("Loaded %d MCP tools from %s", len(tools), config.mcp.server_url)
        return tools
    except Exception:  # pragma: no cover
        logger.exception("Failed to load MCP tools.")
        return []


async def _run_test() -> None:
    """Run a minimal MCP smoke test by invoking `search_web`."""
    tools = await load_mcp_tools()
    tool_names = [tool.name for tool in tools]
    logger.info("MCP tools discovered: %s", tool_names)
    search_tool = next((tool for tool in tools if tool.name == "search_web"), None)
    if search_tool is None:
        logger.error("search_web tool not found from MCP server.")
        return

    result = await search_tool.ainvoke(
        {"query": "fastapi latest best practices", "max_results": 3}
    )
    logger.info("search_web test response length: %d", len(str(result)))


def main() -> None:
    """CLI entrypoint for MCP client smoke testing."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    )
    asyncio.run(_run_test())
