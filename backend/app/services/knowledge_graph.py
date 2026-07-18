"""
SiteAI — Engineering Knowledge Graph Service
Implements the EKG ontology from Sprint 1 Section 7.
Node types: Asset, Specification, Submittal, ScheduleActivity,
            ProcurementItem, TestProcedure, NCR, Contractor
Relationship types: DEPENDS_ON, IMPACTS, SPECIFIED_BY, SUBMITTED_AGAINST,
                    SCHEDULED_AS, PROCURED_VIA, TESTED_BY, FLAGGED_IN

CRITICAL DESIGN: deterministic edges (from engineering rules) are
distinguished from inferred edges (from LLM extraction) via `source` property.
"""
from typing import Optional
from uuid import uuid4

from app.db.connections import neo4j_session
from app.core.logging import get_logger

logger = get_logger("knowledge_graph")


# ─── Graph Seed: Engineering Ontology for Mumbai HYP-1 ───────────────────────

SEED_ASSETS = [
    # Power infrastructure
    {"asset_tag": "T-1A", "asset_type": "transformer", "name": "Main Utility Transformer 1A",
     "rating": "50 MVA", "voltage": "11kV/415V", "cooling": "ONAN", "impedance": 6.0},
    {"asset_tag": "T-2B", "asset_type": "transformer", "name": "Main Utility Transformer 2B",
     "rating": "50 MVA", "voltage": "11kV/415V", "cooling": "ONAN", "impedance": 5.2,
     "ncr": "NCR-187", "deviation": "ONAN rating 98% of spec"},
    {"asset_tag": "SW-B1", "asset_type": "switchgear", "name": "HV Switchgear Panel B1",
     "rating": "40 kA", "voltage": "11kV", "ncr": "NCR-181",
     "deviation": "Short-circuit rating 31.5 kA vs 40 kA spec"},
    {"asset_tag": "SW-B2", "asset_type": "switchgear", "name": "HV Switchgear Panel B2",
     "rating": "40 kA", "voltage": "11kV"},
    {"asset_tag": "G-1", "asset_type": "generator", "name": "Backup Generator 1",
     "rating": "2000 kVA", "voltage": "415V", "fuel": "diesel"},
    {"asset_tag": "G-2", "asset_type": "generator", "name": "Backup Generator 2",
     "rating": "2000 kVA", "voltage": "415V", "fuel": "diesel"},
    {"asset_tag": "G-3", "asset_type": "generator", "name": "Backup Generator 3",
     "rating": "2000 kVA", "voltage": "415V", "fuel": "diesel"},
    {"asset_tag": "G-4", "asset_type": "generator", "name": "Backup Generator 4",
     "rating": "2000 kVA", "voltage": "415V", "fuel": "diesel",
     "procurement_delay": 3},
    {"asset_tag": "UPS-A3", "asset_type": "ups", "name": "UPS System A3",
     "rating": "500 kVA", "autonomy_min": 7.5, "battery_type": "VRLA",
     "ncr": "NCR-184", "deviation": "Autonomy 7.5 min vs 10 min spec"},
    {"asset_tag": "UPS-A4", "asset_type": "ups", "name": "UPS System A4",
     "rating": "500 kVA", "autonomy_min": 10.0, "battery_type": "VRLA"},
    # Cooling infrastructure
    {"asset_tag": "CH-1", "asset_type": "chiller", "name": "Chiller Unit 1",
     "rating": "800 RT", "cop": 5.9, "refrigerant": "R134a"},
    {"asset_tag": "CH-2", "asset_type": "chiller", "name": "Chiller Unit 2",
     "rating": "800 RT", "cop": 5.8, "refrigerant": "R134a", "iplv": 7.2},
    {"asset_tag": "AHU-C12", "asset_type": "ahu", "name": "Air Handling Unit C12",
     "capacity_rt": 400, "procurement_delay": 18,
     "eta": "2026-07-22", "required_by": "2026-07-04"},
    {"asset_tag": "CT-3", "asset_type": "cooling_tower", "name": "Cooling Tower 3",
     "capacity_rt": 2400, "procurement_delay": 11,
     "eta": "2026-08-12", "required_by": "2026-08-01"},
]

