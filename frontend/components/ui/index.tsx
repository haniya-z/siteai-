"use client";
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: (string | undefined | false | null)[]) {
  return twMerge(clsx(inputs));
}

// ── Badge ─────────────────────────────────────────────────────────────────────
const badgeVariants = cva(
  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border transition-all",
  {
    variants: {
      variant: {
        default:  "bg-surface2 text-dim border-border",
        accent:   "bg-accent/10 text-accent border-accent/30",
        purple:   "bg-purple/10 text-purple border-purple/30",
        success:  "bg-success/10 text-success border-success/30",
        warning:  "bg-warning/10 text-warning border-warning/30",
        danger:   "bg-danger/10 text-danger border-danger/30",
        critical: "bg-danger/20 text-danger border-danger/50 font-bold",
        outline:  "bg-transparent text-dim border-border2",
      },
    },
    defaultVariants: { variant: "default" },
  }
);
export function Badge({ className, variant, children, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props}>{children}</span>;
}

// ── Button ────────────────────────────────────────────────────────────────────
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed select-none",
  {
    variants: {
      variant: {
        primary: "bg-gradient-accent text-white shadow-glow-accent hover:opacity-90 hover:shadow-lg active:scale-[0.98]",
        secondary:"bg-surface2 text-dim border border-border2 hover:bg-surface3 hover:text-text hover:border-border active:scale-[0.98]",
        ghost:   "text-dim hover:text-text hover:bg-surface2 active:scale-[0.98]",
        danger:  "bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 active:scale-[0.98]",
        success: "bg-success/10 text-success border border-success/30 hover:bg-success/20 active:scale-[0.98]",
        outline: "border border-accent/40 text-accent hover:bg-accent/10 active:scale-[0.98]",
      },
      size: {
        xs: "text-xs px-2 py-1",
        sm: "text-xs px-3 py-1.5",
        md: "text-sm px-4 py-2",
        lg: "text-sm px-5 py-2.5",
        xl: "text-base px-6 py-3",
        icon: "p-2",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  }
);
export function Button({ className, variant, size, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props}>{children}</button>;
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ className, children, glow, ...props }: React.HTMLAttributes<HTMLDivElement> & { glow?: "accent" | "purple" | "success" | "danger" }) {
  const glowClass = glow ? {
    accent: "shadow-glow-accent border-accent/20",
    purple: "shadow-glow-purple border-purple/20",
    success: "glow-success border-success/20",
    danger: "glow-danger border-danger/20",
  }[glow] : "";
  return (
    <div className={cn("bg-surface border border-border rounded-xl shadow-card transition-all duration-200", glowClass, className)} {...props}>
      {children}
    </div>
  );
}
export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center justify-between px-5 pt-5 pb-3", className)} {...props}>{children}</div>;
}
export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-sm font-bold text-text", className)} {...props}>{children}</h3>;
}
export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pb-5", className)} {...props}>{children}</div>;
}

// ── Progress ──────────────────────────────────────────────────────────────────
export function Progress({ value, className, color }: { value: number; className?: string; color?: string }) {
  return (
    <div className={cn("h-1.5 rounded-full bg-surface3 overflow-hidden", className)}>
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color || "linear-gradient(90deg,#0ea5e9,#8b5cf6)" }}
      />
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse bg-surface2 rounded-lg", className)} {...props} />;
}
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <Card className="p-5 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("h-3", i === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </Card>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = "sm", className }: { size?: "xs"|"sm"|"md"|"lg"; className?: string }) {
  const sizes = { xs: "w-3 h-3 border", sm: "w-4 h-4 border-2", md: "w-5 h-5 border-2", lg: "w-6 h-6 border-2" };
  return <div className={cn("rounded-full border-accent border-t-transparent animate-spin", sizes[size], className)} />;
}

