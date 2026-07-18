"use client";
import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import {
  Card, CardHeader, CardTitle, CardContent,
  Badge, Button, Spinner, ConfidenceRing, Progress, SectionHeader,
} from "@/components/ui/index";
import { Zap, ChevronRight } from "lucide-react";

const WORKFLOWS = [
  { id:"engineering_change",  icon:"⚡", label:"Engineering Change",   desc:"Trace downstream impact of an asset change through the full dependency graph",
    asset_tag:"T-2B",  asset_type:"transformer",  asset_parameters:{cooling_capacity_pct:98, impedance_pct:5.2},
    query:"Analyse the downstream impact of Transformer T-2B having an ONAN cooling rating at 98% of specification. What are the electrical, procurement, schedule and commissioning consequences?" },
  { id:"procurement_delay",   icon:"🚚", label:"Procurement Delay",    desc:"Find alternative vendors, compare costs and lead times, produce ranked recommendations",
    asset_tag:"AHU-C12", asset_type:"ahu", asset_parameters:{},
    query:"AHU-C12 from Daikin Applied Singapore is delayed 18 days. Find alternatives, compare costs and lead times, estimate schedule recovery." },
  { id:"spec_check",          icon:"📋", label:"Spec Compliance Check", desc:"Check a vendor submittal against project specifications and TIA-942 Tier IV",
    asset_tag:"SW-B1", asset_type:"switchgear", asset_parameters:{fault_current_ka:31.5},
    query:"Check HV Switchgear SW-B1 submittal. Short-circuit rating submitted: 31.5 kA. Required by specification: 40 kA. Is this a non-conformance?" },
  { id:"full_analysis",       icon:"🧠", label:"Full Intelligence",    desc:"All six agents in parallel — complete project risk, compliance, procurement and schedule analysis",
    asset_tag:"T-2B", asset_type:"transformer", asset_parameters:{cooling_capacity_pct:98},
    query:"Run a full project intelligence analysis. What are the top risks across engineering, procurement, schedule and compliance requiring immediate executive attention?" },
];

const PIPELINE = ["Engineering Change","Knowledge Graph","GraphRAG Retrieval","Multi-Agent Reasoning","Decision Intelligence","Executive Recommendation"];

