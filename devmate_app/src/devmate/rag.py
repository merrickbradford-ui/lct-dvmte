"""RAG ingestion and retrieval tools."""

from __future__ import annotations

import logging
from pathlib import Path

from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_core.tools import tool

from devmate.config import load_config
from devmate.models import create_embedding_model

logger = logging.getLogger(__name__)


def _split_text(text: str, chunk_size: int, chunk_overlap: int) -> list[str]:
    """Split long text into overlapping chunks for vector indexing."""
    cleaned = text.strip()
    if not cleaned:
        return []

    chunks: list[str] = []
    start = 0
    step = max(1, chunk_size - chunk_overlap)
    while start < len(cleaned):
        end = min(len(cleaned), start + chunk_size)
        chunks.append(cleaned[start:end])
        if end >= len(cleaned):
            break
        start += step
    return chunks


class RagService:
    """Owns vector store lifecycle: ingest and similarity retrieval."""

    def __init__(self) -> None:
        """Initialize embeddings and persistent Chroma collection."""
        self.config = load_config()
        self.embeddings = create_embedding_model(self.config)
        Path(self.config.rag.persist_dir).mkdir(parents=True, exist_ok=True)
        self.vector_store = Chroma(
            collection_name=self.config.rag.collection_name,
            embedding_function=self.embeddings,
            persist_directory=self.config.rag.persist_dir,
        )

    def ingest_docs(self) -> int:
        """Ingest markdown/text docs from configured directory into Chroma."""
        docs_dir = Path(self.config.rag.docs_dir)
        docs_dir.mkdir(parents=True, exist_ok=True)

        raw_docs: list[Document] = []
        for file in docs_dir.rglob("*"):
            if not file.is_file() or file.suffix.lower() not in {".md", ".txt"}:
                continue
            text = file.read_text(encoding="utf-8")
            if text.strip():
                raw_docs.append(
                    Document(page_content=text, metadata={"source": str(file)})
                )

        if not raw_docs:
            logger.warning("No docs found to ingest in %s", docs_dir)
            return 0

        chunks: list[Document] = []
        for raw in raw_docs:
            for piece in _split_text(
                text=raw.page_content,
                chunk_size=self.config.rag.chunk_size,
                chunk_overlap=self.config.rag.chunk_overlap,
            ):
                chunks.append(Document(page_content=piece, metadata=raw.metadata))

        self.vector_store.delete_collection()
        self.vector_store = Chroma(
            collection_name=self.config.rag.collection_name,
            embedding_function=self.embeddings,
            persist_directory=self.config.rag.persist_dir,
        )
        self.vector_store.add_documents(chunks)
        logger.info("Ingested %d chunks into vector store", len(chunks))
        return len(chunks)

    def search(self, query: str, top_k: int = 4) -> str:
        """Return top-k knowledge snippets related to the query."""
        results = self.vector_store.similarity_search(query=query, k=top_k)
        if not results:
            return "No relevant knowledge base context found."
        return "\n\n".join(doc.page_content for doc in results)


def build_rag_tool(rag: RagService):
    """Wrap RAG search as a LangChain tool for agent use."""

    @tool("search_knowledge_base")
    def search_knowledge_base(query: str) -> str:
        """Search local project knowledge base for internal guidelines and templates."""
        return rag.search(query=query)

    return search_knowledge_base


def main() -> None:
    """CLI entrypoint to build the vector store and run a sample search."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    )
    rag = RagService()
    rag.ingest_docs()
    sample = rag.search("project guidelines")
    logger.info("Sample retrieval preview length: %d", len(sample))
