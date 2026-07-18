"use client";
import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Spinner, Table, Th, Td, Tr } from "@/components/ui/index";
import { Network } from "lucide-react";

const ASSETS = ["T-2B","T-1A","SW-B1","SW-B2","G-1","G-2","G-3","G-4","UPS-A3","UPS-A4","AHU-C12","CH-1","CH-2","CT-3"];

function domainColor(d: string) {
  const m: Record<string,string> = { electrical:"text-accent", mechanical:"text-purple", schedule:"text-warning", procurement:"text-success" };
  return m[d] || "text-dim";
}
function severityVariant(s: string): "critical"|"warning"|"accent"|"default" {
  if (s === "critical") return "critical";
  if (s === "high") return "warning";
  if (s === "medium") return "accent";
  return "default";
}

export default function GraphPage() {
  const [asset, setAsset]   = useState("T-2B");
  const [data, setData]     = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const run = useCallback(async () => {
    setLoading(true);
    try { setData(await api.downstreamImpact(asset)); }
    catch (e: any) { setData({ error: e.message }); }
    finally { setLoading(false); }
  }, [asset]);

  return (
    <div className="p-6 max-w-[1400px]">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-text mb-1">Engineering Impact Graph</h1>
        <p className="text-sm text-muted">Knowledge Graph traversal · Downstream dependency analysis · Rule-engine edges</p>
      </div>

      <Card className="mb-6 p-5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-xs text-muted font-semibold flex-shrink-0">Select asset:</div>
          <select value={asset} onChange={e => setAsset(e.target.value)}
            className="bg-surface2 border border-border2 text-text rounded-lg px-3 py-2 text-xs outline-none focus:border-accent/50">
            {ASSETS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <Button variant="primary" size="md" onClick={run} disabled={loading}>
            {loading ? <><Spinner size="sm" />Traversing graph…</> : <><Network size={13} />Analyse Downstream Impact</>}
          </Button>
          {data && !data.error && (
            <div className="flex gap-2 ml-auto flex-wrap">
              <Badge variant="accent">{data.total_impacted} assets impacted</Badge>
              <Badge variant="warning">{data.impact_edges?.length || 0} dependency edges</Badge>
              <Badge variant="purple">{Object.keys(data.domains || {}).length} domains</Badge>
            </div>
          )}
        </div>
      </Card>

      {data?.error && (
        <Card className="mb-5 border-danger/30 bg-danger/5 p-5">
          <div className="text-danger text-sm font-semibold mb-1">Graph traversal failed</div>
          <div className="text-muted text-xs">{data.error}</div>
          <div className="text-muted text-xs mt-1">Is Neo4j running? → <code className="text-accent">docker compose up neo4j</code></div>
        </Card>
      )}

      {data && !data.error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <CardHeader><CardTitle>Impacted Assets</CardTitle><Badge variant="accent">{data.total_impacted} downstream</Badge></CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {data.impacted_nodes?.filter((n: any) => n.tag !== asset).map((n: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-surface2 border border-border hover:border-border2 transition-colors">
                    <Badge variant="outline">{n.type}</Badge>
                    <span className="text-xs font-bold text-text">{n.tag}</span>
                    <span className="text-xs text-muted truncate">{n.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Dependency Edges by Domain</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {Object.entries(data.domains || {}).map(([domain, edges]: [string, any]) => (
                  <div key={domain}>
                    <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${domainColor(domain)}`}>{domain}</div>
                    {edges.slice(0, 5).map((e: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 py-2 border-b border-border/50 last:border-0">
                        <Badge variant={severityVariant(e.severity)} className="flex-shrink-0 mt-0.5">{e.severity}</Badge>
                        <div className="text-xs text-dim leading-relaxed min-w-0">
                          <span className="text-text font-semibold">{e.from}</span>
                          <span className="text-muted mx-1">→[{e.type}]→</span>
                          <span className="text-text font-semibold">{e.to}</span>
                          {e.reason && <div className="text-muted mt-0.5 text-[11px]">{e.reason}</div>}
                          {e.source && <Badge variant="outline" className="mt-1">{e.source}</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!data && !loading && (
        <Card className="p-16 text-center border-dashed border-border2">
          <Network size={32} className="text-muted mx-auto mb-4" />
          <div className="text-sm font-semibold text-text mb-2">Select an asset and run the analysis</div>
          <div className="text-xs text-muted">The Knowledge Graph will traverse all downstream dependencies across electrical, mechanical, schedule and procurement domains.</div>
        </Card>
      )}
    </div>
  );
}
