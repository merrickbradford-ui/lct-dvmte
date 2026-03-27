"""Runtime smoke test for DevMate web + MCP services."""

from __future__ import annotations

import json
import logging
import os
import socket
import subprocess
import time
import urllib.error
import urllib.request
from pathlib import Path

logger = logging.getLogger(__name__)
ROOT = Path(__file__).resolve().parents[1]
DEVMATE_APP_DIR = ROOT / "devmate_app"
MCP_SERVER_DIR = ROOT / "mcp_server"


def _wait_port(host: str, port: int, timeout_seconds: int = 25) -> bool:
    """Poll a TCP port until it becomes reachable or times out."""
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.settimeout(1)
            if sock.connect_ex((host, port)) == 0:
                return True
        time.sleep(0.5)
    return False


def _http_get(url: str) -> tuple[int, str]:
    """Call HTTP GET and return status code plus response body text."""
    with urllib.request.urlopen(url, timeout=15) as response:
        body = response.read().decode("utf-8", errors="replace")
        return int(response.status), body


def _http_post_json(
    url: str,
    payload: dict[str, object],
    timeout_seconds: int = 240,
) -> tuple[int, str]:
    """Call HTTP POST(JSON) and return status code plus response body text."""
    data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        url=url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
        body = response.read().decode("utf-8", errors="replace")
        return int(response.status), body


def _start_process(args: list[str], cwd: Path) -> subprocess.Popen[str]:
    """Start a subprocess with captured stdio under the provided cwd."""
    return subprocess.Popen(
        args,
        cwd=cwd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )


def _start_web_process(web_port: int) -> subprocess.Popen[str]:
    """Start web server process with an explicit deterministic port."""
    env = dict(os.environ)
    env["DEVMATE_WEB_PORT"] = str(web_port)
    return subprocess.Popen(
        ["uv", "run", "devmate-web"],
        cwd=DEVMATE_APP_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        env=env,
    )


def _tail_output(proc: subprocess.Popen[str], max_lines: int = 20) -> str:
    """Collect available process output for diagnostics."""
    if proc.stdout is None:
        return ""
    lines: list[str] = []
    while True:
        line = proc.stdout.readline()
        if not line:
            break
        lines.append(line.rstrip("\n"))
        if len(lines) >= max_lines:
            break
    return "\n".join(lines)


def main() -> int:
    """Run full smoke test and return process exit code."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    )

    web_port = 18080

    mcp_proc = _start_process(
        [
            "uv",
            "run",
            "devmate-mcp-server",
            "--host",
            "127.0.0.1",
            "--port",
            "9000",
            "--mount-path",
            "/mcp",
        ],
        cwd=MCP_SERVER_DIR,
    )

    web_proc = _start_web_process(web_port)

    try:
        if not _wait_port("127.0.0.1", 9000):
            logger.error("MCP server did not start on port 9000.")
            logger.error("MCP output:\n%s", _tail_output(mcp_proc))
            return 1

        if not _wait_port("127.0.0.1", web_port):
            logger.error("Web server did not start on port %d.", web_port)
            logger.error("Web output:\n%s", _tail_output(web_proc))
            return 1

        home_status, home_body = _http_get(f"http://127.0.0.1:{web_port}/")
        logger.info("GET / -> status=%d body_len=%d", home_status, len(home_body))

        chat_status, chat_body = _http_post_json(
            f"http://127.0.0.1:{web_port}/chat",
            {"message": "请给我一个最小 FastAPI 项目结构，并在完成时 terminate"},
        )
        logger.info("POST /chat -> status=%d body_len=%d", chat_status, len(chat_body))

        mcp_test = subprocess.run(
            ["uv", "run", "devmate-mcp-test"],
            cwd=DEVMATE_APP_DIR,
            text=True,
            capture_output=True,
            check=False,
        )
        logger.info("devmate-mcp-test exit=%d", mcp_test.returncode)
        logger.info("devmate-mcp-test output chars=%d", len(mcp_test.stdout))

        if home_status != 200 or chat_status != 200 or mcp_test.returncode != 0:
            logger.error("Smoke test failed.")
            logger.error("mcp_test stderr:\n%s", mcp_test.stderr)
            return 1

        logger.info("Smoke test passed.")
        return 0

    except (urllib.error.URLError, TimeoutError) as exc:
        logger.exception("HTTP smoke test failed: %s", exc)
        return 1
    finally:
        for proc in (web_proc, mcp_proc):
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()


if __name__ == "__main__":
    raise SystemExit(main())
