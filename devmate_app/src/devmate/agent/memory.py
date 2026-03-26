"""Conversation memory for multi-turn chat sessions."""

from __future__ import annotations

import threading
import uuid

from langchain_core.messages import BaseMessage


class ConversationMemoryStore:
    """In-memory conversation store keyed by session id."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._sessions: dict[str, list[BaseMessage]] = {}

    def create_session(self) -> str:
        """Create a new session id and initialize empty history."""
        session_id = uuid.uuid4().hex
        with self._lock:
            self._sessions.setdefault(session_id, [])
        return session_id

    def ensure_session(self, session_id: str | None) -> str:
        """Return existing session id or create a new one when missing."""
        if session_id:
            with self._lock:
                self._sessions.setdefault(session_id, [])
            return session_id
        return self.create_session()

    def get(self, session_id: str) -> list[BaseMessage]:
        """Get a copy of message history for one session."""
        with self._lock:
            return list(self._sessions.get(session_id, []))

    def append(self, session_id: str, *messages: BaseMessage) -> None:
        """Append one or more messages to a session history."""
        with self._lock:
            items = self._sessions.setdefault(session_id, [])
            items.extend(messages)

    def set(self, session_id: str, messages: list[BaseMessage]) -> None:
        """Replace full history for a session."""
        with self._lock:
            self._sessions[session_id] = list(messages)

    def clear(self, session_id: str) -> None:
        """Delete all memory for one session id."""
        with self._lock:
            self._sessions.pop(session_id, None)
