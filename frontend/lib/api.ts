const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function req<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...opts.headers },
    ...opts,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status}: ${text || path}`);
  }
  return res.json();
}

export const api = {
  health:          () => req("/health"),
  demoToken:       () => req("/api/auth/demo-token", { method: "POST" }),
  stats:           () => req("/api/projects/current/dashboard-stats"),
  project:         () => req("/api/projects/current"),
  assets:          () => req("/api/projects/current/assets"),
  procurement:     () => req("/api/projects/current/procurement"),
  ncrs:            () => req("/api/projects/current/ncrs"),
  seed:            () => req("/api/projects/current/seed", { method: "POST" }),
  runAnalysis:     (body: object) => req("/api/analysis/run", { method: "POST", body: JSON.stringify(body) }),
  procurementDelay:(body: object) => req("/api/analysis/procurement-delay", { method: "POST", body: JSON.stringify(body) }),
  downstreamImpact:(tag: string)  => req(`/api/analysis/downstream-impact/${tag}`),
  delayedAssets:   ()             => req("/api/analysis/delayed-assets"),
  assetContext:    (tag: string)  => req(`/api/analysis/asset/${tag}`),
  documents:       ()             => req("/api/documents/"),
  searchDocuments: (query: string)=> req("/api/documents/search", { method: "POST", body: JSON.stringify({ query }) }),
  uploadDocument:  (fd: FormData) => fetch(`${BASE}/api/documents/upload`, { method: "POST", body: fd }).then(r => r.json()),
  suggestedPrompts:()             => req("/api/chat/suggested-prompts"),
};

export async function streamChat(
  message: string,
  history: { role: string; content: string }[],
  onToken: (t: string) => void,
  onDone: (meta: { tokens: number; confidence: number }) => void,
  onError: (e: string) => void,
  onRetrieval?: (msg: string) => void,
) {
  try {
    const res = await fetch(`${BASE}/api/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history }),
    });
    if (!res.ok) throw new Error(`Chat stream failed: ${res.status}`);
    if (!res.body) throw new Error("No response body");
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const event = JSON.parse(line.slice(6));
          if (event.type === "token")     onToken(event.content);
          if (event.type === "done")      onDone({ tokens: event.tokens, confidence: event.confidence });
          if (event.type === "error")     onError(event.content);
          if (event.type === "retrieval") onRetrieval?.(event.content);
        } catch {}
      }
    }
  } catch (e: any) {
    onError(e.message || "Stream error");
  }
}
