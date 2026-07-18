"""
SiteAI — GraphRAG Engine
Implements hybrid retrieval: graph traversal + vector similarity.
Sprint 1 Section 8: Query planning routes between strategies.

Two retrieval strategies:
  1. Vector search: semantic/document queries
  2. Graph traversal: relationship/impact queries
  3. Hybrid: combines both, used by most agent queries
"""
import hashlib
from typing import Optional
from uuid import uuid4

from qdrant_client.models import PointStruct, Filter, FieldCondition, MatchValue

from app.db.connections import get_qdrant_client, neo4j_session
from app.core.config import settings
from app.core.logging import get_logger
from app.services.knowledge_graph import knowledge_graph_service

logger = get_logger("graphrag")

# Lazy embedding model — loaded on first use to avoid startup cost
_embedding_model = None


def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("Embedding model loaded", model="all-MiniLM-L6-v2")
        except Exception as e:
            logger.warning("Embedding model unavailable, using mock", error=str(e))
            _embedding_model = None
    return _embedding_model


def embed_text(text: str) -> list[float]:
    """Embed text using the sentence transformer model."""
    model = get_embedding_model()
    if model:
        return model.encode(text).tolist()
    # Fallback: deterministic mock embedding based on text hash
    import random
    h = int(hashlib.md5(text.encode()).hexdigest(), 16)
    random.seed(h)
    return [random.gauss(0, 1) for _ in range(settings.embedding_dimension)]


# ─── Document Indexing ────────────────────────────────────────────────────────

async def index_document_chunks(
    project_id: str,
    document_id: str,
    filename: str,
    doc_type: str,
    chunks: list[str],
) -> int:
    """
    Embeds and indexes document chunks into Qdrant.
    Returns the number of chunks indexed.
    """
    client = get_qdrant_client()
    points = []

    for i, chunk in enumerate(chunks):
        if not chunk.strip():
            continue
        vector = embed_text(chunk)
        point = PointStruct(
            id=str(uuid4()),
            vector=vector,
            payload={
                "project_id": project_id,
                "document_id": document_id,
                "filename": filename,
                "doc_type": doc_type,
                "chunk_index": i,
                "text": chunk[:2000],  # Store up to 2000 chars
            },
        )
        points.append(point)

    if points:
        await client.upsert(
            collection_name=settings.qdrant_collection,
            points=points,
        )

    logger.info("Document indexed", document_id=document_id, chunks=len(points))
    return len(points)


# ─── Mock Document Content (for hackathon demo without real uploads) ──────────

