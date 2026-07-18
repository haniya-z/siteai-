"""
SiteAI — Document Intelligence Router
PDF/DOCX upload → text extraction → chunking → Qdrant indexing → Neo4j node.
"""
import os
import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from pydantic import BaseModel

from app.core.auth import get_current_user, CurrentUser
from app.services.graphrag import index_document_chunks
from app.db.connections import get_qdrant_client
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("router.documents")
router = APIRouter(prefix="/api/documents", tags=["documents"])

DEFAULT_PROJECT_ID = "00000000-0000-0000-0000-000000000002"
UPLOAD_DIR = Path("/app/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_TYPES = {
    "application/pdf": ".pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "text/plain": ".txt",
}

DOC_TYPE_MAP = {
    "spec": "specification",
    "submittal": "submittal",
    "rfi": "rfi",
    "schedule": "schedule",
    "drawing": "drawing",
    "change_order": "change_order",
    "commissioning": "commissioning",
    "meeting": "meeting_minutes",
}


def extract_text_from_pdf(file_path: Path) -> str:
    """Extract text from PDF using PyPDF2."""
    try:
        import PyPDF2
        text_parts = []
        with open(file_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    text_parts.append(text.strip())
        return "\n\n".join(text_parts)
    except Exception as e:
        logger.warning("PDF extraction failed", error=str(e))
        return ""


def extract_text_from_docx(file_path: Path) -> str:
    """Extract text from DOCX."""
    try:
        from docx import Document
        doc = Document(str(file_path))
        return "\n\n".join(p.text for p in doc.paragraphs if p.text.strip())
    except Exception as e:
        logger.warning("DOCX extraction failed", error=str(e))
        return ""


def chunk_text(text: str, chunk_size: int = 800, overlap: int = 100) -> list[str]:
    """
    Splits text into overlapping chunks for embedding.
    Tries to split on paragraph boundaries first.
    """
    if not text.strip():
        return []

    # Try paragraph splitting first
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]

    chunks = []
    current = ""
    for para in paragraphs:
        if len(current) + len(para) < chunk_size:
            current += (" " if current else "") + para
        else:
            if current:
                chunks.append(current)
            # If single paragraph is too long, split by sentences
            if len(para) > chunk_size:
                words = para.split()
                part = ""
                for word in words:
                    if len(part) + len(word) < chunk_size:
                        part += (" " if part else "") + word
                    else:
                        if part:
                            chunks.append(part)
                        part = word
                if part:
                    chunks.append(part)
            else:
                current = para

    if current:
        chunks.append(current)

    return [c for c in chunks if len(c) > 50]


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    doc_type: str = Form(default="spec"),
    project_id: Optional[str] = Form(default=None),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Upload and index a project document.
    Extracts text, chunks it, embeds it into Qdrant,
    and creates a document node in the knowledge graph.
    """
    pid = project_id or current_user.project_id or DEFAULT_PROJECT_ID

    # Validate file type
    content_type = file.content_type or ""
    if content_type not in ALLOWED_TYPES and not file.filename.endswith((".pdf", ".docx", ".txt")):
        raise HTTPException(status_code=400, detail=f"File type not supported: {content_type}")

    # Save to disk
    doc_id = str(uuid.uuid4())
    ext = Path(file.filename).suffix or ".pdf"
    save_path = UPLOAD_DIR / f"{doc_id}{ext}"

    contents = await file.read()
    with open(save_path, "wb") as f:
        f.write(contents)

    logger.info("Document saved", doc_id=doc_id, filename=file.filename, size=len(contents))

    # Extract text
    if ext == ".pdf":
        text = extract_text_from_pdf(save_path)
    elif ext == ".docx":
        text = extract_text_from_docx(save_path)
    else:
        text = contents.decode("utf-8", errors="ignore")

    if not text.strip():
        return {
            "doc_id": doc_id,
            "filename": file.filename,
            "status": "uploaded_no_text",
            "chunks": 0,
            "message": "File saved but no text could be extracted.",
        }

    # Chunk and index
    chunks = chunk_text(text)
    indexed = await index_document_chunks(
        project_id=pid,
        document_id=doc_id,
        filename=file.filename,
        doc_type=DOC_TYPE_MAP.get(doc_type, doc_type),
        chunks=chunks,
    )

    logger.info("Document indexed", doc_id=doc_id, chunks=indexed)

    return {
        "doc_id": doc_id,
        "filename": file.filename,
        "doc_type": doc_type,
        "file_size_bytes": len(contents),
        "chunks_indexed": indexed,
        "status": "indexed",
        "message": f"Successfully extracted and indexed {indexed} chunks from {file.filename}",
    }


@router.get("/")
async def list_documents(
    current_user: CurrentUser = Depends(get_current_user),
):
    """Lists all indexed documents for the project."""
    # In production: query Postgres documents table
    # For MVP: return the mock documents that were seeded
    return {
        "documents": [
            {"id": "seed-001", "filename": "Electrical_Specification_Rev_C.pdf",
             "doc_type": "specification", "chunks": 4, "indexed": True},
            {"id": "seed-002", "filename": "Transformer_T2B_Submittal_Daikin_Rev1.pdf",
             "doc_type": "submittal", "chunks": 2, "indexed": True},
            {"id": "seed-003", "filename": "Switchgear_SW_B1_ABB_Submittal.pdf",
             "doc_type": "submittal", "chunks": 1, "indexed": True},
            {"id": "seed-004", "filename": "RFI_Log_June_2026.pdf",
             "doc_type": "rfi", "chunks": 3, "indexed": True},
            {"id": "seed-005", "filename": "TIA942_Cx_Procedures_Rev2.pdf",
             "doc_type": "commissioning", "chunks": 3, "indexed": True},
        ],
        "total": 5,
        "total_chunks": 13,
    }


@router.post("/search")
async def search_documents(
    body: dict,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Semantic search over indexed documents."""
    query = body.get("query", "")
    pid = current_user.project_id or DEFAULT_PROJECT_ID

    if not query:
        raise HTTPException(status_code=400, detail="Query required")

    from app.services.graphrag import graphrag_engine
    result = await graphrag_engine.query(query=query, project_id=pid, query_type="semantic")

    return {
        "query": query,
        "results": result["vector_results"],
        "total": len(result["vector_results"]),
    }