export default function AnalysisPage() {
  const [selected, setSelected] = useState(WORKFLOWS[0]);
  const [customQuery, setCustomQuery] = useState("");
  const [result, setResult]     = useState<any>(null);
  const [loading, setLoading]   = useState(false);
  const [activeStep, setActiveStep] = useState(-1);

  const run = useCallback(async () => {
    setLoading(true);
    setResult(null);
    setActiveStep(0);

    // Animate pipeline steps
    const steps = PIPELINE.length;
    for (let i = 0; i < steps - 1; i++) {
      await new Promise(r => setTimeout(r, 800));
      setActiveStep(i + 1);
    }

    try {
      const query = customQuery.trim() || selected.query;
      let r;
      if (selected.id === "procurement_delay") {
        r = await api.procurementDelay({ asset_tag:"AHU-C12", asset_type:"ahu", vendor:"Daikin Applied", delay_days:18, required_by:"2026-07-04", eta:"2026-07-22", unit_cost:280000 });
      } else {
        r = await api.runAnalysis({ query, workflow_type:selected.id, asset_tag:selected.asset_tag, asset_type:selected.asset_type, asset_parameters:selected.asset_parameters });
      }
      setResult(r);
    } catch (e: any) {
      setResult({ error: e.message });
    } finally {
      setLoading(false);
      setActiveStep(PIPELINE.length - 1);
    }
  }, [selected, customQuery]);

  const agentResults = result?.workflow?.agent_results || result?.procurement_analysis?.workflow?.agent_results;
  const execDecision = result?.workflow?.executive_decision || result?.procurement_analysis?.workflow?.executive_decision;
  const meta         = result?.workflow?.metadata || result?.procurement_analysis?.workflow?.metadata;
  const ripple       = result?.ripple_effect;

  return (
    <div className="p-6 max-w-[1400px]">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-text mb-1">AI Analysis Engine</h1>
        <p className="text-sm text-muted">Multi-agent reasoning · Knowledge Graph · GraphRAG · Decision Intelligence</p>
      </div>

      {/* Pipeline */}
      <Card className="mb-6 p-4">
        <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-3">Intelligence Pipeline</div>
        <div className="flex items-center gap-1 flex-wrap">
          {PIPELINE.map((step, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all duration-500 ${
                activeStep >= i
                  ? "bg-accent/15 border-accent/40 text-accent shadow-glow-accent"
                  : "bg-surface2 border-border text-muted"
              }`}>
                {activeStep === i && loading && <span className="mr-1">⟳</span>}
                {activeStep > i && <span className="mr-1">✓</span>}
                {step}
              </div>
              {i < PIPELINE.length - 1 && <ChevronRight size={12} className="text-muted flex-shrink-0" />}
            </div>
          ))}
        </div>
      </Card>

      {/* Workflow Selector */}
      <Card className="mb-6">
        <CardHeader><CardTitle>Select Workflow</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            {WORKFLOWS.map(wf => (
              <button key={wf.id} onClick={() => { setSelected(wf); setCustomQuery(""); setResult(null); setActiveStep(-1); }}
                className={`p-4 rounded-xl border text-left transition-all duration-200 hover:scale-[1.02] ${
                  selected.id === wf.id
                    ? "bg-accent/10 border-accent/40 shadow-glow-accent"
                    : "bg-surface2 border-border hover:border-border2 hover:bg-surface3"
                }`}>
                <div className="text-2xl mb-2">{wf.icon}</div>
                <div className={`text-xs font-bold mb-1 ${selected.id === wf.id ? "text-accent" : "text-text"}`}>{wf.label}</div>
                <div className="text-[11px] text-muted leading-relaxed">{wf.desc}</div>
              </button>
            ))}
          </div>

          <div className="mb-4">
            <div className="text-xs text-muted font-semibold mb-2">Query <span className="text-border2">(editable)</span></div>
            <textarea
              value={customQuery || selected.query}
              onChange={e => setCustomQuery(e.target.value)}
              rows={3}
              className="w-full bg-surface2 border border-border2 rounded-lg text-text text-xs px-4 py-3 resize-none outline-none focus:border-accent/50 transition-colors font-mono"
            />
          </div>

          <Button variant="primary" size="lg" onClick={run} disabled={loading} className="w-full sm:w-auto">
            {loading ? <><Spinner size="sm" />Running {selected.label}…</> : <><Zap size={14} />Run {selected.label} →</>}
          </Button>
        </CardContent>
      </Card>

      {/* Error */}
      {result?.error && (
        <Card className="mb-5 border-danger/30 bg-danger/5 p-5">
          <div className="text-danger font-semibold text-sm mb-1">Analysis failed</div>
          <div className="text-muted text-xs">{result.error}</div>
          <div className="text-muted text-xs mt-2">Is the backend running? → <a href="http://localhost:8000/health" target="_blank" className="text-accent">localhost:8000/health</a></div>
        </Card>
      )}

      {/* Executive Decision */}
      {execDecision?.output && (() => {
        const o = execDecision.output;
        return (
          <Card glow="accent" className="mb-5">
            <CardHeader>
              <CardTitle className="text-base">🎯 Executive Decision</CardTitle>
              <div className="flex items-center gap-3">
                <ConfidenceRing value={execDecision.confidence || 0.9} size={52} />
                {o.critical_decision_required && <Badge variant="critical">Decision Required</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              {o.executive_summary && (
                <p className="text-sm text-dim leading-relaxed mb-4">{o.executive_summary}</p>
              )}
              {o.recommended_action && (
                <div className="p-4 rounded-lg bg-accent/5 border border-accent/20 mb-4">
                  <div className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1.5">Recommended Action</div>
                  <div className="text-sm text-accent font-semibold">{o.recommended_action}</div>
                  {o.reasoning && <div className="text-xs text-dim mt-2 leading-relaxed">{o.reasoning}</div>}
                </div>
              )}
              {o.kpis_at_stake && (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label:"Schedule at risk", val:`${o.kpis_at_stake.schedule_days_at_risk || 0}d`, color:"text-danger" },
                    { label:"Cost at risk",     val:`$${((o.kpis_at_stake.cost_at_risk_usd||0)/1e6).toFixed(1)}M`, color:"text-warning" },
                    { label:"Tier IV cert risk",val: o.kpis_at_stake.tier_certification_risk ? "⚠ YES" : "✓ NO", color: o.kpis_at_stake.tier_certification_risk ? "text-danger" : "text-success" },
                  ].map((k,i) => (
                    <div key={i} className="p-3 rounded-lg bg-surface2 border border-border text-center">
                      <div className={`text-xl font-black ${k.color}`}>{k.val}</div>
                      <div className="text-[10px] text-muted mt-1">{k.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* Agent Results */}
      {agentResults && (
        <div className="mb-5">
          <SectionHeader title="Agent Results" subtitle={`${Object.keys(agentResults).length} agents completed`} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(agentResults).filter(([k]) => k !== "executive").map(([key, val]: [string, any]) => (
              <Card key={key}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Badge variant="accent" className="capitalize">{key.replace(/_/g," ")}</Badge>
                    <Badge variant={val.success ? "success" : "danger"}>{val.success ? "✓" : "✗"}</Badge>
                  </div>
                  <ConfidenceRing value={val.confidence || 0} size={40} />
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted mb-2">{val.latency_ms}ms · {val.output?.tokens_used || 0} tokens</div>
                  <div className="text-xs text-dim leading-relaxed">
                    {val.output?.change_summary || val.output?.compliance_status || val.output?.risk_summary || val.output?.procurement_situation || val.output?.answer || "Analysis complete"}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Ripple Effect */}
      {ripple && (
        <Card className="mb-5">
          <CardHeader><CardTitle>💥 Ripple Effect — Engineering Impact</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="p-4 rounded-lg bg-surface2 border border-border text-center">
                <div className="text-2xl font-black text-danger">{ripple.schedule_days_at_risk}d</div>
                <div className="text-xs text-muted mt-1">Schedule days at risk</div>
              </div>
              <div className="p-4 rounded-lg bg-surface2 border border-border text-center">
                <div className="text-2xl font-black text-warning">${(ripple.cost_at_risk_usd/1e3).toFixed(0)}K</div>
                <div className="text-xs text-muted mt-1">Cost at risk</div>
              </div>
              <div className="p-4 rounded-lg bg-surface2 border border-border text-center">
                <div className={`text-2xl font-black ${ripple.certification_risk ? "text-danger" : "text-success"}`}>
                  {ripple.certification_risk ? "⚠" : "✓"}
                </div>
                <div className="text-xs text-muted mt-1">Tier IV cert risk</div>
              </div>
            </div>
            <div className="space-y-2">
              {ripple.direct_impacts?.slice(0,4).map((imp: any, i: number) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-surface2 border border-border">
                  <Badge variant={imp.severity === "critical" ? "critical" : imp.severity === "high" ? "warning" : "accent"} className="flex-shrink-0">{imp.severity}</Badge>
                  <div className="text-xs text-dim leading-relaxed"><span className="text-text font-semibold">{imp.asset}</span>: {imp.reason}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Run Metadata */}
      {meta && (
        <Card className="p-4">
          <div className="flex flex-wrap gap-5 text-xs text-muted">
            <span>⏱ <span className="text-text font-semibold">{meta.total_latency_ms}ms</span> total</span>
            <span>🔤 <span className="text-text font-semibold">{meta.total_tokens}</span> tokens</span>
            <span>🤖 <span className="text-text font-semibold">{meta.agents_invoked?.length}</span> agents</span>
            <span>{meta.success ? "✅" : "⚠️"} {meta.success ? "All agents succeeded" : "Partial failure"}</span>
          </div>
        </Card>
      )}
    </div>
  );
}
