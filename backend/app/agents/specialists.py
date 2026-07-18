"""
SiteAI — Specialist Agents
Six domain agents, each with a narrow tool surface and precise system prompt.
All inherit BaseAgent and use GraphRAG + Claude for reasoning.
"""
import json
import re
from app.agents.base import BaseAgent, AgentTask
from app.core.logging import get_logger

logger = get_logger("agents")


def _parse_json_response(text: str) -> dict:
    """Safely parses JSON from an LLM response, stripping markdown fences."""
    cleaned = re.sub(r"```(?:json)?", "", text).replace("```", "").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Attempt to extract JSON object from mixed text
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except Exception:
                pass
    return {"raw_response": text}


# ─── 1. Engineering Agent ─────────────────────────────────────────────────────

class EngineeringAgent(BaseAgent):
    name = "engineering_agent"
    description = "Analyses engineering changes and their downstream dependencies"

    @property
    def system_prompt(self) -> str:
        return """You are the Engineering Intelligence Agent for SiteAI, an AI platform for Data Centre EPC projects.
Your role is to analyse engineering changes and determine their downstream technical consequences.

You reason over the Engineering Knowledge Graph (EKG) which contains asset nodes connected by typed dependency edges.
You understand electrical, mechanical, structural, and systems engineering principles for Tier III/IV data centres.

When analysing an engineering change, return a JSON response with this structure:
{
  "change_summary": "Brief description of the change being analysed",
  "affected_domains": ["electrical", "mechanical", "schedule", "procurement", "commissioning"],
  "primary_impacts": [
    {
      "asset_tag": "string",
      "asset_name": "string",
      "impact_type": "string",
      "severity": "critical|high|medium|low",
      "technical_reason": "specific engineering explanation",
      "action_required": "specific action to take",
      "source": "rule_engine|graph_traversal|engineering_judgment"
    }
  ],
  "cascading_risks": ["list of secondary risks that emerge from primary impacts"],
  "engineering_judgment": "overall technical assessment paragraph",
  "confidence": 0.0
}

Be specific and technical. Reference standards (TIA-942, IEC, IS codes) where applicable."""

    async def process_task(self, task: AgentTask, context: str) -> dict:
        message = self.build_user_message(task, context)
        response, tokens = await self.call_claude(message)
        result = _parse_json_response(response)
        result["tokens_used"] = tokens
        if "confidence" not in result:
            result["confidence"] = 0.87
        return result


# ─── 2. Specification Compliance Agent ───────────────────────────────────────

class SpecComplianceAgent(BaseAgent):
    name = "spec_compliance_agent"
    description = "Checks vendor submittals against project specifications and standards"

    @property
    def system_prompt(self) -> str:
        return """You are the Specification Compliance Agent for SiteAI.
Your role is to check vendor submittals against project specifications, TIA-942 Tier IV requirements,
and relevant IEC/IS standards. You detect non-conformances before they reach site.

For each compliance check, return a JSON response:
{
  "compliance_status": "compliant|non_conformance|watch_item|insufficient_data",
  "asset_tag": "string",
  "checks": [
    {
      "parameter": "string",
      "specified_value": "string",
      "submitted_value": "string",
      "deviation": "string (quantified)",
      "status": "pass|fail|watch",
      "standard_reference": "e.g. TIA-942 Section 4.2.1 or IEC 60076",
      "severity": "critical|major|minor"
    }
  ],
  "ncr_recommended": true/false,
  "ncr_classification": "critical|major|minor",
  "ncr_title": "string",
  "ncr_description": "string",
  "recommended_action": "specific, actionable resolution",
  "compliance_narrative": "engineering explanation of the non-conformance",
  "confidence": 0.0
}"""

    async def process_task(self, task: AgentTask, context: str) -> dict:
        message = self.build_user_message(task, context)
        response, tokens = await self.call_claude(message)
        result = _parse_json_response(response)
        result["tokens_used"] = tokens
        if "confidence" not in result:
            result["confidence"] = 0.92
        return result


# ─── 3. Schedule Risk Agent ───────────────────────────────────────────────────

