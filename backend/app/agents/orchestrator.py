"""
SiteAI — Agent Orchestrator
Lightweight but functional: supervisor pattern, in-process for MVP,
designed so each agent can become an independent service later.

Workflow types:
  - engineering_change:  Engineering → SpecCompliance → ScheduleRisk → Executive
  - procurement_delay:   StrategicProcurement → ScheduleRisk → Executive
  - spec_check:          Knowledge → SpecCompliance → Executive
  - rfi_query:           Knowledge (single agent)
  - full_analysis:       All agents → Executive synthesis
"""
import asyncio
import time
from uuid import uuid4
from typing import Optional

from app.agents.base import AgentTask, AgentResult
from app.agents.specialists import (
    EngineeringAgent,
    SpecComplianceAgent,
    ScheduleRiskAgent,
    StrategicProcurementAgent,
    KnowledgeAgent,
    ExecutiveAgent,
)
from app.core.logging import get_logger

logger = get_logger("orchestrator")


class AgentOrchestrator:
    """
    Supervisor-pattern orchestrator.
    Dispatches tasks to specialist agents, aggregates results,
    passes combined context to ExecutiveAgent for final synthesis.

    Design for upgrade: each agent call is isolated and could trivially
    be replaced by an async HTTP call to an independent agent service.
    """

    def __init__(self):
        self.agents = {
            "engineering": EngineeringAgent(),
            "spec_compliance": SpecComplianceAgent(),
            "schedule_risk": ScheduleRiskAgent(),
            "strategic_procurement": StrategicProcurementAgent(),
            "knowledge": KnowledgeAgent(),
            "executive": ExecutiveAgent(),
        }

    async def run_workflow(
        self,
        workflow_type: str,
        project_id: str,
        query: str,
        asset_tag: Optional[str] = None,
        context: dict = None,
    ) -> dict:
        """
        Runs a named multi-agent workflow.
        Returns aggregated results + executive synthesis.
        """
        workflow_id = str(uuid4())
        start_ms = int(time.time() * 1000)
        context = context or {}

        logger.info(
            "Workflow started",
            workflow_id=workflow_id,
            type=workflow_type,
            asset=asset_tag,
        )

        workflow_map = {
            "engineering_change": self._workflow_engineering_change,
            "procurement_delay": self._workflow_procurement_delay,
            "spec_check": self._workflow_spec_check,
            "rfi_query": self._workflow_rfi_query,
            "full_analysis": self._workflow_full_analysis,
        }

        handler = workflow_map.get(workflow_type, self._workflow_full_analysis)
        results = await handler(project_id, query, asset_tag, context)

        total_ms = int(time.time() * 1000) - start_ms
        total_tokens = sum(
            r.output.get("tokens_used", 0) for r in results.values() if r.success
        )

        logger.info(
            "Workflow completed",
            workflow_id=workflow_id,
            latency_ms=total_ms,
            total_tokens=total_tokens,
            agents_run=len(results),
        )

        return {
            "workflow_id": workflow_id,
            "workflow_type": workflow_type,
            "query": query,
            "asset_tag": asset_tag,
            "agent_results": {k: self._serialize_result(v) for k, v in results.items()},
            "executive_decision": results.get("executive") and self._serialize_result(results["executive"]),
            "metadata": {
                "total_latency_ms": total_ms,
                "total_tokens": total_tokens,
                "agents_invoked": list(results.keys()),
                "success": all(r.success for r in results.values()),
            },
        }

    # ─── Workflow Definitions ─────────────────────────────────────────────────

    async def _workflow_engineering_change(
        self, project_id, query, asset_tag, context
    ) -> dict[str, AgentResult]:
        """
        Engineering change analysis:
        Engineering + SpecCompliance + ScheduleRisk in parallel → Executive synthesis.
        """
        # Stage 1: Parallel specialist analysis
        base_task = AgentTask(
            task_id=str(uuid4()),
            task_type="engineering_change",
            project_id=project_id,
            query=query,
            asset_tag=asset_tag,
            context=context,
        )

        eng_task = AgentTask(**{**vars(base_task), "task_id": str(uuid4()),
                                "task_type": "impact_analysis"})
        spec_task = AgentTask(**{**vars(base_task), "task_id": str(uuid4()),
                                 "task_type": "compliance_check"})
        sched_task = AgentTask(**{**vars(base_task), "task_id": str(uuid4()),
                                  "task_type": "schedule_risk_assessment"})

        eng_result, spec_result, sched_result = await asyncio.gather(
            self.agents["engineering"].run(eng_task),
            self.agents["spec_compliance"].run(spec_task),
            self.agents["schedule_risk"].run(sched_task),
        )

        # Stage 2: Executive synthesis
        exec_query = self._build_executive_summary_query(
            query, eng_result, spec_result, sched_result
        )
        exec_task = AgentTask(
            task_id=str(uuid4()),
            task_type="executive_synthesis",
            project_id=project_id,
            query=exec_query,
            asset_tag=asset_tag,
        )
        exec_result = await self.agents["executive"].run(exec_task)

        return {
            "engineering": eng_result,
            "spec_compliance": spec_result,
            "schedule_risk": sched_result,
            "executive": exec_result,
        }

    async def _workflow_procurement_delay(
        self, project_id, query, asset_tag, context
    ) -> dict[str, AgentResult]:
        """
        Procurement delay workflow:
        StrategicProcurement + ScheduleRisk in parallel → Executive synthesis.
        """
        proc_task = AgentTask(
            task_id=str(uuid4()),
            task_type="vendor_alternatives",
            project_id=project_id,
            query=query,
            asset_tag=asset_tag,
            context=context,
        )
        sched_task = AgentTask(
            task_id=str(uuid4()),
            task_type="delay_schedule_impact",
            project_id=project_id,
            query=f"Schedule impact analysis: {query}",
            asset_tag=asset_tag,
            context=context,
        )

        proc_result, sched_result = await asyncio.gather(
            self.agents["strategic_procurement"].run(proc_task),
            self.agents["schedule_risk"].run(sched_task),
        )

        exec_query = self._build_executive_summary_query(
            query, proc_result, sched_result
        )
        exec_task = AgentTask(
            task_id=str(uuid4()),
            task_type="executive_procurement_decision",
            project_id=project_id,
            query=exec_query,
            asset_tag=asset_tag,
        )
        exec_result = await self.agents["executive"].run(exec_task)

        return {
            "strategic_procurement": proc_result,
            "schedule_risk": sched_result,
            "executive": exec_result,
        }

    async def _workflow_spec_check(
        self, project_id, query, asset_tag, context
    ) -> dict[str, AgentResult]:
        """Spec compliance check with knowledge retrieval backing."""
        knowledge_task = AgentTask(
            task_id=str(uuid4()),
            task_type="spec_lookup",
            project_id=project_id,
            query=query,
            asset_tag=asset_tag,
        )
        knowledge_result = await self.agents["knowledge"].run(knowledge_task)

        spec_query = f"{query}\n\nKnowledge context: {knowledge_result.output.get('answer', '')}"
        spec_task = AgentTask(
            task_id=str(uuid4()),
            task_type="compliance_check",
            project_id=project_id,
            query=spec_query,
            asset_tag=asset_tag,
            context=context,
        )
        spec_result = await self.agents["spec_compliance"].run(spec_task)

        return {"knowledge": knowledge_result, "spec_compliance": spec_result}

    async def _workflow_rfi_query(
        self, project_id, query, asset_tag, context
    ) -> dict[str, AgentResult]:
        """Single-agent knowledge query."""
        task = AgentTask(
            task_id=str(uuid4()),
            task_type="rfi_resolution",
            project_id=project_id,
            query=query,
            asset_tag=asset_tag,
        )
        result = await self.agents["knowledge"].run(task)
        return {"knowledge": result}

    async def _workflow_full_analysis(
        self, project_id, query, asset_tag, context
    ) -> dict[str, AgentResult]:
        """Full five-agent analysis with executive synthesis."""
        base_task = AgentTask(
            task_id=str(uuid4()),
            task_type="full_analysis",
            project_id=project_id,
            query=query,
            asset_tag=asset_tag,
            context=context,
        )

        tasks = [
            AgentTask(**{**vars(base_task), "task_id": str(uuid4()), "task_type": "impact_analysis"}),
            AgentTask(**{**vars(base_task), "task_id": str(uuid4()), "task_type": "compliance_check"}),
            AgentTask(**{**vars(base_task), "task_id": str(uuid4()), "task_type": "schedule_risk"}),
            AgentTask(**{**vars(base_task), "task_id": str(uuid4()), "task_type": "vendor_alternatives"}),
            AgentTask(**{**vars(base_task), "task_id": str(uuid4()), "task_type": "knowledge_query"}),
        ]

        eng_r, spec_r, sched_r, proc_r, know_r = await asyncio.gather(
            self.agents["engineering"].run(tasks[0]),
            self.agents["spec_compliance"].run(tasks[1]),
            self.agents["schedule_risk"].run(tasks[2]),
            self.agents["strategic_procurement"].run(tasks[3]),
            self.agents["knowledge"].run(tasks[4]),
        )

        exec_query = self._build_executive_summary_query(
            query, eng_r, spec_r, sched_r, proc_r, know_r
        )
        exec_task = AgentTask(
            task_id=str(uuid4()),
            task_type="executive_synthesis",
            project_id=project_id,
            query=exec_query,
            asset_tag=asset_tag,
        )
        exec_result = await self.agents["executive"].run(exec_task)

        return {
            "engineering": eng_r,
            "spec_compliance": spec_r,
            "schedule_risk": sched_r,
            "strategic_procurement": proc_r,
            "knowledge": know_r,
            "executive": exec_result,
        }

    # ─── Helpers ──────────────────────────────────────────────────────────────

    def _build_executive_summary_query(self, original_query: str, *agent_results) -> str:
        """Builds the executive agent's input from all specialist outputs."""
        parts = [f"ORIGINAL QUERY: {original_query}\n\nSPECIALIST AGENT OUTPUTS:"]
        for result in agent_results:
            if result and result.success:
                parts.append(f"\n[{result.agent_name.upper()}]")
                # Include key output fields, not the entire raw output
                output = result.output
                for key in ["change_summary", "compliance_status", "risk_summary",
                             "procurement_situation", "answer", "engineering_judgment",
                             "ncr_recommended", "schedule_impact_days", "recommended_action"]:
                    if key in output:
                        parts.append(f"  {key}: {output[key]}")
                parts.append(f"  confidence: {result.confidence}")
        return "\n".join(parts)

    def _serialize_result(self, result: AgentResult) -> dict:
        return {
            "agent": result.agent_name,
            "task_type": result.task_type,
            "success": result.success,
            "output": result.output,
            "confidence": result.confidence,
            "latency_ms": result.latency_ms,
            "error": result.error,
        }


# Singleton orchestrator instance
orchestrator = AgentOrchestrator()