// ── Thinking Dots (AI animation) ──────────────────────────────────────────────
export function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1 px-1">
      {[0, 1, 2].map(i => (
        <span key={i} className="thinking-dot w-1.5 h-1.5 rounded-full bg-accent inline-block" style={{ animationDelay: `${i * 0.2}s` }} />
      ))}
    </span>
  );
}

// ── Live Indicator ────────────────────────────────────────────────────────────
export function LiveIndicator({ label = "Live" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success">
      <span className="live-dot" />
      {label}
    </span>
  );
}

// ── Stat Metric ───────────────────────────────────────────────────────────────
export function Metric({
  label, value, sub, color, trend, icon
}: {
  label: string; value: string | number; sub?: string;
  color?: "accent"|"success"|"warning"|"danger"|"purple"|"text";
  trend?: "up"|"down"; icon?: React.ReactNode;
}) {
  const colorMap = { accent:"text-accent", success:"text-success", warning:"text-warning", danger:"text-danger", purple:"text-purple", text:"text-text" };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-muted">{label}</span>
        {icon && <span className="text-muted">{icon}</span>}
      </div>
      <div className={cn("text-2xl font-black leading-none mb-1.5 animate-count", colorMap[color || "text"])}>{value}</div>
      {sub && <div className="text-xs text-muted">{sub}</div>}
      {trend && (
        <div className={cn("text-xs font-semibold mt-2", trend === "up" ? "text-danger" : "text-success")}>
          {trend === "up" ? "↑" : "↓"} vs last week
        </div>
      )}
    </Card>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <h2 className="text-lg font-bold text-text">{title}</h2>
        {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px bg-border", className)} />;
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: { icon?: string; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="text-4xl mb-4">{icon}</div>}
      <h3 className="text-base font-semibold text-text mb-2">{title}</h3>
      {description && <p className="text-sm text-muted max-w-sm mb-6">{description}</p>}
      {action && action}
    </div>
  );
}

// ── Table ─────────────────────────────────────────────────────────────────────
export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return <table className={cn("w-full border-collapse text-sm", className)}>{children}</table>;
}
export function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn("text-left text-xs font-bold uppercase tracking-wider text-muted px-3 py-2.5 border-b border-border", className)}>{children}</th>;
}
export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-3 py-3 border-b border-border/50 text-dim align-middle", className)}>{children}</td>;
}
export function Tr({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return <tr className={cn("transition-colors", onClick ? "cursor-pointer hover:bg-surface2" : "hover:bg-surface2/50", className)} onClick={onClick}>{children}</tr>;
}

// ── Confidence Ring ───────────────────────────────────────────────────────────
export function ConfidenceRing({ value, size = 60 }: { value: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, value));
  const dash = circ * pct;
  const color = pct >= 0.9 ? "#10b981" : pct >= 0.7 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1a2a42" strokeWidth={4} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease-out" }} />
      </svg>
      <span className="absolute text-xs font-bold" style={{ color }}>{Math.round(pct * 100)}%</span>
    </div>
  );
}

// ── Alert Row ─────────────────────────────────────────────────────────────────
export function AlertRow({ severity, title, description, meta }: {
  severity: "critical"|"high"|"medium"|"low";
  title: string; description?: string; meta?: React.ReactNode;
}) {
  const colorMap = { critical:"bg-danger/5 border-danger/30", high:"bg-warning/5 border-warning/20", medium:"bg-accent/5 border-accent/20", low:"bg-surface2 border-border" };
  const dotColor = { critical:"bg-danger", high:"bg-warning", medium:"bg-accent", low:"bg-muted" };
  return (
    <div className={cn("flex gap-3 p-3.5 rounded-lg border mb-2 transition-all hover:scale-[1.005]", colorMap[severity])}>
      <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", dotColor[severity])} />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-text mb-0.5">{title}</div>
        {description && <div className="text-xs text-muted leading-relaxed">{description}</div>}
        {meta && <div className="mt-1.5">{meta}</div>}
      </div>
    </div>
  );
}
