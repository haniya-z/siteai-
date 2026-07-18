import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // App shell palette (dashboard, analysis, chat etc.)
        bg:       "#080c18",
        surface:  "#0d1424",
        surface2: "#111a2e",
        surface3: "#162038",
        border:   "#1a2a42",
        border2:  "#243450",
        accent:   "#0ea5e9",
        purple:   "#8b5cf6",
        success:  "#10b981",
        warning:  "#f59e0b",
        danger:   "#ef4444",
        text:     "#e2e8f0",
        muted:    "#64748b",
        dim:      "#94a3b8",
        // Homepage / industrial palette
        void:     "#0e0e0d",
        graphite: "#141412",
        charcoal: "#1c1c19",
        concrete: "#252520",
        titanium: "#2e2e28",
        steel:    "#3d3d35",
        stone:    "#55554a",
        dust:     "#7a7a6e",
        ash:      "#a0a090",
        chalk:    "#c8c8b8",
        ivory:    "#e8e8d8",
        amber:    "#d4a843",
        "amber-glow": "#f0c060",
        copper:   "#8b5e3c",
        emerald:  "#3d7a5a",
      },
      boxShadow: {
        "glow-accent":  "0 0 20px rgba(14,165,233,0.15)",
        "glow-purple":  "0 0 20px rgba(139,92,246,0.15)",
        "glow-success": "0 0 20px rgba(16,185,129,0.15)",
        "glow-amber":   "0 0 30px rgba(212,168,67,0.12)",
        "card":         "0 4px 24px rgba(0,0,0,0.4)",
        "card-hover":   "0 8px 40px rgba(0,0,0,0.6)",
      },
      animation: {
        "fade-in":    "fadeIn 0.3s ease-out",
        "slide-up":   "slideUp 0.4s ease-out",
        "shimmer":    "shimmer 1.5s infinite",
        "thinking":   "thinking 1.4s ease-in-out infinite",
        "count":      "countUp 0.8s ease-out forwards",
      },
      keyframes: {
        fadeIn:   { from:{ opacity:"0" },                           to:{ opacity:"1" } },
        slideUp:  { from:{ opacity:"0", transform:"translateY(12px)" }, to:{ opacity:"1", transform:"translateY(0)" } },
        shimmer:  { "0%,100%":{ opacity:"0.4" },                    "50%":{ opacity:"1" } },
        thinking: { "0%,100%":{ opacity:"0.2", transform:"scale(0.8)" }, "50%":{ opacity:"1", transform:"scale(1.2)" } },
        countUp:  { from:{ opacity:"0", transform:"translateY(8px)" }, to:{ opacity:"1", transform:"translateY(0)" } },
      },
      backgroundImage: {
        "gradient-accent":  "linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)",
        "gradient-danger":  "linear-gradient(135deg, #ef4444 0%, #f97316 100%)",
        "gradient-success": "linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)",
        "gradient-amber":   "linear-gradient(135deg, #f0c060 0%, #d4a843 50%, #8b5e3c 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
