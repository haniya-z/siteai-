"use client";
import { Card, CardHeader, CardTitle, CardContent, Badge, Metric, Table, Th, Td, Tr } from "@/components/ui/index";

const NCRS = [
  { id:"NCR-187", asset:"T-2B",   title:"Transformer ONAN cooling rating 98% of spec (req 100%)",     severity:"critical", status:"open",      detected:"AI Agent", standard:"TIA-942 Tier IV §4.2" },
  { id:"NCR-184", asset:"UPS-A3", title:"UPS battery autonomy 7.5 min vs 10 min specified",           severity:"critical", status:"open",      detected:"AI Agent", standard:"TIA-942 Tier IV §5.1" },
  { id:"NCR-181", asset:"SW-B1",  title:"HV switchgear fault rating 31.5 kA vs 40 kA specification", severity:"critical", status:"escalated", detected:"AI Agent", standard:"IEC 62271 / Spec §3.3" },
  { id:"NCR-178", asset:"CH-2",   title:"Chiller IPLV 7.2 vs 7.8 specified (8% below)",              severity:"minor",    status:"closed",    detected:"AI Agent", standard:"ASHRAE 90.1" },
  { id:"NCR-175", asset:"G-1",    title:"Generator fuel consumption 8% above spec at 75% load",      severity:"minor",    status:"closed",    detected:"AI Agent", standard:"Project Spec §5.2" },
];

function sev(s: string) {
  const m: Record<string, any> = { critical:"critical", major:"warning", minor:"accent" };
  return <Badge variant={m[s] || "default"}>{s}</Badge>;
}
function stat(s: string) {
  const m: Record<string, any> = { open:"warning", escalated:"danger", closed:"success" };
  return <Badge variant={m[s] || "default"}>{s}</Badge>;
}

export default function NCRPage() {
  return (
    <div className="p-6 max-w-[1400px]">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-text mb-1">NCR Register</h1>
        <p className="text-sm text-muted">Non-conformance records · AI-detected · Full audit trail</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Metric label="Total NCRs"  value="23" sub="All time"           color="text" />
        <Metric label="Critical"    value="8"  sub="Immediate action"   color="danger" />
        <Metric label="Open"        value="15" sub="Awaiting resolution" color="warning" />
        <Metric label="Closed"      value="8"  sub="This month"         color="success" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Non-Conformance Records</CardTitle>
          <Badge variant="danger">8 Critical open</Badge>
        </CardHeader>
        <CardContent>
          <Table>
            <thead><tr>
              <Th>NCR No.</Th><Th>Asset</Th><Th>Title</Th><Th>Standard</Th><Th>Severity</Th><Th>Detected By</Th><Th>Status</Th>
            </tr></thead>
            <tbody>
              {NCRS.map((n, i) => (
                <Tr key={i}>
                  <Td className="text-accent font-bold font-mono">{n.id}</Td>
                  <Td><Badge variant="outline">{n.asset}</Badge></Td>
                  <Td className="text-text text-xs max-w-xs">{n.title}</Td>
                  <Td className="text-muted text-xs">{n.standard}</Td>
                  <Td>{sev(n.severity)}</Td>
                  <Td><Badge variant="purple">{n.detected}</Badge></Td>
                  <Td>{stat(n.status)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
