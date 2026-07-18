"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Card, CardHeader, CardTitle, CardContent,
  Badge, Button, Metric, Progress, Skeleton, SkeletonCard,
  AlertRow, SectionHeader, Table, Th, Td, Tr, ConfidenceRing, Spinner,
} from "@/components/ui/index";
import { RefreshCw, TrendingUp, AlertTriangle, Zap } from "lucide-react";
import Link from "next/link";

const MOCK = {
  ncrs:{ total:23, critical:8, major:0, minor:15 },
  procurement:{ pct:74, delayed:5 },
  commissioning:{ pct:38, passed:1680, failed:12 },
  risk_score:7.8,
  alerts:[
    { severity:"critical" as const, title:"Transformer T-2B: NCR-187 — ONAN rating 98% of spec", description:"TIA-942 Tier IV requires 100% cooling capacity. Vendor proposing ONAF upgrade at +USD 45K and 6-week lead time." },
    { severity:"critical" as const, title:"AHU-C12: 18-day delivery delay — mechanical Cx critical path", description:"Daikin Applied Singapore ETA pushed to 22 Jul vs 04 Jul required. Alternative vendors identified." },
    { severity:"high" as const,    title:"RFI-0445: Cable tray routing conflict — 14 days unresolved", description:"Structural clash at Grid B-7 Level 3. 6 contractors blocked. Rework risk if not resolved by 30 Jun." },
    { severity:"high" as const,    title:"Generator fuel system: Cx pre-check C-GEN-047 aborted", description:"Day tank level sensors unresponsive in SCADA. 4-day rectification estimate." },
  ],
  delayed_assets:[
    { tag:"AHU-C12", type:"ahu",          vendor:"Daikin Applied",  delay_days:18, status:"at_risk",     unit_cost:280000 },
    { tag:"CT-3",    type:"cooling_tower", vendor:"EVAPCO",          delay_days:11, status:"watch",       unit_cost:520000 },
    { tag:"G-4",     type:"generator",     vendor:"Cummins India",   delay_days:3,  status:"minor_delay", unit_cost:450000 },
  ],
};

const MILESTONES = [
  { name:"HV Switchgear Energisation", baseline:"05 Jul 2026", forecast:"12 Jul 2026", days:7  },
  { name:"Mechanical Cx Start",        baseline:"15 Jul 2026", forecast:"02 Aug 2026", days:18 },
  { name:"IT Load Tests Begin",        baseline:"01 Aug 2026", forecast:"20 Aug 2026", days:19 },
  { name:"Tier IV Cx Witness",         baseline:"15 Sep 2026", forecast:"10 Oct 2026", days:25 },
  { name:"Substantial Completion",     baseline:"01 Nov 2026", forecast:"28 Nov 2026", days:27 },
];

const SYS = [
  { name:"Power — HV/LV",   pct:68 },
  { name:"Generators (4×)", pct:85 },
  { name:"UPS Systems",     pct:42 },
  { name:"Cooling — Chillers",pct:35 },
  { name:"Cooling — AHU",   pct:12 },
  { name:"BMS Integration", pct:28 },
];

function pctColor(p: number) {
  if (p >= 70) return "#10b981";
  if (p >= 40) return "#f59e0b";
  return "#ef4444";
}

