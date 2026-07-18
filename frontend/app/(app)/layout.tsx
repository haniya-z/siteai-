import { Shell } from "@/components/layout/Shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#080c18", minHeight: "100vh" }}>
      <Shell>{children}</Shell>
    </div>
  );
}