class ScheduleRiskAgent(BaseAgent):
    name = "schedule_risk_agent"
    description = "Predicts schedule risks and generates recovery options"

    @property
    def system_prompt(self) -> str:
        return """You are the Schedule Risk Intelligence Agent for SiteAI.
You analyse EPC project schedules, procurement delays, and resource constraints to predict schedule risks
and generate quantified mitigation options. You understand critical path methodology.

Project baseline context: Mumbai HYP-1, 120 MW Tier IV, baseline completion 01 Nov 2026.

Return a JSON response:
{
  "risk_summary": "one-line risk assessment",
  "overall_risk_score": 0.0,
  "schedule_impact_days": 0,
  "critical_path_affected": true/false,
  "risks": [
    {
      "risk_id": "string",
      "description": "string",
      "probability": 0.0,
      "impact_days": 0,
      "affected_milestones": ["string"],
      "root_cause": "string",
      "risk_category": "procurement|resource|technical|external|regulatory"
    }
  ],
  "mitigation_options": [
    {
      "option_id": "string",
      "title": "string",
      "description": "string",
      "recovery_days": 0,
      "cost_impact_usd": 0,
      "feasibility": "high|medium|low",
      "implementation_steps": ["string"],
      "dependencies": ["string"]
    }
  ],
  "recommended_mitigation": "option_id of the best option",
  "schedule_forecast": {
    "baseline_completion": "string",
    "current_forecast": "string",
    "with_mitigation_forecast": "string"
  },
  "confidence": 0.0
}"""

    async def process_task(self, task: AgentTask, context: str) -> dict:
        message = self.build_user_message(task, context)
        response, tokens = await self.call_claude(message)
        result = _parse_json_response(response)
        result["tokens_used"] = tokens
        if "confidence" not in result:
            result["confidence"] = 0.81
        return result


# ─── 4. Strategic Procurement Agent ──────────────────────────────────────────

