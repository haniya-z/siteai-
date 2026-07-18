"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import Link from "next/link";

// ── Canvas: Living Knowledge Graph background ─────────────────────────────────
function GraphCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener("resize", onResize);

    const nodes = Array.from({ length: 70 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.12, vy: (Math.random() - 0.5) * 0.12,
      r: 1.5 + Math.random() * 2,
      pulse: Math.random() * Math.PI * 2,
      active: Math.random() > 0.65,
      hue: Math.random() > 0.6 ? "212,168,67" : "160,160,140",
    }));

    const edges: [number,number][] = [];
    nodes.forEach((_, i) => {
      for (let c = 0; c < 2 + Math.floor(Math.random()*2); c++) {
        const j = Math.floor(Math.random()*nodes.length);
        if (j !== i) edges.push([i,j]);
      }
    });

    let raf = 0;
    const draw = () => {
      ctx.clearRect(0,0,W,H);
      edges.forEach(([i,j]) => {
        const a = nodes[i], b = nodes[j];
        const d = Math.hypot(a.x-b.x, a.y-b.y);
        if (d > 220) return;
        const alpha = (1 - d/220) * 0.12;
        ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
        ctx.strokeStyle = `rgba(212,168,67,${alpha})`; ctx.lineWidth = 0.3; ctx.stroke();
      });
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
        n.pulse += 0.01;
        const p = Math.sin(n.pulse) * 0.25 + 0.75;
        ctx.beginPath(); ctx.arc(n.x,n.y,n.r*p,0,Math.PI*2);
        ctx.fillStyle = `rgba(${n.hue},${n.active ? 0.5 : 0.2})`; ctx.fill();
        if (n.active) {
          ctx.beginPath(); ctx.arc(n.x,n.y,n.r*2.5*p,0,Math.PI*2);
          ctx.fillStyle = `rgba(${n.hue},0.05)`; ctx.fill();
        }
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);
  return <canvas ref={ref} className="fixed inset-0 pointer-events-none" style={{ opacity:0.5, zIndex:0 }} />;
}

// ── Boot sequence ─────────────────────────────────────────────────────────────
const BOOT = [
  { label:"SiteAI Core",             status:"ONLINE",  d:0    },
  { label:"Knowledge Graph",         status:"SYNCED",  d:0.4  },
  { label:"Engineering Agent",       status:"READY",   d:0.72 },
  { label:"Procurement Agent",       status:"READY",   d:0.96 },
  { label:"Schedule Intelligence",   status:"READY",   d:1.18 },
  { label:"Commissioning Agent",     status:"READY",   d:1.38 },
  { label:"GraphRAG Pipeline",       status:"ACTIVE",  d:1.62 },
  { label:"Decision Engine",         status:"ARMED",   d:1.82 },
];
const SC: Record<string,string> = {
  ONLINE:"#d4a843", SYNCED:"#3d7a5a", READY:"#7a7a6e", ACTIVE:"#d4a843", ARMED:"#c8c0a0"
};

