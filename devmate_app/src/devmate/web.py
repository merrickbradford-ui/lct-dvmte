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
from fastapi import FastAPI, Request, Response
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from langsmith import traceable as ls_traceable
from pydantic import BaseModel

from devmate.agent.deep_agent import DeepAgentRunner
from devmate.agent.devmate_agent import DevMateTemplateAgent
from devmate.config import load_config
from devmate.trace_export import main as export_trace_main

logger = logging.getLogger(__name__)
app = FastAPI(title="DevMate Web")


@app.middleware("http")
async def no_cache_for_generated(request: Request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/generated/"):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response


_config = load_config()
_workspace_dir = Path(_config.app.workspace_output_dir)
_workspace_dir.mkdir(parents=True, exist_ok=True)
app.mount("/generated", StaticFiles(directory=str(_workspace_dir)), name="generated")
_deep_agent: DeepAgentRunner | None = None
_legacy_agent: DevMateTemplateAgent | None = None
_session_events: dict[str, list[dict[str, Any]]] = defaultdict(list)
_preview_processes: dict[str, dict[str, Any]] = {}
_TEMPLATE_PATH = Path(__file__).with_name("web_template.html")


class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None
    mode: str | None = None


class ChatResponse(BaseModel):
    session_id: str
    state: str
    steps: int
    result: str
    trace_url: str | None = None


class PreviewResponse(BaseModel):
    project: str
    preview_url: str
    run_command: str


def _get_deep_agent() -> DeepAgentRunner:
    global _deep_agent
    if _deep_agent is None:
        _deep_agent = DeepAgentRunner()
    return _deep_agent


def _get_legacy_agent() -> DevMateTemplateAgent:
    global _legacy_agent
    if _legacy_agent is None:

        def handle_event(event: dict[str, Any]) -> None:
            session_id = str(event.get("session_id", "")).strip()
            if session_id:
                _session_events[session_id].append(event)

        _legacy_agent = DevMateTemplateAgent(event_handler=handle_event)
    return _legacy_agent


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
        if not item.is_dir() or item.name.startswith("."):
            continue
        project_type = "folder"
        preview_url = ""
        updated_at = item.stat().st_mtime
        if (item / "index.html").exists():
            project_type = "static"
            preview_url = f"/generated/{item.name}/index.html?v={int(updated_at)}"
        elif (item / "pyproject.toml").exists():
            project_type = "python"
        projects.append(
            {
                "name": item.name,
                "type": project_type,
                "preview_url": preview_url,
                "updated_at": str(updated_at),
            }
        )

    # Backward compatible: if generated files are at workspace root,
    # expose them as a previewable pseudo project.
    root_index = _workspace_dir / "index.html"
    if root_index.exists():
        projects.append(
            {
                "name": "__workspace__",
                "type": "static",
                "preview_url": f"/generated/index.html?v={int(root_index.stat().st_mtime)}",
                "updated_at": str(root_index.stat().st_mtime),
            }
        )

    projects.sort(key=lambda p: float(p.get("updated_at", "0")), reverse=True)
    return projects


def _write_trace_link(trace_url: str) -> None:
    output = Path(__file__).resolve().parents[3] / "LANGSMITH_TRACE_LINK.md"
    output.write_text(f"# Latest LangSmith Trace\n\n{trace_url}\n", encoding="utf-8")


def _read_trace_url_from_file() -> str | None:
    output = Path(__file__).resolve().parents[3] / "LANGSMITH_TRACE_LINK.md"
    if not output.exists():
        return None
    for raw in output.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if line.startswith("https://") or line.startswith("http://"):
            return line
    return None


@app.get("/favicon.ico")
def favicon() -> Response:
    return Response(status_code=204)


@app.get("/projects")
def list_projects() -> JSONResponse:
    return JSONResponse({"projects": _list_projects()})


@app.post("/preview/{project_name}", response_model=PreviewResponse)
def run_project_preview(project_name: str) -> PreviewResponse:
    if project_name == "__workspace__":
        index_file = _workspace_dir / "index.html"
        if not index_file.exists():
            raise ValueError("Workspace root preview not found")
        return PreviewResponse(
            project=project_name,
            preview_url=f"/generated/index.html?v={int(index_file.stat().st_mtime)}",
            run_command="static-preview",
        )

    project_dir = (_workspace_dir / project_name).resolve()
    if not project_dir.exists() or not project_dir.is_dir():
        raise ValueError(f"Project not found: {project_name}")

    if (project_dir / "index.html").exists():
        return PreviewResponse(
            project=project_name,
            preview_url=f"/generated/{project_name}/index.html?v={int((project_dir / 'index.html').stat().st_mtime)}",
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
@ls_traceable(name="chat", run_type="chain")
def chat(req: ChatRequest) -> ChatResponse:
    sid = req.session_id or uuid.uuid4().hex
    trace_url: str | None = None

    try:
        _session_events[sid].clear()
        mode = (req.mode or "deep").strip().lower()

        _session_events[sid].append(
            {
                "session_id": sid,
                "type": "run_started",
                "message": f"开始执行（mode={mode}）",
            }
        )

        if mode == "legacy":
            legacy_agent = _get_legacy_agent()
            run_result = legacy_agent.run(req.message, session_id=sid)
            result = ChatResponse(
                session_id=run_result.session_id,
                state=run_result.state.value,
                steps=run_result.steps,
                result=run_result.final_answer,
                trace_url=None,
            )
        else:
            _session_events[sid].append(
                {
                    "session_id": sid,
                    "type": "thinking",
                    "message": "DeepAgents 正在分析需求与规划步骤...",
                }
            )
            deep_agent = _get_deep_agent()
            _session_events[sid].append(
                {
                    "session_id": sid,
                    "type": "tool_plan",
                    "message": "DeepAgents 可能调用内置文件系统工具与自定义工具。",
                }
            )
            result_text = deep_agent.run(req.message, session_id=sid)
            _session_events[sid].append(
                {
                    "session_id": sid,
                    "type": "run_finished",
                    "message": "执行完成，正在同步 Trace 链接。",
                }
            )
            result = ChatResponse(
                session_id=sid,
                state="FINISHED",
                steps=1,
                result=result_text,
                trace_url=None,
            )

        # Keep trace export non-blocking for chat success.
        export_trace_main()
        trace_url = _read_trace_url_from_file()
        result.trace_url = trace_url
        return result
    except Exception as exc:  # pragma: no cover
        logger.exception("Chat request failed")
        return ChatResponse(
            session_id=sid,
            state="ERROR",
            steps=0,
            result=f"Error: {exc}",
            trace_url=trace_url,
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
