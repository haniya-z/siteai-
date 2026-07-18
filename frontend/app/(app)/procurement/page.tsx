"use client";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Metric, Table, Th, Td, Tr, Progress } from "@/components/ui/index";

const ITEMS = [
  { tag:"AHU-C12", type:"AHU",          vendor:"Daikin Applied",   origin:"Singapore",     required:"04 Jul 2026", eta:"22 Jul 2026", delay:18, status:"at_risk",     cost:280000 },
  { tag:"CT-3",    type:"Cooling Tower", vendor:"EVAPCO",           origin:"Baltimore, USA", required:"01 Aug 2026", eta:"12 Aug 2026", delay:11, status:"watch",       cost:520000 },
  { tag:"G-4",     type:"Generator",     vendor:"Cummins India",    origin:"Pune, India",    required:"15 Jul 2026", eta:"18 Jul 2026", delay:3,  status:"minor_delay", cost:450000 },
  { tag:"SW-B2",   type:"HV Switchgear", vendor:"ABB India",        origin:"Vadodara, India",required:"10 Jul 2026", eta:"09 Jul 2026", delay:0,  status:"on_track",    cost:320000 },
  { tag:"UPS-A4",  type:"UPS",           vendor:"EnerSys",          origin:"Chennai, India", required:"20 Jul 2026", eta:"20 Jul 2026", delay:0,  status:"on_track",    cost:195000 },
];

function statusBadge(s: string) {
  const m: Record<string, any> = { at_risk:"danger", watch:"warning", minor_delay:"warning", on_track:"success" };
  return <Badge variant={m[s] || "default"}>{s.replace(/_/g," ")}</Badge>;
}

export default function ProcurementPage() {
  return (
    <div className="p-6 max-w-[1400px]">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-text mb-1">Strategic Procurement</h1>
        <p className="text-sm text-muted">Supply chain tracking · AI vendor alternatives · Delay impact analysis</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Metric label="At Risk"      value="5"    sub="Critical path impact"    color="danger" />
        <Metric label="On Track"     value="38"   sub="80% of tracked shipments" color="success" />
        <Metric label="Cost at Risk" value="$3.2M" sub="Across delayed items"   color="warning" />
        <Metric label="Avg Lead Time" value="18w"  sub="Critical equipment"     color="accent" />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Critical Equipment Tracker</CardTitle>
          <Badge variant="danger">5 at-risk deliveries</Badge>
        </CardHeader>
        <CardContent>
          <Table>
            <thead>
              <tr>
                <Th>Equipment</Th><Th>Type</Th><Th>Vendor</Th><Th>Origin</Th>
                <Th>Required By</Th><Th>ETA</Th><Th>Delay</Th><Th>Status</Th><Th>Value</Th>
              </tr>
            </thead>
            <tbody>
              {ITEMS.map((item, i) => (
                <Tr key={i}>
                  <Td className="text-text font-bold">{item.tag}</Td>
                  <Td><Badge variant="outline">{item.type}</Badge></Td>
                  <Td>{item.vendor}</Td>
                  <Td>{item.origin}</Td>
                  <Td>{item.required}</Td>
                  <Td className={item.delay > 0 ? "text-danger font-semibold" : "text-success"}>{item.eta}</Td>
                  <Td>{item.delay > 0 ? <Badge variant={item.delay >= 14 ? "danger" : "warning"}>+{item.delay}d</Badge> : <Badge variant="success">On time</Badge>}</Td>
                  <Td>{statusBadge(item.status)}</Td>
                  <Td className="text-text font-medium">${(item.cost/1000).toFixed(0)}K</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>

      <Card className="p-5 border-accent/20 bg-accent/5">
        <div className="text-xs font-bold text-accent uppercase tracking-wider mb-2">AI Procurement Insight</div>
        <p className="text-sm text-dim leading-relaxed">
          AHU-C12 delay from Daikin Applied is the most critical procurement risk — it directly gates mechanical commissioning start, currently forecasting a <span className="text-warning font-semibold">+18 day slip</span> to the baseline. Carrier India and Johnson Controls have been identified as alternatives with 6–8 week lead times. Run the <a href="/analysis" className="text-accent underline underline-offset-2">Procurement Delay analysis</a> to see full vendor comparison and ranked recommendations.
        </p>
      </Card>
    </div>
  );
}
