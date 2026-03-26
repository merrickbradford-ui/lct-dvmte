"""Model creation and observability setup."""

from __future__ import annotations

import os

from langchain_openai import ChatOpenAI, OpenAIEmbeddings

from devmate.config import AppConfig


def configure_langsmith(config: AppConfig) -> None:
    """Apply LangSmith tracing settings to process environment variables."""
    os.environ["LANGCHAIN_TRACING_V2"] = (
        "true" if config.langsmith.langchain_tracing_v2 else "false"
    )
    os.environ["LANGCHAIN_PROJECT"] = config.langsmith.langchain_project
    os.environ["LANGCHAIN_ENDPOINT"] = config.langsmith.langchain_endpoint

    if config.langsmith.langchain_api_key:
        os.environ["LANGCHAIN_API_KEY"] = config.langsmith.langchain_api_key


def create_chat_model(config: AppConfig) -> ChatOpenAI:
    """Create the chat LLM client used by the agent."""
    return ChatOpenAI(
        model=config.model.model_name,
        api_key=config.model.api_key,
        base_url=config.model.ai_base_url,
        temperature=config.model.temperature,
    )


def create_embedding_model(config: AppConfig) -> OpenAIEmbeddings:
    """Create the embedding model using OpenAI-compatible API.

    Uses check_embedding_ctx_length=False to send raw text strings
    instead of token arrays, which is required by DashScope and other
    OpenAI-compatible embedding providers that do not support token input.
    """
    embedding_api_key = config.model.embedding_api_key or config.model.api_key
    embedding_base_url = (
        config.model.embedding_base_url or config.model.ai_base_url
    )
    return OpenAIEmbeddings(
        model=config.model.embedding_model_name,
        api_key=embedding_api_key,
        base_url=embedding_base_url,
        check_embedding_ctx_length=False,
    )
