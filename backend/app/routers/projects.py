from fastapi import APIRouter, Depends
from app.core.auth import get_current_user, CurrentUser
from app.services.knowledge_graph import knowledge_graph_service, SEED_ASSETS, PROCUREMENT_DATA
from app.core.logging import get_logger

logger = get_logger("router.projects")
router = APIRouter(prefix="/api/projects", tags=["projects"])

DEFAULT_PROJECT_ID = "00000000-0000-0000-0000-000000000002"

DEMO_PROJECT = {
    "id": DEFAULT_PROJECT_ID,
    "name": "Mumbai HYP-1",
    "description": "120 MW Hyperscale Data Centre — Phase 2",
    "location": "Mumbai, Maharashtra, India",
    "capacity_mw": 120,
    "tier": "IV",
    "status": "active",
    "baseline_completion": "2026-11-01",
    "forecast_completion": "2026-11-28",
    "schedule_delay_days": 27,
    "open_ncrs": 23,
    "critical_ncrs": 8,
    "procurement_pct": 74,
    "cx_coverage_pct": 38,
    "risk_score": 7.8,
}

@router.get("/")
async def list_projects(current_user: CurrentUser = Depends(get_current_user)):
    return {"projects": [DEMO_PROJECT]}

@router.get("/current")
async def get_current_project(current_user: CurrentUser = Depends(get_current_user)):
    return DEMO_PROJECT

@router.get("/current/assets")
async def get_assets(current_user: CurrentUser = Depends(get_current_user)):
    return {"assets": SEED_ASSETS}

@router.get("/current/procurement")
async def get_procurement(current_user: CurrentUser = Depends(get_current_user)):
    return {"items": PROCUREMENT_DATA}

@router.get("/current/ncrs")
async def get_ncrs(current_user: CurrentUser = Depends(get_current_user)):
    ncrs = [
        {"ncr_number": "NCR-187", "asset_tag": "T-2B", "title": "Transformer T-2B ONAN rating 98% of spec",
         "severity": "critical", "status": "open", "detected_by": "ai"},
        {"ncr_number": "NCR-184", "asset_tag": "UPS-A3", "title": "UPS autonomy 7.5 min vs 10 min spec",
         "severity": "critical", "status": "open", "detected_by": "ai"},
        {"ncr_number": "NCR-181", "asset_tag": "SW-B1", "title": "Switchgear fault rating 31.5 kA vs 40 kA",
         "severity": "critical", "status": "escalated", "detected_by": "ai"},
        {"ncr_number": "NCR-178", "asset_tag": "CH-2", "title": "Chiller IPLV 7.2 vs 7.8 specified",
         "severity": "minor", "status": "closed", "detected_by": "ai"},
        {"ncr_number": "NCR-175", "asset_tag": "G-1", "title": "Generator fuel consumption 8% above spec",
         "severity": "minor", "status": "closed", "detected_by": "ai"},
    ]
    return {"ncrs": ncrs}

@router.get("/current/dashboard-stats")
async def get_dashboard_stats(current_user: CurrentUser = Depends(get_current_user)):
    try:
        graph_summary = await knowledge_graph_service.get_project_graph_summary(DEFAULT_PROJECT_ID)
        delayed = await knowledge_graph_service.get_all_delayed_assets(DEFAULT_PROJECT_ID)
    except Exception:
        graph_summary = {"total_assets": len(SEED_ASSETS), "delayed_items": 2}
        delayed = [p for p in PROCUREMENT_DATA if p.get("delay_days", 0) > 0]

    return {
        "schedule": {"baseline": "2026-11-01", "forecast": "2026-11-28", "delay_days": 27},
        "ncrs": {"total": 23, "critical": 8, "major": 0, "minor": 15},
        "procurement": {"total_items": 15200, "procured": 11240, "pct": 74, "delayed": len(delayed)},
        "commissioning": {"total_tests": 4820, "completed": 1840, "passed": 1680, "failed": 12, "pct": 38},
        "risk_score": 7.8,
        "graph": graph_summary,
        "delayed_assets": delayed,
        "alerts": [
            {"severity": "critical", "title": "Transformer T-2B: Spec deviation NCR-187", "category": "compliance"},
            {"severity": "critical", "title": "AHU-C12: 18-day delivery delay — critical path", "category": "procurement"},
            {"severity": "high", "title": "RFI-0445: Cable tray conflict unresolved 14 days", "category": "coordination"},
            {"severity": "high", "title": "Generator fuel system: Cx pre-check failed", "category": "commissioning"},
        ],
    }

@router.post("/current/seed")
async def seed_project(current_user: CurrentUser = Depends(get_current_user)):
    """Manually re-seed demo data."""
    from app.services.graphrag import seed_vector_index
    kg_result = await knowledge_graph_service.seed_project_graph(DEFAULT_PROJECT_ID)
    vec_result = await seed_vector_index(DEFAULT_PROJECT_ID)
    return {"knowledge_graph": kg_result, "vector_index": {"chunks": vec_result}}