MOCK_PROJECT_DOCUMENTS = [
    {
        "doc_type": "specification",
        "filename": "Electrical_Specification_Rev_C.pdf",
        "chunks": [
            "Section 3.2 — Transformer Specification: All main HV/LV transformers shall be rated at minimum 50 MVA with ONAN cooling to 100% of nameplate capacity. Impedance shall be between 5.5% and 6.5%. All units must comply with IS 2026 and IEC 60076.",
            "Section 3.3 — Switchgear: All HV switchgear shall have a minimum fault-current withstand rating of 40 kA for 1 second. Switchgear panels B1 and B2 shall be type-tested to IEC 62271.",
            "Section 4.1 — UPS Systems: All UPS systems shall provide minimum 10 minutes autonomy at 100% rated load. Battery technology: VRLA. UPS shall be double-conversion online topology per IEC 62040.",
            "Section 5.2 — Generators: Backup generators shall be 2000 kVA minimum, N+1 configuration. Fuel consumption not to exceed 265 L/hr at 75% load. Tier III emissions compliance mandatory.",
        ],
    },
    {
        "doc_type": "submittal",
        "filename": "Transformer_T2B_Submittal_Daikin_Rev1.pdf",
        "chunks": [
            "Transformer T-2B Vendor Submittal — Daikin Power Systems. Unit rated 50 MVA ONAN cooling. Actual tested cooling capacity: 49.0 MVA (98% of nameplate). Transformer impedance: 5.2% (within specification range 5.5-6.5% — NON-CONFORMANCE: below lower limit).",
            "Vendor notes: ONAN to ONAF upgrade available at additional cost of USD 45,000. Delivery timeline for ONAF variant: +6 weeks from current ETA.",
        ],
    },
    {
        "doc_type": "submittal",
        "filename": "Switchgear_SW_B1_ABB_Submittal.pdf",
        "chunks": [
            "HV Switchgear SW-B1 — ABB India Ltd. Rated voltage 11kV. Short-circuit withstand: 31.5 kA for 1 second. Specification requires 40 kA. NON-CONFORMANCE: short-circuit rating is 21% below specified requirement. Upgrading to 40 kA unit requires 14-week lead time.",
        ],
    },
    {
        "doc_type": "rfi",
        "filename": "RFI_Log_June_2026.pdf",
        "chunks": [
            "RFI-0445 (Open): Cable tray routing conflict at Grid B-7, Level 3. Raised by M/E Coordinator on 13 Jun 2026. Description: HV cable tray clashes with structural beam grid. 6 trade contractors blocked from proceeding. Awaiting structural engineer response. Estimated resolution: 30 Jun 2026.",
            "RFI-0431 (Closed): Generator fuel day-tank capacity. Resolved: Increase day-tank from 500L to 750L to meet 8-hour runtime at full load. Change order CO-0089 issued.",
            "RFI-0412 (Closed): UPS battery room ventilation. Resolved: Additional ventilation fans added per IEC 62485 requirements. No cost impact.",
        ],
    },
    {
        "doc_type": "commissioning",
        "filename": "TIA942_Cx_Procedures_Rev2.pdf",
        "chunks": [
            "Section 7.1 — Generator Load Bank Testing (TIA-942 Tier IV): Generators must be tested at 25%, 50%, 75%, and 100% load for minimum 4 hours at each level. Concurrent maintainability: one generator must be removable from service without loss of power to IT load. All four generators must run simultaneously at 100% for 1 hour.",
            "Section 7.3 — UPS Integrated Testing: Battery discharge test at 100% rated load to confirm minimum 10-minute autonomy. Static transfer switch operation: verify transfer time <4ms. All UPS must demonstrate N+1 concurrent maintainability.",
            "Section 8.1 — Tier IV Concurrent Maintainability: Any single planned maintenance activity must not cause interruption to the IT load. Two independent utility sources must be confirmed operational prior to commencing IT load testing.",
        ],
    },
]


async def seed_vector_index(project_id: str) -> int:
    """Seeds the vector index with mock project documents for the demo."""
    total_chunks = 0
    for doc in MOCK_PROJECT_DOCUMENTS:
        doc_id = str(uuid4())
        count = await index_document_chunks(
            project_id=project_id,
            document_id=doc_id,
            filename=doc["filename"],
            doc_type=doc["doc_type"],
            chunks=doc["chunks"],
        )
        total_chunks += count
    logger.info("Vector index seeded", project_id=project_id, total_chunks=total_chunks)
    return total_chunks


# ─── GraphRAG Query Engine ─────────────────────────────────────────────────────

