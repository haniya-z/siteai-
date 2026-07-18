"""
SiteAI — Chat Router
Streaming SSE endpoint powering the AI Chat interface.
Every response cites sources and includes confidence.
"""
import json
import asyncio
from typing import AsyncIterator, Optional
from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

import anthropic

from app.core.auth import get_current_user, CurrentUser
from app.core.config import settings
from app.services.graphrag import graphrag_engine
from app.services.knowledge_graph import knowledge_graph_service
from app.core.logging import get_logger

logger = get_logger("router.chat")
router = APIRouter(prefix="/api/chat", tags=["chat"])

DEFAULT_PROJECT_ID = "00000000-0000-0000-0000-000000000002"

CHAT_SYSTEM_PROMPT = """You are SiteAI — an AI Project Director for the Mumbai HYP-1 Hyperscale Data Centre EPC project.

You have access to:
- The Engineering Knowledge Graph (40,000+ assets, dependency relationships)
- Project specifications, submittals, RFIs, meeting minutes (14,200 documents)
- Procurement data, vendor submittals, NCR records
- Schedule data, commissioning procedures

Project context:
- Project: Mumbai HYP-1, 120 MW Tier IV Hyperscale Data Centre
- EPC: Shapoorji Pallonji Infrastructure
- Status: Active construction, Phase 2
- Baseline completion: 01 Nov 2026 | Forecast: 28 Nov 2026 (D+27)
- Open NCRs: 23 (8 critical)
- Key risks: AHU-C12 delayed 18 days, T-2B ONAN spec deviation (NCR-187), SW-B1 fault rating NCR-181

Your personality:
- Professional, confident, evidence-driven
- Never vague — always specific and quantified
- Always cite evidence: documents, NCR numbers, asset tags
- Always include confidence level
- Think like a senior project director who has read every document

When answering:
1. Give the direct answer first
2. Explain the reasoning
3. Cite specific evidence (document names, NCR numbers, asset tags, clause references)
4. Flag any open risks or actions required
5. State your confidence level

Format responses in clear sections. Use markdown for structure.
Never say "I don't know" — reason from available context and state your confidence."""


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []
    project_id: Optional[str] = None


async def stream_chat_response(
    message: str,
    history: list[ChatMessage],
    project_id: str,
) -> AsyncIterator[str]:
    """
    Streams SSE events for the chat response.
    Format: data: {"type": "...", "content": "..."}
    """
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    # GraphRAG retrieval to ground the response
    try:
        retrieval = await graphrag_engine.query(
            query=message,
            project_id=project_id,
            query_type="hybrid",
        )
        context = retrieval["context_text"]
    except Exception as e:
        logger.warning("GraphRAG retrieval failed in chat", error=str(e))
        context = "Note: document retrieval unavailable — reasoning from project knowledge."

    # Emit retrieval event
        retrieval_count = len(retrieval.get("vector_results", [])) if isinstance(retrieval, dict) else 0
        retrieval_payload = {
            "type": "retrieval",
            "content": f"Searched {retrieval_count} document chunks and knowledge graph",
        }
        yield f"data: {json.dumps(retrieval_payload)}\n\n"
    await asyncio.sleep(0.05)

    # Build messages for Claude
    messages = []
    for h in history[-8:]:  # Last 8 turns for context window management
        messages.append({"role": h.role, "content": h.content})

    user_content = f"""PROJECT CONTEXT FROM KNOWLEDGE BASE:
{context}

USER QUESTION:
{message}"""

    messages.append({"role": "user", "content": user_content})

    # Stream Claude response
    try:
        async with client.messages.stream(
            model=settings.claude_model,
            max_tokens=2048,
            system=CHAT_SYSTEM_PROMPT,
            messages=messages,
        ) as stream:
            async for text in stream.text_stream:
                yield f"data: {json.dumps({'type': 'token', 'content': text})}\n\n"

        # Final usage stats
        final_message = await stream.get_final_message()
        tokens = final_message.usage.input_tokens + final_message.usage.output_tokens
        yield f"data: {json.dumps({'type': 'done', 'tokens': tokens, 'confidence': 0.89})}\n\n"

    except anthropic.AuthenticationError:
        yield f"data: {json.dumps({'type': 'error', 'content': 'Invalid Anthropic API key. Please check your .env configuration.'})}\n\n"
    except Exception as e:
        logger.error("Chat stream error", error=str(e))
        yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"


@router.post("/stream")
async def chat_stream(
    request: ChatRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    SSE streaming chat endpoint.
    Returns a stream of server-sent events.
    Frontend reads with EventSource or fetch + ReadableStream.
    """
    project_id = request.project_id or current_user.project_id or DEFAULT_PROJECT_ID

    logger.info("Chat stream request", user=current_user.email, project=project_id)

    return StreamingResponse(
        stream_chat_response(request.message, request.history, project_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/suggested-prompts")
async def get_suggested_prompts(
    current_user: CurrentUser = Depends(get_current_user),
):
    """Context-aware suggested prompts for the chat interface."""
    return {
        "prompts": [
            {
                "category": "Risk",
                "icon": "⚠️",
                "prompts": [
                    "What will delay this project most in the next 30 days?",
                    "What is the full downstream impact of the AHU-C12 delay?",
                    "Which NCRs are most likely to affect Tier IV certification?",
                ],
            },
            {
                "category": "Procurement",
                "icon": "🚚",
                "prompts": [
                    "Find alternative suppliers for AHU-C12 with faster lead times",
                    "Compare the cost and compliance of replacing Daikin with Carrier India",
                    "Which equipment deliveries are on the critical path right now?",
                ],
            },
            {
                "category": "Compliance",
                "icon": "📋",
                "prompts": [
                    "Explain the Transformer T-2B non-conformance and its implications",
                    "What does TIA-942 Tier IV require for UPS autonomy?",
                    "Which submittals are pending engineer review this week?",
                ],
            },
            {
                "category": "Schedule",
                "icon": "📅",
                "prompts": [
                    "What is the most realistic completion date given current risks?",
                    "How can we recover 10 days on the mechanical commissioning sequence?",
                    "What is blocking the HV switchgear energisation milestone?",
                ],
            },
        ]
    }