function Boot({ onDone }: { onDone:()=>void }) {
  const [n, setN] = useState(0);
  const [out, setOut] = useState(false);
  useEffect(() => {
    const ts = BOOT.map((b,i) => setTimeout(() => setN(i+1), b.d*1000+200));
    ts.push(setTimeout(() => { setOut(true); setTimeout(onDone,700); }, 2500));
    return () => ts.forEach(clearTimeout);
  }, [onDone]);
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background:"#0e0e0d" }}
      animate={out ? { opacity:0 } : { opacity:1 }} transition={{ duration:0.7 }}>
      <div className="w-96 px-8">
        <motion.div className="flex items-center gap-3 mb-10"
          initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}>
          <div className="w-5 h-5 rounded border border-amber-600/30 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-sm" style={{ background:"#d4a843",
              animation:"status-pulse 2s infinite", boxShadow:"0 0 6px rgba(212,168,67,0.5)" }} />
          </div>
          <span className="text-xs font-mono tracking-[0.3em] uppercase" style={{ color:"#3d3d35" }}>SiteAI</span>
        </motion.div>
        <div className="space-y-3">
          {BOOT.slice(0,n).map((b,i) => (
            <motion.div key={i} className="flex justify-between items-center"
              initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.25 }}>
              <span className="text-xs font-mono" style={{ color:"#55554a" }}>{b.label}</span>
              <span className="text-[10px] font-mono tracking-widest" style={{ color:SC[b.status] }}>— {b.status}</span>
            </motion.div>
          ))}
        </div>
        {!out && (
          <div className="relative mt-6 h-px overflow-hidden">
            <div className="scan-line" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
const PROMPTS = [
  "What will delay this project?",
  "AHU-C12 slips 18 days — what happens?",
  "Which NCRs threaten Tier IV certification?",
  "Find alternatives to Daikin for AHU-C12",
  "Predict completion date with current risks",
];

function Hero() {
  const [val, setVal]       = useState("");
  const [focused, setFocused] = useState(false);
  const [thinking, setThinking] = useState(false);
  const h = new Date().getHours();
  const greeting = h < 12 ? "Good morning." : h < 17 ? "Good afternoon." : "Good evening.";

  const submit = useCallback(() => {
    if (!val.trim()) return;
    setThinking(true);
    setTimeout(() => window.location.href = "/chat", 2200);
  }, [val]);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 z-10">
      <motion.div className="text-center mb-16 max-w-3xl"
        initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:1, ease:[0.25,0.1,0.25,1] }}>
        <motion.p className="text-xs font-mono tracking-[0.3em] uppercase mb-8"
          style={{ color:"#3d3d35" }}
          initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.2, duration:0.8 }}>
          Mumbai HYP-1 · 120 MW · Tier IV · 27 Jun 2026
        </motion.p>
        <motion.h1
          style={{ fontSize:"clamp(3.5rem,9vw,7.5rem)", color:"#e8e8d8", fontWeight:300, letterSpacing:"-0.04em", lineHeight:1 }}
          initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3, duration:1 }}>
          {greeting}
        </motion.h1>
        <motion.p style={{ color:"#55554a", fontSize:"1.1rem", lineHeight:1.8, marginTop:"1.5rem" }}
          initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.6, duration:0.8 }}>
          Your project has{" "}
          <span style={{ color:"#d4a843", fontWeight:500 }}>6 critical decisions</span> waiting.
          <br />Schedule is{" "}
          <span style={{ color:"#c87070", fontWeight:500 }}>27 days behind baseline.</span>
        </motion.p>
      </motion.div>

      {/* AI input */}
      <motion.div className="w-full max-w-2xl"
        initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.9, duration:0.8 }}>
        <div className="relative" style={{
          borderBottom: `1px solid ${focused ? "rgba(212,168,67,0.4)" : "rgba(255,255,240,0.08)"}`,
          transition:"border-color 0.4s", paddingBottom:16
        }}>
          <motion.div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full"
            style={{ background:"#d4a843", transformOrigin:"top" }}
            animate={{ opacity: focused ? 1 : 0, scaleY: focused ? 1 : 0.2 }}
            transition={{ duration:0.3 }} />
          <input type="text" value={val} onChange={e=>setVal(e.target.value)}
            onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
            onKeyDown={e=>e.key==="Enter"&&submit()}
            placeholder="What would you like SiteAI to understand today?"
            className="w-full bg-transparent outline-none pl-5"
            style={{ fontSize:"1.2rem", fontWeight:300, color:"#e8e8d8", letterSpacing:"-0.01em", caretColor:"#d4a843" }} />
          {val && (
            <motion.button onClick={submit}
              className="absolute right-0 top-0 px-3 py-1 font-mono text-[10px] tracking-widest uppercase rounded"
              style={{ color:"#d4a843", border:"1px solid rgba(212,168,67,0.3)" }}
              initial={{ opacity:0, x:6 }} animate={{ opacity:1, x:0 }}>
              Ask →
            </motion.button>
          )}
        </div>

        <motion.div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 justify-center"
          initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1.2 }}>
          {PROMPTS.map((p,i) => (
            <motion.button key={i} onClick={()=>setVal(p)}
              className="text-xs font-mono"
              style={{ color:"#3d3d35", background:"none", border:"none", cursor:"pointer", padding:"2px 0" }}
              whileHover={{ color:"#7a7a6e" }}
              initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }}
              transition={{ delay:1.3+i*0.07 }}>
              {p}
            </motion.button>
          ))}
        </motion.div>
      </motion.div>

      {/* Thinking overlay */}
      <AnimatePresence>
        {thinking && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background:"rgba(14,14,13,0.96)" }}
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            <div className="text-center">
              <div className="flex items-center gap-2 justify-center mb-5">
                {[0,1,2].map(i=>(
                  <div key={i} className="w-2 h-2 rounded-full thinking-dot" />
                ))}
              </div>
              <p className="text-[10px] font-mono tracking-[0.3em] uppercase" style={{ color:"#3d3d35" }}>
                Traversing knowledge graph
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll cue */}
      <motion.div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:2.2, duration:1 }}>
        <span className="text-[9px] font-mono tracking-[0.3em] uppercase" style={{ color:"#2e2e28" }}>Scroll</span>
        <motion.div className="w-px h-8" style={{ background:"linear-gradient(to bottom, #2e2e28, transparent)" }}
          animate={{ scaleY:[1,0.4,1] }} transition={{ duration:2, repeat:Infinity, ease:"easeInOut" }} />
      </motion.div>
    </section>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