export default function DashboardPage() {
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [backendOk, setBackendOk] = useState<boolean|null>(null);

  const load = async () => {
    setLoading(true);
    try {
      await api.health();
      setBackendOk(true);
      const s = await api.stats();
      setData(s);
    } catch {
      setBackendOk(false);
      setData(MOCK);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const d = data || MOCK;
  const alerts = d.alerts || MOCK.alerts;
  const delayed = d.delayed_assets || MOCK.delayed_assets;

  return (
    <div className="p-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-text mb-1">Command Centre</h1>
          <p className="text-sm text-muted">Mumbai HYP-1 · 120 MW Tier IV · Real-time intelligence</p>
        </div>
        <div className="flex items-center gap-3">
          {backendOk === false && <Badge variant="danger">Backend offline — mock data</Badge>}
          {backendOk === true  && <Badge variant="success">Live</Badge>}
          <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </Button>
        </div>
      </div>

      {/* Executive AI Summary */}
      <div className="mb-6 p-5 rounded-xl border border-accent/20 bg-gradient-to-br from-accent/5 to-purple/5 shadow-glow-accent">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center flex-shrink-0 shadow-glow-accent">
            <Zap size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-sm font-bold text-text">AI Executive Summary</h2>
              <ConfidenceRing value={0.93} size={48} />
            </div>
            <p className="text-sm text-dim leading-relaxed mb-3">
              Mumbai HYP-1 is currently <span className="text-warning font-semibold">27 days behind baseline</span> with a forecast completion of <span className="text-warning font-semibold">28 Nov 2026</span>. Primary risk driver is the AHU-C12 delivery delay cascading into mechanical commissioning. Three critical NCRs remain unresolved. Immediate executive action required on procurement alternatives and NCR-181 escalation.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="danger">AHU-C12 delay — 18d critical path</Badge>
              <Badge variant="danger">NCR-187 T-2B spec deviation</Badge>
              <Badge variant="warning">NCR-181 switchgear escalated</Badge>
              <Badge variant="accent">3 alternative vendors identified</Badge>
            </div>
          </div>
          <div className="hidden lg:flex flex-col gap-2 flex-shrink-0">
            <Link href="/analysis">
              <Button variant="primary" size="sm"><Zap size={12} />Run Analysis</Button>
            </Link>
            <Link href="/chat">
              <Button variant="outline" size="sm">Ask AI →</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_,i) => <SkeletonCard key={i} lines={2} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Metric label="Schedule Status"  value="D+27"    sub="27 days behind baseline"       color="warning" trend="up" />
          <Metric label="Open NCRs"        value={d.ncrs?.total || 23} sub={`${d.ncrs?.critical || 8} critical · ${d.ncrs?.minor || 15} minor`} color="danger" />
          <Metric label="Procurement"      value={`${d.procurement?.pct || 74}%`} sub="11,240 / 15,200 line items" color="accent" />
          <Metric label="Cx Coverage"      value={`${d.commissioning?.pct || 38}%`} sub="1,840 / 4,820 tests logged" color="success" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>🚨 Critical Alerts</CardTitle>
            <Badge variant="danger">{alerts.filter((a:any)=>a.severity==="critical").length} Critical</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {alerts.map((a: any, i: number) => (
                <AlertRow key={i} severity={a.severity} title={a.title} description={a.description}
                  meta={<div className="flex gap-1.5">
                    <Badge variant={a.severity === "critical" ? "critical" : "warning"}>{a.severity}</Badge>
                  </div>}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>📅 Schedule Forecast</CardTitle>
            <Badge variant="danger">D+27 overrun</Badge>
          </CardHeader>
          <CardContent>
            <Table>
              <thead>
                <tr>
                  <Th>Milestone</Th>
                  <Th>Baseline</Th>
                  <Th>Forecast</Th>
                  <Th>Slip</Th>
                </tr>
              </thead>
              <tbody>
                {MILESTONES.map((m, i) => (
                  <Tr key={i}>
                    <Td className="text-text text-xs font-medium">{m.name}</Td>
                    <Td className="text-muted text-xs">{m.baseline}</Td>
                    <Td className="text-xs" style={{ color: m.days > 14 ? "#ef4444" : "#f59e0b" }}>{m.forecast}</Td>
                    <Td><Badge variant={m.days > 14 ? "danger" : "warning"}>+{m.days}d</Badge></Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <div className="mt-4 p-3.5 rounded-lg bg-surface2 border border-border">
              <div className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1">AI Forecast — Completion</div>
              <div className="text-xl font-black text-danger">28 Nov 2026
                <span className="text-sm font-normal text-muted ml-2">vs. 01 Nov baseline</span>
              </div>
              <div className="text-xs text-warning mt-1">⚡ Primary driver: AHU-C12 delay cascading through mechanical Cx</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Cx System Progress */}
        <Card>
          <CardHeader>
            <CardTitle>⚡ Commissioning Progress</CardTitle>
            <Badge variant="warning">38% complete</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3.5">
              {SYS.map((s, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-dim">{s.name}</span>
                    <span className="font-bold" style={{ color: pctColor(s.pct) }}>{s.pct}%</span>
                  </div>
                  <Progress value={s.pct} color={pctColor(s.pct)} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Delayed Procurement */}
        <Card>
          <CardHeader>
            <CardTitle>🚚 At-Risk Deliveries</CardTitle>
            <Link href="/procurement"><Button variant="ghost" size="xs">View all →</Button></Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">{[...Array(3)].map((_,i)=><Skeleton key={i} className="h-14" />)}</div>
            ) : (
              <div className="space-y-2">
                {delayed.map((item: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-surface2 border border-border hover:border-border2 transition-colors">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.delay_days >= 14 ? "bg-danger" : item.delay_days >= 5 ? "bg-warning" : "bg-accent"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-text">{item.tag}</div>
                      <div className="text-[11px] text-muted truncate">{item.vendor}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Badge variant={item.delay_days >= 14 ? "danger" : item.delay_days >= 5 ? "warning" : "accent"}>
                        +{item.delay_days}d
                      </Badge>
                      <div className="text-[10px] text-muted mt-1">${(item.unit_cost/1000).toFixed(0)}K</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 p-3 rounded-lg bg-danger/5 border border-danger/20">
              <div className="text-xs text-danger font-semibold">Total cost at risk: <span className="font-black">USD 3.2M</span></div>
              <div className="text-[11px] text-muted mt-0.5">Across 5 at-risk shipments · 3 on critical path</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