class StrategicProcurementAgent(BaseAgent):
    name = "strategic_procurement_agent"
    description = "Finds alternative vendors and produces ranked procurement recommendations"

    # Alternative vendor dataset (in production: live supplier database)
    VENDOR_DATABASE = {
        "ahu": [
            {"vendor": "Carrier India", "origin": "Pune, India", "lead_time_weeks": 6,
             "cost_premium_pct": 8, "compliance_rating": 0.94, "tier_iv_certified": True,
             "contact": "sales.india@carrier.com", "notes": "Stock available for standard 400 RT units"},
            {"vendor": "Johnson Controls India", "origin": "Mumbai, India", "lead_time_weeks": 8,
             "cost_premium_pct": 12, "compliance_rating": 0.96, "tier_iv_certified": True,
             "contact": "jci-india@jci.com", "notes": "Premium tier data centre specialist"},
            {"vendor": "Trane Technologies", "origin": "Singapore", "lead_time_weeks": 10,
             "cost_premium_pct": 5, "compliance_rating": 0.92, "tier_iv_certified": True,
             "contact": "apac.sales@trane.com", "notes": "Faster delivery vs original Daikin ETA"},
            {"vendor": "Blue Star India", "origin": "Chennai, India", "lead_time_weeks": 5,
             "cost_premium_pct": -3, "compliance_rating": 0.88, "tier_iv_certified": False,
             "contact": "projects@bluestar.in", "notes": "Cost saving but requires Tier IV compliance verification"},
        ],
        "cooling_tower": [
            {"vendor": "SPX Cooling Technologies India", "origin": "Pune, India", "lead_time_weeks": 8,
             "cost_premium_pct": 6, "compliance_rating": 0.91, "tier_iv_certified": True,
             "contact": "india@spxcooling.com", "notes": "Local assembly available"},
            {"vendor": "Paharpur Cooling Towers", "origin": "Kolkata, India", "lead_time_weeks": 10,
             "cost_premium_pct": -8, "compliance_rating": 0.87, "tier_iv_certified": False,
             "contact": "sales@paharpurcooling.com", "notes": "India's largest cooling tower manufacturer"},
            {"vendor": "Brentwood Industries", "origin": "Malaysia", "lead_time_weeks": 7,
             "cost_premium_pct": 3, "compliance_rating": 0.93, "tier_iv_certified": True,
             "contact": "apac@brentwoodindustries.com", "notes": "APAC regional stock"},
        ],
        "transformer": [
            {"vendor": "BHEL", "origin": "Bhopal, India", "lead_time_weeks": 14,
             "cost_premium_pct": -12, "compliance_rating": 0.89, "tier_iv_certified": False,
             "contact": "pem@bhel.in", "notes": "Government enterprise, long lead time"},
            {"vendor": "Siemens India", "origin": "Kalwa, India", "lead_time_weeks": 16,
             "cost_premium_pct": 18, "compliance_rating": 0.98, "tier_iv_certified": True,
             "contact": "energy.india@siemens.com", "notes": "Premium quality, longer lead time"},
            {"vendor": "CG Power", "origin": "Bhopal, India", "lead_time_weeks": 12,
             "cost_premium_pct": 4, "compliance_rating": 0.93, "tier_iv_certified": True,
             "contact": "transformers@cgglobal.com", "notes": "Competitive on quality and lead time"},
        ],
        "generator": [
            {"vendor": "Kirloskar Electric", "origin": "Bangalore, India", "lead_time_weeks": 6,
             "cost_premium_pct": -5, "compliance_rating": 0.90, "tier_iv_certified": True,
             "contact": "gensets@kirloskar.com", "notes": "Strong India market presence"},
            {"vendor": "Caterpillar India", "origin": "Hosur, India", "lead_time_weeks": 8,
             "cost_premium_pct": 15, "compliance_rating": 0.97, "tier_iv_certified": True,
             "contact": "cat-india@caterpillar.com", "notes": "Global standard, premium cost"},
            {"vendor": "Mahindra Powerol", "origin": "Pune, India", "lead_time_weeks": 4,
             "cost_premium_pct": -10, "compliance_rating": 0.86, "tier_iv_certified": False,
             "contact": "powerol@mahindra.com", "notes": "Fastest lead time, requires compliance check"},
        ],
    }

    @property
    def system_prompt(self) -> str:
        return """You are the Strategic Procurement Intelligence Agent for SiteAI.
When supplier delays are detected, you analyse alternative vendors and produce ranked procurement recommendations
with confidence scores, schedule recovery estimates, and cost-compliance trade-off analysis.

You have access to a vendor database with lead times, cost premiums, compliance ratings, and Tier IV certification status.

Return a JSON response:
{
  "procurement_situation": "summary of the delay and its impact",
  "original_supplier": {
    "vendor": "string", "delay_days": 0, "impact": "string"
  },
  "alternatives": [
    {
      "rank": 1,
      "vendor": "string",
      "origin": "string",
      "lead_time_weeks": 0,
      "delivery_date_estimate": "string",
      "cost_premium_pct": 0.0,
      "estimated_cost_usd": 0,
      "compliance_rating": 0.0,
      "tier_iv_certified": true/false,
      "schedule_recovery_days": 0,
      "strengths": ["string"],
      "risks": ["string"],
      "recommendation_score": 0.0,
      "contact": "string"
    }
  ],
  "recommended_action": "string",
  "decision_rationale": "string explaining the ranking logic",
  "procurement_strategy": "single_source|dual_source|split_order",
  "estimated_total_cost_impact_usd": 0,
  "confidence": 0.0
}

Rank alternatives by a weighted score: schedule recovery (40%) + compliance (35%) + cost (25%)."""

    async def process_task(self, task: AgentTask, context: str) -> dict:
        # Enrich context with vendor database
        asset_type = task.context.get("asset_type", "ahu")
        vendors = self.VENDOR_DATABASE.get(asset_type, [])
        vendor_context = f"\nAVAILABLE VENDOR DATABASE ({asset_type.upper()}):\n"
        for v in vendors:
            vendor_context += (
                f"- {v['vendor']} ({v['origin']}): "
                f"{v['lead_time_weeks']}wk lead time, "
                f"{'+' if v['cost_premium_pct'] >= 0 else ''}{v['cost_premium_pct']}% cost vs original, "
                f"compliance: {v['compliance_rating']}, "
                f"Tier IV certified: {v['tier_iv_certified']}, "
                f"notes: {v['notes']}\n"
            )

        enriched_context = context + vendor_context
        message = self.build_user_message(task, enriched_context)
        response, tokens = await self.call_claude(message, max_tokens=3000)
        result = _parse_json_response(response)
        result["tokens_used"] = tokens
        result["vendor_options_evaluated"] = len(vendors)
        if "confidence" not in result:
            result["confidence"] = 0.88
        return result


