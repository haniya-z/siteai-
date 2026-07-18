"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui/index";
import { LiveIndicator } from "@/components/ui/index";
import {
  LayoutDashboard, Zap, Network, ShoppingCart,
  AlertTriangle, MessageSquare, FileText, Settings,
} from "lucide-react";

const NAV = [
  { href: "/dashboard",    label: "Command Centre",  icon: LayoutDashboard, badge: null },
  { href: "/analysis",     label: "AI Analysis",     icon: Zap,             badge: null },
  { href: "/chat",         label: "AI Chat",         icon: MessageSquare,   badge: null },
  { href: "/graph",        label: "Impact Graph",    icon: Network,         badge: null },
  { href: "/procurement",  label: "Procurement",     icon: ShoppingCart,    badge: "5" },
  { href: "/ncrs",         label: "NCR Register",    icon: AlertTriangle,   badge: "23" },
  { href: "/documents",    label: "Documents",       icon: FileText,        badge: null },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Topbar */}
      <header className="flex-shrink-0 h-14 glass-strong border-b border-border flex items-center gap-4 px-5 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-accent flex items-center justify-center shadow-glow-accent">
            <span className="text-white text-xs font-black">S</span>
          </div>
          <span className="font-bold text-text text-sm tracking-tight">SiteAI</span>
          <span className="text-border2 text-xs">|</span>
          <span className="text-xs text-muted font-medium">EPC Intelligence</span>
        </div>

        <div className="hidden md:flex items-center gap-2 ml-2 px-3 py-1.5 rounded-lg bg-surface2 border border-border">
          <span className="text-muted text-xs">Project:</span>
          <span className="text-text text-xs font-semibold">Mumbai HYP-1 · 120 MW · Tier IV</span>
        </div>

        <div className="ml-auto flex items-center gap-5 text-xs">
          <LiveIndicator />
          <div className="hidden sm:flex items-center gap-1 text-muted">
            Schedule: <span className="text-warning font-bold ml-1">D+27</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-muted">
            NCRs: <span className="text-danger font-bold ml-1">23</span>
          </div>
          <div className="hidden md:flex items-center gap-1 text-muted">
            Risk: <span className="text-warning font-bold ml-1">7.8/10</span>
          </div>
          <div className="w-7 h-7 rounded-full bg-gradient-accent flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:opacity-90 transition-opacity">
            D
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="flex-shrink-0 w-52 bg-surface border-r border-border flex flex-col py-3 overflow-y-auto">
          <nav className="flex-1 px-2 space-y-0.5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted px-3 pt-2 pb-1.5">Navigation</div>
            {NAV.map(({ href, label, icon: Icon, badge }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link key={href} href={href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 group",
                    active
                      ? "bg-accent/10 text-accent border border-accent/20 shadow-glow-accent"
                      : "text-muted hover:text-text hover:bg-surface2 border border-transparent"
                  )}>
                  <Icon size={14} className={cn("flex-shrink-0 transition-colors", active ? "text-accent" : "text-muted group-hover:text-dim")} />
                  <span className="flex-1 truncate">{label}</span>
                  {badge && (
                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                      active ? "bg-accent/20 text-accent" : "bg-danger/20 text-danger")}>
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="px-3 py-3 border-t border-border mt-2">
            <div className="p-2.5 rounded-lg bg-surface2 border border-border">
              <div className="text-[10px] font-bold text-muted mb-1.5">API Status</div>
              <div className="space-y-1">
                {[
                  { label: "Backend", url: "http://localhost:8000" },
                  { label: "Neo4j",   url: "http://localhost:7474" },
                ].map(s => (
                  <a key={s.label} href={s.url} target="_blank"
                    className="flex items-center justify-between text-[10px] text-muted hover:text-accent transition-colors">
                    <span>{s.label}</span>
                    <span className="text-accent">↗</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto bg-bg">
          {children}
        </main>
      </div>
    </div>
  );
}
