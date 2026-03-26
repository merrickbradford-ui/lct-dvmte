"""Stable minimal FastAPI web UI for DevMate."""

from __future__ import annotations

import logging
import os
import socket
import subprocess
import uuid
from collections import defaultdict
from pathlib import Path
from typing import Any

import uvicorn
from fastapi import FastAPI, Response
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from devmate.agent.devmate_agent import DevMateTemplateAgent
from devmate.config import load_config
from devmate.trace_export import main as export_trace_main

logger = logging.getLogger(__name__)
app = FastAPI(title="DevMate Web")
_config = load_config()
_workspace_dir = Path(_config.app.workspace_output_dir)
_workspace_dir.mkdir(parents=True, exist_ok=True)
app.mount("/generated", StaticFiles(directory=str(_workspace_dir)), name="generated")
_agent: DevMateTemplateAgent | None = None
_session_events: dict[str, list[dict[str, Any]]] = defaultdict(list)
_preview_processes: dict[str, dict[str, Any]] = {}
_TEMPLATE_PATH = Path(__file__).with_name("web_template.html")


class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None


class ChatResponse(BaseModel):
    session_id: str
    state: str
    steps: int
    result: str


class PreviewResponse(BaseModel):
    project: str
    preview_url: str
    run_command: str


def _get_agent() -> DevMateTemplateAgent:
    global _agent
    if _agent is None:

        def handle_event(event: dict[str, Any]) -> None:
            session_id = str(event.get("session_id", "")).strip()
            if session_id:
                _session_events[session_id].append(event)

        _agent = DevMateTemplateAgent(event_handler=handle_event)
    return _agent


def _is_port_open(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        return sock.connect_ex(("127.0.0.1", port)) == 0


def _next_free_port(start: int = 8500) -> int:
    port = start
    while _is_port_open(port):
        port += 1
    return port


def _list_projects() -> list[dict[str, str]]:
    projects: list[dict[str, str]] = []
    items = sorted(
        _workspace_dir.iterdir(),
        key=lambda path: path.stat().st_mtime,
        reverse=True,
    )
    for item in items:
        if not item.is_dir():
            continue
        project_type = "folder"
        preview_url = ""
        if (item / "index.html").exists():
            project_type = "static"
            preview_url = f"/generated/{item.name}/index.html"
        elif (item / "pyproject.toml").exists():
            project_type = "python"
        updated_at = item.stat().st_mtime
        projects.append(
            {
                "name": item.name,
                "type": project_type,
                "preview_url": preview_url,
                "updated_at": str(updated_at),
            }
        )
    return projects


@app.get("/favicon.ico")
def favicon() -> Response:
    return Response(status_code=204)


@app.get("/projects")
def list_projects() -> JSONResponse:
    return JSONResponse({"projects": _list_projects()})


@app.post("/preview/{project_name}", response_model=PreviewResponse)
def run_project_preview(project_name: str) -> PreviewResponse:
    project_dir = (_workspace_dir / project_name).resolve()
    if not project_dir.exists() or not project_dir.is_dir():
        raise ValueError(f"Project not found: {project_name}")

    if (project_dir / "index.html").exists():
        return PreviewResponse(
            project=project_name,
            preview_url=f"/generated/{project_name}/index.html",
            run_command="static-preview",
        )

    if project_name in _preview_processes:
        info = _preview_processes[project_name]
        return PreviewResponse(
            project=project_name,
            preview_url=info["preview_url"],
            run_command=info["run_command"],
        )

    port = _next_free_port()
    command = [
        "uv",
        "run",
        "uvicorn",
        "app.main:app",
        "--host",
        "127.0.0.1",
        "--port",
        str(port),
    ]
    process = subprocess.Popen(
        command,
        cwd=str(project_dir),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        shell=False,
    )
    preview_url = f"http://127.0.0.1:{port}"
    _preview_processes[project_name] = {
        "process": process,
        "preview_url": preview_url,
        "run_command": " ".join(command),
    }
    return PreviewResponse(
        project=project_name,
        preview_url=preview_url,
        run_command=" ".join(command),
    )


@app.post("/trace/export")
def export_trace() -> JSONResponse:
    export_trace_main()
    output = Path(__file__).resolve().parents[3] / "LANGSMITH_TRACE_LINK.md"
    content = output.read_text(encoding="utf-8") if output.exists() else ""
    return JSONResponse(
        {
            "path": str(output),
            "exists": output.exists(),
            "content": content,
        }
    )


@app.get("/events/{session_id}")
def get_events(session_id: str) -> JSONResponse:
    return JSONResponse({"events": _session_events.get(session_id, [])})


@app.get("/", response_class=HTMLResponse)
def index() -> str:
    return _get_html()


def _get_html() -> str:
    return _TEMPLATE_PATH.read_text(encoding="utf-8")


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest) -> ChatResponse:
    try:
        sid = req.session_id or uuid.uuid4().hex
        _session_events[sid].clear()
        run_result = _get_agent().run(req.message, session_id=sid)
        return ChatResponse(
            session_id=run_result.session_id,
            state=run_result.state.value,
            steps=run_result.steps,
            result=run_result.final_answer,
        )
    except Exception as exc:  # pragma: no cover
        logger.exception("Chat request failed")
        return ChatResponse(
            session_id=req.session_id or "",
            state="ERROR",
            steps=0,
            result=f"Error: {exc}",
        )


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    )
    port = int(os.getenv("DEVMATE_WEB_PORT", str(_config.app.port)))
    host = os.getenv("DEVMATE_WEB_HOST", _config.app.host)
    uvicorn.run(app, host=host, port=port)


if __name__ == "__main__":
    main()