const Divider = () => (
  <div className="max-w-5xl mx-auto px-6">
    <div className="h-px" style={{ background:"linear-gradient(to right, transparent, rgba(255,255,240,0.05), transparent)" }} />
  </div>
);

// ── Section: Awareness ────────────────────────────────────────────────────────
const STREAMS = [
  { label:"Engineering Drawings",     color:"#d4a843" },
  { label:"Procurement Orders",       color:"#a07828" },
  { label:"Vendor Submittals",        color:"#8b7a60" },
  { label:"Schedule (P6)",            color:"#7a7a6e" },
  { label:"NCR Records",              color:"#c87070" },
  { label:"Commissioning Protocols",  color:"#6a8a7a" },
  { label:"Meeting Transcripts",      color:"#5a5a50" },
];

function SectionAwareness() {
  const ref = useRef(null);
  const v   = useInView(ref, { once:true, margin:"-20%" });
  return (
    <section ref={ref} className="relative z-10 py-40 px-6">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
        <div>
          <motion.p className="text-xs font-mono tracking-[0.25em] uppercase mb-6" style={{ color:"#d4a843" }}
            initial={{ opacity:0 }} animate={v?{opacity:1}:{}} transition={{ duration:0.6 }}>
            01 — Awareness
          </motion.p>
          <motion.h2 style={{ fontSize:"clamp(2.5rem,5vw,4.5rem)", color:"#e8e8d8", fontWeight:300, letterSpacing:"-0.03em", lineHeight:1.1 }}
            initial={{ opacity:0, y:16 }} animate={v?{opacity:1,y:0}:{}} transition={{ duration:0.8, delay:0.1 }}>
            SiteAI understands<br />
            <span style={{ background:"linear-gradient(135deg,#f0c060,#d4a843,#8b5e3c)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              your project.
            </span>
          </motion.h2>
          <motion.p style={{ color:"#55554a", fontSize:"1rem", lineHeight:1.8, marginTop:"2rem", maxWidth:400 }}
            initial={{ opacity:0, y:12 }} animate={v?{opacity:1,y:0}:{}} transition={{ duration:0.8, delay:0.25 }}>
            Not just the documents. The relationships between them.
            The dependencies between decisions. The consequences of
            every change — before they become problems.
          </motion.p>
        </div>
        <motion.div className="relative h-72"
          initial={{ opacity:0 }} animate={v?{opacity:1}:{}} transition={{ duration:1, delay:0.4 }}>
          {STREAMS.map((s,i) => (
            <motion.div key={i} className="absolute left-0 flex items-center gap-3"
              style={{ top:`${i*14}%` }}
              initial={{ opacity:0, x:-16 }} animate={v?{opacity:1,x:0}:{}}
              transition={{ delay:0.5+i*0.08, duration:0.5 }}>
              <motion.div style={{ height:1, background:`linear-gradient(to right,${s.color},transparent)`, width:32, flexShrink:0 }}
                animate={{ scaleX:[0.5,1,0.5] }} transition={{ duration:2+i*0.3, repeat:Infinity, ease:"easeInOut" }} />
              <span className="text-xs font-mono whitespace-nowrap" style={{ color:s.color }}>{s.label}</span>
            </motion.div>
          ))}
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <motion.div className="w-14 h-14 rounded-full border flex items-center justify-center"
              style={{ borderColor:"rgba(212,168,67,0.25)", background:"rgba(212,168,67,0.04)" }}
              animate={{ scale:[1,1.06,1] }} transition={{ duration:3, repeat:Infinity, ease:"easeInOut" }}>
              <div className="w-2 h-2 rounded-full" style={{ background:"#d4a843", animation:"status-pulse 2s infinite" }} />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ── Section: Reasoning ────────────────────────────────────────────────────────
const STEPS = [
  "Reading 14,200 documents",
  "Building Knowledge Graph",
  "Running GraphRAG retrieval",
  "Query planning",
  "Engineering Agent",
  "Spec Compliance Agent",
  "Schedule Risk Agent",
  "Strategic Procurement Agent",
  "Dependency traversal",
  "Executive synthesis",
];

function SectionReasoning() {
  const ref = useRef(null);
  const v   = useInView(ref, { once:true, margin:"-15%" });
  const [step, setStep] = useState(-1);

  useEffect(() => {
    if (!v) return;
    const ts = STEPS.map((_,i) => setTimeout(()=>setStep(i), 400+i*260));
    return () => ts.forEach(clearTimeout);
  }, [v]);

  return (
    <section ref={ref} className="relative z-10 py-40 px-6">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-24 items-start">
        <div>
          <motion.p className="text-xs font-mono tracking-[0.25em] uppercase mb-6" style={{ color:"#d4a843" }}
            initial={{ opacity:0 }} animate={v?{opacity:1}:{}} transition={{ duration:0.6 }}>
            02 — Reasoning
          </motion.p>
          <motion.h2 style={{ fontSize:"clamp(2rem,4vw,3.5rem)", color:"#e8e8d8", fontWeight:300, letterSpacing:"-0.03em", lineHeight:1.15 }}
            initial={{ opacity:0, y:16 }} animate={v?{opacity:1,y:0}:{}} transition={{ duration:0.8, delay:0.1 }}>
            Six agents.<br />One decision.
          </motion.h2>
          <motion.p style={{ color:"#55554a", fontSize:"1rem", lineHeight:1.8, marginTop:"2rem" }}
            initial={{ opacity:0, y:12 }} animate={v?{opacity:1,y:0}:{}} transition={{ duration:0.8, delay:0.25 }}>
            When you ask a question, SiteAI doesn't search documents.
            It reasons across the entire engineering knowledge graph —
            traversing thousands of dependency relationships to understand
            consequences before they become problems.
          </motion.p>
        </div>
        <div className="space-y-4">
          {STEPS.map((s,i) => (
            <motion.div key={i} className="flex items-center gap-4"
              initial={{ opacity:0, x:12 }} animate={v?{opacity:1,x:0}:{}}
              transition={{ delay:0.3+i*0.06, duration:0.4 }}>
              <div className="w-3 h-3 flex items-center justify-center flex-shrink-0">
                {step===i ? (
                  <motion.div className="w-2 h-2 rounded-full" style={{ background:"#d4a843" }}
                    animate={{ scale:[1,1.5,1], opacity:[1,0.5,1] }} transition={{ duration:0.7, repeat:Infinity }} />
                ) : step>i ? (
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background:"#3d7a5a" }} />
                ) : (
                  <div className="w-1 h-1 rounded-full" style={{ background:"#2e2e28" }} />
                )}
              </div>
              <div className="flex-1 h-px" style={{ background: step>i?"#3d7a5a": step===i?"#d4a843":"#1c1c19", transition:"background 0.4s" }} />
              <span className="text-xs font-mono whitespace-nowrap" style={{ color: step>i?"#3d7a5a":step===i?"#d4a843":"#2e2e28", transition:"color 0.4s", minWidth:196 }}>
                {s}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Section: Decision ─────────────────────────────────────────────────────────
const RIPPLE = [
  { label:"AHU-C12 delayed 18 days",               color:"#c87070", p:1 },
  { label:"→ Mechanical Cx pushed +18d",            color:"#d4906a", p:2 },
  { label:"→ IT load tests delayed +19d",           color:"#c8a060", p:3 },
  { label:"→ Tier IV witness slips to Oct",         color:"#b8a850", p:4 },
  { label:"→ Recovery: Carrier India, 6wk, +8%",   color:"#3d7a5a", p:5 },
];

function SectionDecision() {
  const ref  = useRef(null);
  const v    = useInView(ref, { once:true, margin:"-15%" });
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (!v) return;
    const ts = [600,1400,2200,3000,3700].map((d,i) => setTimeout(()=>setPhase(i+1),d));
    return () => ts.forEach(clearTimeout);
  }, [v]);
  return (
    <section ref={ref} className="relative z-10 py-40 px-6">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
        <div>
          <motion.p className="text-xs font-mono tracking-[0.25em] uppercase mb-6" style={{ color:"#d4a843" }}
            initial={{ opacity:0 }} animate={v?{opacity:1}:{}} transition={{ duration:0.6 }}>
            03 — Decision Intelligence
          </motion.p>
          <motion.h2 style={{ fontSize:"clamp(2rem,4vw,3.5rem)", color:"#e8e8d8", fontWeight:300, letterSpacing:"-0.03em", lineHeight:1.15 }}
            initial={{ opacity:0, y:16 }} animate={v?{opacity:1,y:0}:{}} transition={{ duration:0.8 }}>
            Every change<br />has consequences.
          </motion.h2>
          <motion.p style={{ color:"#55554a", fontSize:"1rem", lineHeight:1.8, marginTop:"2rem" }}
            initial={{ opacity:0, y:12 }} animate={v?{opacity:1,y:0}:{}} transition={{ duration:0.8, delay:0.2 }}>
            SiteAI traces every consequence across the dependency graph,
            quantifies schedule and cost impact, then generates ranked
            recovery options — before you knew there was a problem.
          </motion.p>
        </div>
        <div>
          <motion.div className="text-xs font-mono mb-6 pb-4" style={{ color:"#3d3d35", borderBottom:"1px solid #1c1c19" }}
            initial={{ opacity:0 }} animate={v?{opacity:1}:{}} transition={{ delay:0.3 }}>
            Query: "What happens if AHU-C12 slips 18 days?"
          </motion.div>
          <div className="space-y-4">
            {RIPPLE.map((r,i) => (
              <motion.div key={i} className="flex items-center gap-3"
                animate={phase>=r.p ? { opacity:1, x:0 } : { opacity:0.08, x:-6 }}
                transition={{ duration:0.5, ease:"easeOut" }}>
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background:r.color }} />
                <span className="text-sm font-mono" style={{ color:r.color }}>{r.label}</span>
              </motion.div>
            ))}
          </div>
          <AnimatePresence>
            {phase>=5 && (
              <motion.div className="mt-7 p-4 rounded" style={{ background:"rgba(61,122,90,0.07)", border:"1px solid rgba(61,122,90,0.2)" }}
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6 }}>
                <div className="text-[10px] font-mono tracking-[0.2em] uppercase mb-2" style={{ color:"#3d7a5a" }}>AI Recommendation</div>
                <div className="text-xs font-mono leading-relaxed" style={{ color:"#6a9a7a" }}>
                  Source AHU-C12 from Carrier India (Pune).<br />
                  Lead time: 6 weeks · Cost premium: +8% · Compliance: 94%<br />
                  Schedule recovery: 12 days · Confidence: 91%
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

// ── Section: Mission Control ──────────────────────────────────────────────────
const KPIs = [
  { label:"Schedule",   value:"D+27",  sub:"Behind baseline", color:"#c87070" },
  { label:"NCRs",       value:"23",    sub:"8 critical open",  color:"#d4a843" },
  { label:"Procurement",value:"74%",   sub:"11,240 / 15,200", color:"#7a7a6e" },
  { label:"Cx Coverage",value:"38%",   sub:"1,840 / 4,820",   color:"#6a8a7a" },
];
const BARS = [
  { label:"Generators (4×)", pct:85, color:"#6a8a7a" },
  { label:"Power — HV/LV",   pct:68, color:"#7a7a6e" },
  { label:"UPS Systems",     pct:42, color:"#d4a843" },
  { label:"Cooling — AHU",   pct:12, color:"#c87070" },
];

function SectionMission() {
  const ref = useRef(null);
  const v   = useInView(ref, { once:true, margin:"-10%" });
  return (
    <section ref={ref} className="relative z-10 py-40 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.p className="text-xs font-mono tracking-[0.25em] uppercase mb-6" style={{ color:"#d4a843" }}
          initial={{ opacity:0 }} animate={v?{opacity:1}:{}} transition={{ duration:0.6 }}>
          04 — Mission Control
        </motion.p>
        <motion.h2 style={{ fontSize:"clamp(2rem,4vw,3.5rem)", color:"#e8e8d8", fontWeight:300, letterSpacing:"-0.03em", lineHeight:1.15, marginBottom:"4rem" }}
          initial={{ opacity:0, y:16 }} animate={v?{opacity:1,y:0}:{}} transition={{ duration:0.8 }}>
          The complete picture.<br />
          <span style={{ background:"linear-gradient(135deg,#f0c060,#d4a843,#8b5e3c)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            Always current.
          </span>
        </motion.h2>

        <motion.div className="rounded-xl overflow-hidden" style={{ border:"1px solid rgba(255,255,240,0.05)", background:"rgba(20,20,18,0.85)" }}
          initial={{ opacity:0, y:28, scale:0.98 }} animate={v?{opacity:1,y:0,scale:1}:{}}
          transition={{ duration:1, delay:0.2, ease:[0.25,0.1,0.25,1] }}>
          {/* Bar */}
          <div className="flex items-center gap-3 px-5 py-3" style={{ borderBottom:"1px solid rgba(255,255,240,0.04)", background:"rgba(28,28,25,0.5)" }}>
            <div className="w-2 h-2 rounded-full" style={{ background:"#d4a843", animation:"status-pulse 2s infinite" }} />
            <span className="text-[10px] font-mono tracking-[0.2em] uppercase" style={{ color:"#3d3d35" }}>
              SiteAI · Mumbai HYP-1 · Mission Control
            </span>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background:"#3d7a5a", animation:"status-pulse 2s infinite" }} />
              <span className="text-[10px] font-mono" style={{ color:"#3d7a5a" }}>Live</span>
            </div>
          </div>
          {/* KPIs */}
          <div className="grid grid-cols-4">
            {KPIs.map((k,i) => (
              <motion.div key={i} className="p-6" style={{ borderRight:i<3?"1px solid rgba(255,255,240,0.04)":"none" }}
                initial={{ opacity:0, y:8 }} animate={v?{opacity:1,y:0}:{}}
                transition={{ delay:0.5+i*0.1, duration:0.5 }}>
                <div className="text-[10px] font-mono tracking-[0.2em] uppercase mb-2" style={{ color:"#3d3d35" }}>{k.label}</div>
                <div style={{ fontSize:"1.75rem", fontWeight:300, color:k.color, letterSpacing:"-0.02em", lineHeight:1 }}>{k.value}</div>
                <div className="text-[10px] mt-1.5" style={{ color:"#3d3d35" }}>{k.sub}</div>
              </motion.div>
            ))}
          </div>
          {/* Progress bars */}
          <div className="p-6 space-y-4" style={{ borderTop:"1px solid rgba(255,255,240,0.04)" }}>
            {BARS.map((b,i) => (
              <motion.div key={i} initial={{ opacity:0 }} animate={v?{opacity:1}:{}} transition={{ delay:0.8+i*0.08 }}>
                <div className="flex justify-between text-[10px] font-mono mb-1.5">
                  <span style={{ color:"#3d3d35" }}>{b.label}</span>
                  <span style={{ color:b.color }}>{b.pct}%</span>
                </div>
                <div className="h-0.5 rounded-full" style={{ background:"#1c1c19" }}>
                  <motion.div className="h-full rounded-full" style={{ background:b.color }}
                    initial={{ width:0 }} animate={v?{width:`${b.pct}%`}:{}}
                    transition={{ delay:1+i*0.1, duration:0.9, ease:"easeOut" }} />
                </div>
              </motion.div>
            ))}
          </div>
          {/* CTA */}
          <div className="p-6 text-center" style={{ borderTop:"1px solid rgba(255,255,240,0.04)" }}>
            <motion.div initial={{ opacity:0 }} animate={v?{opacity:1}:{}} transition={{ delay:1.5 }}>
              <Link href="/dashboard">
                <motion.button
                  className="px-10 py-3 rounded font-mono text-xs tracking-[0.2em] uppercase"
                  style={{ background:"transparent", border:"1px solid rgba(212,168,67,0.25)", color:"#d4a843" }}
                  whileHover={{ background:"rgba(212,168,67,0.07)", borderColor:"rgba(212,168,67,0.5)" }}
                  whileTap={{ scale:0.98 }}>
                  Enter Mission Control →
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="relative z-10 py-14 px-6" style={{ borderTop:"1px solid rgba(255,255,240,0.04)" }}>
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-4 h-4 rounded border flex items-center justify-center" style={{ borderColor:"rgba(212,168,67,0.25)" }}>
            <div className="w-1 h-1 rounded-sm" style={{ background:"#d4a843" }} />
          </div>
          <span className="text-[10px] font-mono tracking-[0.25em] uppercase" style={{ color:"#2e2e28" }}>SiteAI</span>
        </div>
        <span className="text-[10px] font-mono" style={{ color:"#2e2e28" }}>
          Engineering Decision Intelligence · EPC AI Operating System
        </span>
        <Link href="/dashboard">
          <span className="text-[10px] font-mono" style={{ color:"#3d3d35" }}>Enter platform →</span>
        </Link>
      </div>
    </footer>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [booted, setBooted] = useState(false);
  const done = useCallback(() => setBooted(true), []);
  return (
    <>
      <AnimatePresence>{!booted && <Boot onDone={done} />}</AnimatePresence>
      <GraphCanvas />
      {/* Radial vignette */}
      <div className="fixed inset-0 pointer-events-none z-[1]"
        style={{ background:"radial-gradient(ellipse at 50% 40%, transparent 35%, rgba(14,14,13,0.65) 100%)" }} />
      <motion.div className="relative"
        initial={{ opacity:0 }} animate={booted?{opacity:1}:{opacity:0}} transition={{ duration:1 }}>
        <Hero />
        <Divider />
        <SectionAwareness />
        <Divider />
        <SectionReasoning />
        <Divider />
        <SectionDecision />
        <Divider />
        <SectionMission />
        <Footer />
      </motion.div>
    </>
  );
}