# ─── 5. Knowledge Agent ───────────────────────────────────────────────────────

class KnowledgeAgent(BaseAgent):
    name = "knowledge_agent"
    description = "Answers project queries with citations from indexed documents and graph"

    @property
    def system_prompt(self) -> str:
        return """You are the Project Knowledge Intelligence Agent for SiteAI.
You have access to indexed project documents (specifications, submittals, RFIs, commissioning procedures)
and the Engineering Knowledge Graph. You answer technical and contractual queries with precise citations.

When answering, always:
1. State the direct answer first
2. Cite the specific document, section, and clause
3. Note any open NCRs or risks related to the query
4. Flag similar historical precedents if relevant

Return a JSON response:
{
  "answer": "direct answer to the query",
  "citations": [
    {
      "document": "filename",
      "doc_type": "specification|submittal|rfi|commissioning",
      "section": "e.g. Section 3.2",
      "relevant_text": "the specific clause or text"
    }
  ],
  "related_ncrs": ["NCR-XXX"],
  "related_assets": ["asset_tag"],
  "similar_rfis": ["RFI-XXXX — brief description"],
  "open_items": ["any unresolved items related to this query"],
  "confidence": 0.0
}"""

    async def process_task(self, task: AgentTask, context: str) -> dict:
        message = self.build_user_message(task, context)
        response, tokens = await self.call_claude(message)
        result = _parse_json_response(response)
        result["tokens_used"] = tokens
        if "confidence" not in result:
            result["confidence"] = 0.90
        return result


# ─── 6. Executive Agent ───────────────────────────────────────────────────────

class ExecutiveAgent(BaseAgent):
    name = "executive_agent"
    description = "Synthesises multi-agent outputs into executive decisions and recommendations"

    @property
    def system_prompt(self) -> str:
        return """You are the Executive Intelligence Agent for SiteAI.
You receive the outputs of multiple specialist agents and synthesise them into an executive-level
decision brief — the kind that a Project Director, CTO, or Senior Client needs to make a high-stakes
decision quickly.

You understand that EPC data centre projects have zero tolerance for errors.
Your role is to cut through technical detail and produce a clear, prioritised decision recommendation.

Return a JSON response:
{
  "executive_summary": "2-3 sentence summary for a non-technical executive",
  "situation": "what is happening right now",
  "critical_decision_required": true/false,
  "decision_deadline": "string (e.g. 'Must decide by 30 Jun 2026')",
  "options": [
    {
      "option": "string",
      "schedule_impact": "string",
      "cost_impact": "string",
      "risk_level": "critical|high|medium|low",
      "recommendation": "recommended|viable|not_recommended"
    }
  ],
  "recommended_action": "single clear recommendation",
  "reasoning": "why this is the right call",
  "risks_if_no_action": "what happens if nothing is done",
  "kpis_at_stake": {
    "schedule_days_at_risk": 0,
    "cost_at_risk_usd": 0,
    "tier_certification_risk": true/false
  },
  "confidence": 0.0
}"""

    async def process_task(self, task: AgentTask, context: str) -> dict:
        message = self.build_user_message(task, context)
        response, tokens = await self.call_claude(message, max_tokens=2048)
        result = _parse_json_response(response)
        result["tokens_used"] = tokens
        if "confidence" not in result:
            result["confidence"] = 0.91
        return result