class GraphRAGEngine:
    """
    The query planning and retrieval engine.
    Classifies queries and routes to the appropriate retrieval strategy.
    Assembles combined context for the reasoning layer (agents).
    """

    async def query(
        self,
        query: str,
        project_id: str,
        query_type: str = "auto",
        asset_tag: Optional[str] = None,
        top_k: int = 5,
    ) -> dict:
        """
        Main entry point for GraphRAG queries.
        Returns assembled context dict ready for agent consumption.
        """
        # Query classification
        if query_type == "auto":
            query_type = self._classify_query(query)

        logger.info("GraphRAG query", type=query_type, asset=asset_tag)

        vector_context = []
        graph_context = {}

        if query_type in ("semantic", "hybrid"):
            vector_context = await self._vector_search(query, project_id, top_k)

        if query_type in ("graph", "hybrid") and asset_tag:
            graph_context = await knowledge_graph_service.get_downstream_impacts(
                asset_tag, project_id
            )

        if query_type == "graph" and not asset_tag:
            # Extract potential asset tags from query
            asset_tag = self._extract_asset_tag(query)
            if asset_tag:
                graph_context = await knowledge_graph_service.get_downstream_impacts(
                    asset_tag, project_id
                )

        return {
            "query": query,
            "query_type": query_type,
            "vector_results": vector_context,
            "graph_results": graph_context,
            "context_text": self._assemble_context(vector_context, graph_context),
        }

    def _classify_query(self, query: str) -> str:
        """
        Lightweight query classifier.
        In production this becomes a fast LLM call or trained classifier.
        """
        query_lower = query.lower()
        graph_signals = [
            "impact", "affect", "downstream", "depend", "cascade",
            "what changes", "ripple", "consequence", "delay", "procurement"
        ]
        semantic_signals = [
            "what does", "specification", "standard", "requirement",
            "rfi", "submittal", "clause", "section", "document"
        ]
        if any(s in query_lower for s in graph_signals):
            return "hybrid"
        if any(s in query_lower for s in semantic_signals):
            return "semantic"
        return "hybrid"

    def _extract_asset_tag(self, query: str) -> Optional[str]:
        """Extracts asset tags from query text."""
        import re
        # Patterns: T-2B, SW-B1, AHU-C12, G-4, UPS-A3, CH-1, CT-3
        pattern = r'\b([A-Z]{1,5}-[A-Z0-9]{1,5})\b'
        matches = re.findall(pattern, query.upper())
        return matches[0] if matches else None

    async def _vector_search(
        self, query: str, project_id: str, top_k: int
    ) -> list[dict]:
        """Semantic search over indexed document chunks."""
        try:
            client = get_qdrant_client()
            query_vector = embed_text(query)

            results = await client.search(
                collection_name=settings.qdrant_collection,
                query_vector=query_vector,
                query_filter=Filter(
                    must=[
                        FieldCondition(
                            key="project_id",
                            match=MatchValue(value=project_id),
                        )
                    ]
                ),
                limit=top_k,
                with_payload=True,
            )

            return [
                {
                    "text": r.payload.get("text", ""),
                    "filename": r.payload.get("filename", ""),
                    "doc_type": r.payload.get("doc_type", ""),
                    "score": round(r.score, 4),
                }
                for r in results
            ]
        except Exception as e:
            logger.warning("Vector search failed", error=str(e))
            return []

    def _assemble_context(
        self, vector_results: list, graph_results: dict
    ) -> str:
        """
        Assembles retrieval results into a coherent context string
        for the reasoning layer. This is the context window budget management point.
        """
        parts = []

        if vector_results:
            parts.append("=== RETRIEVED DOCUMENT CONTEXT ===")
            for r in vector_results[:4]:  # Cap at 4 chunks for context budget
                parts.append(
                    f"[{r['doc_type'].upper()} — {r['filename']} (relevance: {r['score']})]"
                )
                parts.append(r["text"])
                parts.append("")

        if graph_results and graph_results.get("impact_edges"):
            parts.append("=== ENGINEERING KNOWLEDGE GRAPH — IMPACT ANALYSIS ===")
            parts.append(f"Source Asset: {graph_results.get('source_asset', 'Unknown')}")
            parts.append(
                f"Total downstream assets impacted: {graph_results.get('total_impacted', 0)}"
            )
            parts.append("")
            domains = graph_results.get("domains", {})
            for domain, edges in domains.items():
                parts.append(f"Domain: {domain.upper()}")
                for edge in edges[:5]:
                    parts.append(
                        f"  {edge['from']} --[{edge['type']}]--> {edge['to']}: {edge.get('reason', '')}"
                    )
            parts.append("")

        return "\n".join(parts) if parts else "No relevant context retrieved."


graphrag_engine = GraphRAGEngine()
