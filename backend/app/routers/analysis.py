"""
SiteAI — Analysis Router
The core intelligence endpoint: takes a project event/query,
runs the full pipeline: KG → GraphRAG → Multi-Agent → Decision Intelligence.
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
import json

from app.core.auth import get_current_user, CurrentUser
from app.agents.orchestrator import orchestrator
from app.services.decision_intelligence import decision_intelligence_engine
from app.services.knowledge_graph import knowledge_graph_service
from app.core.logging import get_logger

logger = get_logger("router.analysis")
router = APIRouter(prefix="/api/analysis", tags=["analysis"])

DEFAULT_PROJECT_ID = "00000000-0000-0000-0000-000000000002"


class AnalysisRequest(BaseModel):
    query: str
    workflow_type: str = "engineering_change"  # or procurement_delay|spec_check|rfi_query|full_analysis
    asset_tag: Optional[str] = None
    asset_type: Optional[str] = None
    asset_parameters: Optional[dict] = None
    context: Optional[dict] = None


class ProcurementDelayRequest(BaseModel):
    asset_tag: str
    asset_type: str
    vendor: str
    delay_days: int
    required_by: str
    eta: str
    unit_cost: Optional[float] = None


@router.post("/run")
async def run_analysis(
    request: AnalysisRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Main intelligence pipeline endpoint.
    Routes through the appropriate multi-agent workflow
    and returns Decision Intelligence output.
    """
    project_id = current_user.project_id or DEFAULT_PROJECT_ID

    logger.info(
        "Analysis request received",
        workflow=request.workflow_type,
        asset=request.asset_tag,
        user=current_user.email,
    )

    # Run multi-agent workflow
    workflow_result = await orchestrator.run_workflow(
        workflow_type=request.workflow_type,
        project_id=project_id,
        query=request.query,
        asset_tag=request.asset_tag,
        context={
            **(request.context or {}),
            "asset_type": request.asset_type,
        },
    )

    # Run Decision Intelligence Engine if asset context provided
    die_result = None
    if request.asset_tag and request.asset_type and request.asset_parameters:
        die_result = await decision_intelligence_engine.process(
            project_id=project_id,
            asset_tag=request.asset_tag,
            asset_type=request.asset_type,
            asset_parameters=request.asset_parameters,
            agent_outputs=workflow_result.get("agent_results", {}),
        )

    return {
        "workflow": workflow_result,
        "decision_intelligence": die_result,
        "project_id": project_id,
    }


@router.post("/procurement-delay")
async def analyse_procurement_delay(
    request: ProcurementDelayRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Dedicated endpoint for supplier delay events.
    Triggers: StrategicProcurement + ScheduleRisk + Executive agents.
    """
    project_id = current_user.project_id or DEFAULT_PROJECT_ID

    query = (
        f"{request.asset_tag} ({request.asset_type}) from {request.vendor} "
        f"is delayed by {request.delay_days} days. "
        f"Required by: {request.required_by}. Current ETA: {request.eta}. "
        f"Find alternative vendors, compare lead times and costs, "
        f"estimate schedule recovery, and produce a ranked recommendation."
    )

    result = await orchestrator.run_workflow(
        workflow_type="procurement_delay",
        project_id=project_id,
        query=query,
        asset_tag=request.asset_tag,
        context={
            "asset_type": request.asset_type,
            "vendor": request.vendor,
            "delay_days": request.delay_days,
            "unit_cost": request.unit_cost,
        },
    )

    # Also compute ripple effect through the dependency graph
    ripple = await decision_intelligence_engine.ripple_engine.calculate(
        request.asset_tag, project_id
    )

    return {
        "procurement_analysis": result,
        "ripple_effect": {
            "schedule_days_at_risk": ripple.schedule_days_at_risk,
            "cost_at_risk_usd": ripple.cost_at_risk_usd,
            "certification_risk": ripple.certification_risk,
            "direct_impacts": ripple.direct_impacts,
        },
    }


@router.get("/downstream-impact/{asset_tag}")
async def get_downstream_impact(
    asset_tag: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Returns the dependency graph traversal for a given asset."""
    project_id = current_user.project_id or DEFAULT_PROJECT_ID
    return await knowledge_graph_service.get_downstream_impacts(asset_tag, project_id)


@router.get("/asset/{asset_tag}")
async def get_asset_context(
    asset_tag: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Returns an asset with its full graph context."""
    project_id = current_user.project_id or DEFAULT_PROJECT_ID
    result = await knowledge_graph_service.get_asset_with_context(asset_tag, project_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"Asset {asset_tag} not found")
    return result


@router.get("/delayed-assets")
async def get_delayed_assets(
    current_user: CurrentUser = Depends(get_current_user),
):
    """Returns all assets with confirmed procurement delays."""
    project_id = current_user.project_id or DEFAULT_PROJECT_ID
    return await knowledge_graph_service.get_all_delayed_assets(project_id)