# Engineering dependency rules — source: rule_engine (deterministic)
ENGINEERING_DEPENDENCIES = [
    # Transformer T-2B is the upstream node; switchgear depends on it
    ("T-2B", "DEPENDS_ON", "SW-B1", "electrical", "high",
     "Switchgear fault-rating must match or exceed transformer fault contribution", "rule_engine"),
    ("T-2B", "DEPENDS_ON", "SW-B2", "electrical", "high",
     "Switchgear fault-rating must match transformer fault contribution", "rule_engine"),
    # Switchgear feeds UPS busbar
    ("SW-B1", "DEPENDS_ON", "UPS-A3", "electrical", "high",
     "UPS input supply from switchgear panel B1", "rule_engine"),
    ("SW-B2", "DEPENDS_ON", "UPS-A4", "electrical", "high",
     "UPS input supply from switchgear panel B2", "rule_engine"),
    # Generators feed switchgear on utility failure
    ("G-1", "DEPENDS_ON", "SW-B1", "electrical", "high",
     "Generator G-1 feeds switchgear B1 via ATS on utility failure", "rule_engine"),
    ("G-2", "DEPENDS_ON", "SW-B1", "electrical", "high",
     "Generator G-2 parallel feed to switchgear B1", "rule_engine"),
    ("G-3", "DEPENDS_ON", "SW-B2", "electrical", "high",
     "Generator G-3 feeds switchgear B2 via ATS", "rule_engine"),
    ("G-4", "DEPENDS_ON", "SW-B2", "electrical", "high",
     "Generator G-4 parallel feed to switchgear B2", "rule_engine"),
    # Cooling dependencies
    ("AHU-C12", "DEPENDS_ON", "CH-1", "mechanical", "high",
     "AHU-C12 chilled water supply from chiller plant CH-1", "rule_engine"),
    ("AHU-C12", "DEPENDS_ON", "CT-3", "mechanical", "medium",
     "Cooling tower CT-3 serves condenser water loop for CH-1/CH-2", "rule_engine"),
    # Impact propagation (what a change IMPACTS downstream)
    ("T-2B", "IMPACTS", "SW-B1", "electrical", "critical",
     "T-2B rating change directly impacts SW-B1 fault-current rating requirement", "rule_engine"),
    ("T-2B", "IMPACTS", "SW-B2", "electrical", "critical",
     "T-2B rating change impacts SW-B2 fault-current rating", "rule_engine"),
    ("AHU-C12", "IMPACTS", "CH-1", "schedule", "high",
     "AHU-C12 commissioning prerequisite for chiller integrated testing", "rule_engine"),
    ("G-4", "IMPACTS", "SW-B2", "schedule", "medium",
     "G-4 delivery delay affects full N+1 generator commissioning for B2 bus", "rule_engine"),
]

PROCUREMENT_DATA = [
    {"asset_tag": "AHU-C12", "vendor": "Daikin Applied", "origin": "Singapore",
     "required_by": "2026-07-04", "eta": "2026-07-22", "delay_days": 18,
     "status": "at_risk", "unit_cost": 280000},
    {"asset_tag": "G-4", "vendor": "Cummins India", "origin": "Pune",
     "required_by": "2026-07-15", "eta": "2026-07-18", "delay_days": 3,
     "status": "minor_delay", "unit_cost": 450000},
    {"asset_tag": "SW-B2", "vendor": "ABB India", "origin": "Vadodara",
     "required_by": "2026-07-10", "eta": "2026-07-09", "delay_days": 0,
     "status": "on_track", "unit_cost": 320000},
    {"asset_tag": "UPS-A4", "vendor": "EnerSys", "origin": "Chennai",
     "required_by": "2026-07-20", "eta": "2026-07-20", "delay_days": 0,
     "status": "on_track", "unit_cost": 195000},
    {"asset_tag": "CT-3", "vendor": "EVAPCO", "origin": "Baltimore, USA",
     "required_by": "2026-08-01", "eta": "2026-08-12", "delay_days": 11,
     "status": "watch", "unit_cost": 520000},
]


# ─── Graph Service ─────────────────────────────────────────────────────────────

