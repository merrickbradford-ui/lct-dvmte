"""Configuration loading for DevMate app."""

from __future__ import annotations

import os
import tomllib
from dataclasses import dataclass
from pathlib import Path


@dataclass(slots=True)
class ModelConfig:
    ai_base_url: str
    api_key: str
    model_name: str
    embedding_model_name: str
    embedding_base_url: str
    embedding_api_key: str
    temperature: float = 0.1


@dataclass(slots=True)
class SearchConfig:
    tavily_api_key: str
    max_results: int = 5


@dataclass(slots=True)
class LangSmithConfig:
    langchain_tracing_v2: bool
    langchain_api_key: str
    langchain_project: str
    langchain_endpoint: str


@dataclass(slots=True)
class SkillsConfig:
    skills_dir: str
    top_k: int = 3


@dataclass(slots=True)
class RagConfig:
    docs_dir: str
    chunk_size: int
    chunk_overlap: int
    collection_name: str
    persist_dir: str


@dataclass(slots=True)
class MpcConfig:
    server_url: str


@dataclass(slots=True)
class AppRuntimeConfig:
    host: str
    port: int
    workspace_output_dir: str


@dataclass(slots=True)
class AppConfig:
    model: ModelConfig
    search: SearchConfig
    langsmith: LangSmithConfig
    skills: SkillsConfig
    rag: RagConfig
    mcp: MpcConfig
    app: AppRuntimeConfig


DEFAULT_CONFIG_PATH = Path(__file__).resolve().parents[3] / "config.toml"


def load_config(config_path: str | None = None) -> AppConfig:
    """Load and normalize DevMate configuration from TOML and environment."""
    env_config = os.getenv("DEVMATE_CONFIG", "").strip()
    chosen_path = config_path or env_config
    path = Path(chosen_path) if chosen_path else DEFAULT_CONFIG_PATH
    config_dir = path.resolve().parent
    with path.open("rb") as file:
        raw = tomllib.load(file)

    model = raw.get("model", {})
    search = raw.get("search", {})
    langsmith = raw.get("langsmith", {})
    skills = raw.get("skills", {})
    rag = raw.get("rag", {})
    mcp = raw.get("mcp", {})

    skills_dir_raw = str(skills.get("skills_dir", ".skills"))
    skills_dir_path = Path(skills_dir_raw)
    if not skills_dir_path.is_absolute():
        skills_dir_path = (config_dir / skills_dir_path).resolve()

    docs_dir_raw = str(rag.get("docs_dir", "devmate_app/docs"))
    docs_dir_path = Path(docs_dir_raw)
    if not docs_dir_path.is_absolute():
        docs_dir_path = (config_dir / docs_dir_path).resolve()

    persist_dir_raw = str(rag.get("persist_dir", ".data/chroma"))
    persist_dir_path = Path(persist_dir_raw)
    if not persist_dir_path.is_absolute():
        persist_dir_path = (config_dir / persist_dir_path).resolve()

    output_dir_raw = str(
        raw.get("app", {}).get("workspace_output_dir", "workspace_output")
    )
    output_dir_path = Path(output_dir_raw)
    if not output_dir_path.is_absolute():
        output_dir_path = (config_dir / output_dir_path).resolve()

    return AppConfig(
        model=ModelConfig(
            ai_base_url=str(model.get("ai_base_url", "https://api.openai.com/v1")),
            api_key=str(model.get("api_key", os.getenv("OPENAI_API_KEY", ""))),
            model_name=str(model.get("model_name", "gpt-4o-mini")),
            embedding_model_name=str(
                model.get("embedding_model_name", "text-embedding-v3")
            ),
            embedding_base_url=str(model.get("embedding_base_url", "")),
            embedding_api_key=str(model.get("embedding_api_key", "")),
            temperature=float(model.get("temperature", 0.1)),
        ),
        search=SearchConfig(
            tavily_api_key=str(
                search.get("tavily_api_key", os.getenv("TAVILY_API_KEY", ""))
            ),
            max_results=int(search.get("max_results", 5)),
        ),
        langsmith=LangSmithConfig(
            langchain_tracing_v2=bool(
                str(langsmith.get("langchain_tracing_v2", "true")).lower()
                in {"1", "true", "yes"}
            ),
            langchain_api_key=str(
                langsmith.get(
                    "langchain_api_key", os.getenv("LANGCHAIN_API_KEY", "")
                )
            ),
            langchain_project=str(
                langsmith.get(
                    "langchain_project", langsmith.get("project", "DevMate")
                )
            ),
            langchain_endpoint=str(
                langsmith.get(
                    "langchain_endpoint",
                    langsmith.get("endpoint", "https://api.smith.langchain.com"),
                )
            ),
        ),
        skills=SkillsConfig(
            skills_dir=str(skills_dir_path),
            top_k=int(skills.get("top_k", 3)),
        ),
        rag=RagConfig(
            docs_dir=str(docs_dir_path),
            chunk_size=int(rag.get("chunk_size", 800)),
            chunk_overlap=int(rag.get("chunk_overlap", 120)),
            collection_name=str(rag.get("collection_name", "devmate_docs")),
            persist_dir=str(persist_dir_path),
        ),
        mcp=MpcConfig(
            server_url=str(
                mcp.get(
                    "server_url",
                    mcp.get("search_server_url", "http://127.0.0.1:9000/mcp"),
                )
            ),
        ),
        app=AppRuntimeConfig(
            host=str(raw.get("app", {}).get("host", "127.0.0.1")),
            port=int(raw.get("app", {}).get("port", 8080)),
            workspace_output_dir=str(output_dir_path),
        ),
    )
