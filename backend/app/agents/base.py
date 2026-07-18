"""
SiteAI — Agent Base Class
All specialist agents inherit from this.
Enforces: GraphRAG retrieval → LLM reasoning → Decision logging pattern.
"""
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Optional
import anthropic

from app.core.config import settings
from app.core.logging import get_logger
from app.services.graphrag import graphrag_engine

logger = get_logger("agent_base")

_anthropic_client: Optional[anthropic.AsyncAnthropic] = None


def get_anthropic_client() -> anthropic.AsyncAnthropic:
    global _anthropic_client
    if _anthropic_client is None:
        _anthropic_client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _anthropic_client


@dataclass
class AgentTask:
    """Represents a task dispatched to an agent."""
    task_id: str
    task_type: str
    project_id: str
    query: str
    asset_tag: Optional[str] = None
    context: dict = field(default_factory=dict)


@dataclass
class AgentResult:
    """Structured output from any agent — goes to the decision ledger."""
    task_id: str
    agent_name: str
    task_type: str
    success: bool
    output: dict
    confidence: float = 0.0
    reasoning_chain: list = field(default_factory=list)
    tokens_used: int = 0
    latency_ms: int = 0
    error: Optional[str] = None


class BaseAgent(ABC):
    """
    Base class for all SiteAI specialist agents.
    Provides: GraphRAG retrieval, Claude API call, structured output.
    Subclasses implement: system_prompt, process_task.
    """

    name: str = "base_agent"
    description: str = ""

    @property
    @abstractmethod
    def system_prompt(self) -> str:
        """Domain-specific system prompt for this agent."""
        ...

    @abstractmethod
    async def process_task(self, task: AgentTask, context: str) -> dict:
        """
        Core agent logic. Receives assembled GraphRAG context,
        returns structured output dict.
        """
        ...

    async def run(self, task: AgentTask) -> AgentResult:
        """
        Standard agent execution pipeline:
        1. GraphRAG retrieval
        2. LLM reasoning with domain system prompt
        3. Return structured result
        """
        start_ms = int(time.time() * 1000)

        try:
            # Step 1: GraphRAG retrieval
            retrieval = await graphrag_engine.query(
                query=task.query,
                project_id=task.project_id,
                asset_tag=task.asset_tag,
            )
            context_text = retrieval["context_text"]

            # Step 2: Domain-specific processing
            output = await self.process_task(task, context_text)

            latency = int(time.time() * 1000) - start_ms
            confidence = output.pop("confidence", 0.85)

            logger.info(
                "Agent task completed",
                agent=self.name,
                task_type=task.task_type,
                latency_ms=latency,
                confidence=confidence,
            )

            return AgentResult(
                task_id=task.task_id,
                agent_name=self.name,
                task_type=task.task_type,
                success=True,
                output=output,
                confidence=confidence,
                latency_ms=latency,
            )

        except Exception as e:
            logger.error("Agent task failed", agent=self.name, error=str(e), exc_info=True)
            return AgentResult(
                task_id=task.task_id,
                agent_name=self.name,
                task_type=task.task_type,
                success=False,
                output={},
                error=str(e),
                latency_ms=int(time.time() * 1000) - start_ms,
            )

    async def call_claude(
        self,
        user_message: str,
        system_override: Optional[str] = None,
        max_tokens: int = 2048,
    ) -> tuple[str, int]:
        """
        Makes a Claude API call with the agent's system prompt.
        Returns (response_text, tokens_used).
        """
        client = get_anthropic_client()
        system = system_override or self.system_prompt

        message = await client.messages.create(
            model=settings.claude_model,
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": user_message}],
        )

        text = message.content[0].text
        tokens = message.usage.input_tokens + message.usage.output_tokens
        return text, tokens

    def build_user_message(self, task: AgentTask, context: str) -> str:
        """Standard user message template — context + task query."""
        return f"""PROJECT CONTEXT:
Project ID: {task.project_id}
Asset under analysis: {task.asset_tag or 'N/A'}

RETRIEVED ENGINEERING CONTEXT:
{context}

TASK:
{task.query}

Respond with structured JSON as specified in your system prompt."""