class KnowledgeGraphService:
    """
    All graph operations for the EKG.
    Designed as a service class — later becomes an independent graphrag-service.
    """

    async def seed_project_graph(self, project_id: str) -> dict:
        """
        Seeds the knowledge graph with the Mumbai HYP-1 engineering ontology.
        Idempotent — safe to run multiple times.
        """
        async with neo4j_session() as session:
            # Create project node
            await session.run(
                """
                MERGE (p:Project {project_id: $project_id})
                SET p.name = 'Mumbai HYP-1',
                    p.capacity_mw = 120,
                    p.tier = 'IV',
                    p.updated_at = datetime()
                """,
                project_id=project_id,
            )

            # Create asset nodes
            for asset in SEED_ASSETS:
                await session.run(
                    """
                    MERGE (a:Asset {asset_tag: $tag, project_id: $project_id})
                    SET a.asset_type = $asset_type,
                        a.name = $name,
                        a.properties = $props,
                        a.updated_at = datetime()
                    WITH a
                    MATCH (p:Project {project_id: $project_id})
                    MERGE (p)-[:HAS_ASSET]->(a)
                    """,
                    tag=asset["asset_tag"],
                    project_id=project_id,
                    asset_type=asset["asset_type"],
                    name=asset["name"],
                    props=str({k: v for k, v in asset.items()
                               if k not in ("asset_tag", "asset_type", "name")}),
                )

            # Create engineering dependency edges
            for from_tag, rel_type, to_tag, domain, severity, reason, source in ENGINEERING_DEPENDENCIES:
                await session.run(
                    f"""
                    MATCH (a:Asset {{asset_tag: $from_tag, project_id: $project_id}})
                    MATCH (b:Asset {{asset_tag: $to_tag, project_id: $project_id}})
                    MERGE (a)-[r:{rel_type} {{domain: $domain}}]->(b)
                    SET r.severity = $severity,
                        r.reason = $reason,
                        r.source = $source,
                        r.confidence = CASE WHEN $source = 'rule_engine' THEN 1.0 ELSE 0.85 END
                    """,
                    from_tag=from_tag,
                    to_tag=to_tag,
                    project_id=project_id,
                    domain=domain,
                    severity=severity,
                    reason=reason,
                    source=source,
                )

            # Create procurement nodes
            for proc in PROCUREMENT_DATA:
                await session.run(
                    """
                    MERGE (proc:ProcurementItem {asset_tag: $tag, project_id: $project_id})
                    SET proc.vendor = $vendor,
                        proc.origin = $origin,
                        proc.required_by = $required_by,
                        proc.eta = $eta,
                        proc.delay_days = $delay_days,
                        proc.status = $status,
                        proc.unit_cost = $unit_cost
                    WITH proc
                    MATCH (a:Asset {asset_tag: $tag, project_id: $project_id})
                    MERGE (a)-[:PROCURED_VIA]->(proc)
                    """,
                    tag=proc["asset_tag"],
                    project_id=project_id,
                    vendor=proc["vendor"],
                    origin=proc["origin"],
                    required_by=proc["required_by"],
                    eta=proc["eta"],
                    delay_days=proc["delay_days"],
                    status=proc["status"],
                    unit_cost=proc["unit_cost"],
                )

        logger.info("Knowledge graph seeded", project_id=project_id,
                    assets=len(SEED_ASSETS), dependencies=len(ENGINEERING_DEPENDENCIES))
        return {"assets": len(SEED_ASSETS), "dependencies": len(ENGINEERING_DEPENDENCIES)}

    async def get_downstream_impacts(
        self, asset_tag: str, project_id: str, max_hops: int = 4
    ) -> dict:
        """
        Core graph traversal: given an asset, find everything downstream
        that is impacted. This is the 'transformer change → ripple effect' query.
        Returns structured impact data per domain.
        """
        async with neo4j_session() as session:
            result = await session.run(
                """
                MATCH (start:Asset {asset_tag: $asset_tag, project_id: $project_id})
                CALL apoc.path.subgraphAll(start, {
                    relationshipFilter: "IMPACTS>|DEPENDS_ON>",
                    maxLevel: $max_hops
                })
                YIELD nodes, relationships
                RETURN
                    [n IN nodes | {
                        tag: n.asset_tag,
                        type: n.asset_type,
                        name: n.name
                    }] AS impacted_nodes,
                    [r IN relationships | {
                        from: startNode(r).asset_tag,
                        to: endNode(r).asset_tag,
                        type: type(r),
                        domain: r.domain,
                        severity: r.severity,
                        reason: r.reason,
                        source: r.source
                    }] AS impact_edges
                """,
                asset_tag=asset_tag,
                project_id=project_id,
                max_hops=max_hops,
            )

            record = await result.single()
            if not record:
                return {"impacted_nodes": [], "impact_edges": [], "domains": {}}

            nodes = record["impacted_nodes"] or []
            edges = record["impact_edges"] or []

            # Group by domain
            domains = {}
            for edge in edges:
                domain = edge.get("domain", "unknown")
                if domain not in domains:
                    domains[domain] = []
                domains[domain].append(edge)

            return {
                "source_asset": asset_tag,
                "impacted_nodes": nodes,
                "impact_edges": edges,
                "domains": domains,
                "total_impacted": len(nodes) - 1,  # exclude source
            }

    async def get_asset_with_context(self, asset_tag: str, project_id: str) -> Optional[dict]:
        """
        Returns an asset node with its immediate neighbors — procurement,
        specs, NCRs, schedule activities.
        """
        async with neo4j_session() as session:
            result = await session.run(
                """
                MATCH (a:Asset {asset_tag: $asset_tag, project_id: $project_id})
                OPTIONAL MATCH (a)-[:PROCURED_VIA]->(proc:ProcurementItem)
                OPTIONAL MATCH (a)-[:FLAGGED_IN]->(ncr:NCR)
                OPTIONAL MATCH (a)-[dep:DEPENDS_ON|IMPACTS]->(downstream:Asset)
                OPTIONAL MATCH (upstream:Asset)-[dep2:DEPENDS_ON|IMPACTS]->(a)
                RETURN a,
                       collect(DISTINCT proc) AS procurement,
                       collect(DISTINCT ncr) AS ncrs,
                       collect(DISTINCT {tag: downstream.asset_tag, rel: type(dep), domain: dep.domain}) AS downstream_deps,
                       collect(DISTINCT {tag: upstream.asset_tag, rel: type(dep2), domain: dep2.domain}) AS upstream_deps
                """,
                asset_tag=asset_tag,
                project_id=project_id,
            )
            record = await result.single()
            if not record:
                return None

            asset = dict(record["a"])
            return {
                "asset": asset,
                "procurement": [dict(p) for p in record["procurement"] if p],
                "ncrs": [dict(n) for n in record["ncrs"] if n],
                "downstream_dependencies": record["downstream_deps"],
                "upstream_dependencies": record["upstream_deps"],
            }

    async def get_all_delayed_assets(self, project_id: str) -> list:
        """Returns all assets with confirmed procurement delays."""
        async with neo4j_session() as session:
            result = await session.run(
                """
                MATCH (a:Asset {project_id: $project_id})-[:PROCURED_VIA]->(proc:ProcurementItem)
                WHERE proc.delay_days > 0
                RETURN a.asset_tag AS tag, a.asset_type AS type, a.name AS name,
                       proc.vendor AS vendor, proc.delay_days AS delay_days,
                       proc.eta AS eta, proc.required_by AS required_by,
                       proc.status AS status, proc.unit_cost AS unit_cost
                ORDER BY proc.delay_days DESC
                """,
                project_id=project_id,
            )
            records = await result.data()
            return records

    async def get_project_graph_summary(self, project_id: str) -> dict:
        """High-level graph statistics for the dashboard."""
        async with neo4j_session() as session:
            result = await session.run(
                """
                MATCH (a:Asset {project_id: $project_id})
                WITH count(a) AS total_assets
                MATCH ()-[r]->() WHERE r.project_id IS NULL OR true
                WITH total_assets
                MATCH (proc:ProcurementItem {project_id: $project_id})
                WITH total_assets, count(proc) AS total_procurement,
                     count(CASE WHEN proc.delay_days > 0 THEN 1 END) AS delayed_items
                RETURN total_assets, total_procurement, delayed_items
                """,
                project_id=project_id,
            )
            record = await result.single()
            if not record:
                return {"total_assets": 0, "total_procurement": 0, "delayed_items": 0}
            return dict(record)

    async def add_ncr_node(
        self,
        asset_tag: str,
        project_id: str,
        ncr_number: str,
        description: str,
        severity: str,
    ) -> str:
        """Creates an NCR node and links it to the affected asset."""
        async with neo4j_session() as session:
            await session.run(
                """
                MERGE (ncr:NCR {ncr_number: $ncr_number, project_id: $project_id})
                SET ncr.description = $description,
                    ncr.severity = $severity,
                    ncr.status = 'open',
                    ncr.created_at = datetime()
                WITH ncr
                MATCH (a:Asset {asset_tag: $asset_tag, project_id: $project_id})
                MERGE (a)-[:FLAGGED_IN]->(ncr)
                """,
                ncr_number=ncr_number,
                project_id=project_id,
                description=description,
                severity=severity,
                asset_tag=asset_tag,
            )
        return ncr_number


knowledge_graph_service = KnowledgeGraphService()
