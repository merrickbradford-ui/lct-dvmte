"""Standalone MCP server for Tavily-backed web search."""

from __future__ import annotations

import argparse
import logging
import os
import tomllib
from pathlib import Path

from mcp.server.fastmcp import FastMCP
from tavily import TavilyClient

logger = logging.getLogger(__name__)


def _load_tavily_key(config_path: Path) -> str:
    """Read Tavily API key from config file, fallback to environment variable."""
    if config_path.exists():
        with config_path.open("rb") as file:
            config = tomllib.load(file)
        return str(config.get("search", {}).get("tavily_api_key", "")).strip()
    return os.getenv("TAVILY_API_KEY", "").strip()


def create_server(config_path: Path, host: str, port: int, mount_path: str) -> FastMCP:
    """Create configured FastMCP server and register Tavily-backed tool."""
    tavily_key = _load_tavily_key(config_path)
    server = FastMCP(
        name="DevMate-MCP-Server",
        host=host,
        port=port,
        streamable_http_path=mount_path,
        dependencies=["tavily-python>=0.7.11"],
    )

    @server.tool()
    def search_web(query: str, max_results: int = 5) -> str:
        """Search the web via Tavily and return merged textual snippets."""
        if not tavily_key or "placeholder" in tavily_key.lower():
            logger.error("Missing Tavily API key in config/env.")
            return "Error: Tavily API key is missing."

        try:
            client = TavilyClient(api_key=tavily_key)
            response = client.search(query=query, max_results=max_results)
            snippets = [
                item.get("content", "")
                for item in response.get("results", [])
                if item.get("content")
            ]
            if not snippets:
                return "No relevant web results were returned by Tavily."
            return "\n\n".join(snippets)
        except Exception as exc:  # pragma: no cover
            logger.exception("Tavily search failed.")
            return f"Error executing web search: {exc}"

    return server


def parse_args() -> argparse.Namespace:
    """Parse MCP server command-line options."""
    parser = argparse.ArgumentParser(description="Run DevMate MCP server")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=9000)
    parser.add_argument("--mount-path", default="/mcp")
    parser.add_argument(
        "--config",
        default=str(Path(__file__).resolve().parents[3] / "config.toml"),
    )
    return parser.parse_args()


def main() -> None:
    """Entrypoint that starts the Streamable HTTP MCP server."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    )
    args = parse_args()
    server = create_server(
        config_path=Path(args.config),
        host=args.host,
        port=args.port,
        mount_path=args.mount_path,
    )
    logger.info(
        "Starting MCP server on %s:%s%s using Streamable HTTP",
        args.host,
        args.port,
        args.mount_path,
    )
    server.run(transport="streamable-http", mount_path=args.mount_path)


if __name__ == "__main__":
    main()
