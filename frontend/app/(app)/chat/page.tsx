"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { streamChat, api } from "@/lib/api";
import { Card, Button, Badge, Spinner, ThinkingDots, cn } from "@/components/ui/index";
import { Send, Zap } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  retrievalNote?: string;
  confidence?: number;
  tokens?: number;
  loading?: boolean;
}

const QUICK_PROMPTS = [
  "What will delay this project most in the next 30 days?",
  "What is the full downstream impact of the AHU-C12 delay?",
  "Find alternative suppliers for AHU-C12 with faster lead times",
  "Which NCRs are most likely to affect Tier IV certification?",
  "What is the most realistic completion date given current risks?",
  "Explain the Transformer T-2B non-conformance and its implications",
  "What does TIA-942 Tier IV require for UPS autonomy?",
  "How can we recover 10 days on the mechanical commissioning sequence?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello. I'm SiteAI — your AI Project Director for Mumbai HYP-1.\n\nI have full context of this project: 14,200 indexed documents, the Engineering Knowledge Graph with 40,000+ asset relationships, procurement data, NCR records, and commissioning procedures.\n\nAsk me anything. I'll reason from evidence, not guesswork.",
      confidence: 1.0,
    },
  ]);
  const [input, setInput]       = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || streaming) return;
    setInput("");

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: msg };
    const asstId = (Date.now() + 1).toString();
    const asstMsg: Message = { id: asstId, role: "assistant", content: "", loading: true };

    setMessages(prev => [...prev, userMsg, asstMsg]);
    setStreaming(true);

    const history = messages
      .filter(m => m.role !== "assistant" || m.content)
      .slice(-8)
      .map(m => ({ role: m.role, content: m.content }));

    await streamChat(
      msg, history,
      (token) => {
        setMessages(prev => prev.map(m =>
          m.id === asstId ? { ...m, content: m.content + token, loading: false } : m
        ));
      },
      ({ tokens, confidence }) => {
        setMessages(prev => prev.map(m =>
          m.id === asstId ? { ...m, tokens, confidence, loading: false } : m
        ));
        setStreaming(false);
      },
      (err) => {
        setMessages(prev => prev.map(m =>
          m.id === asstId ? { ...m, content: `Error: ${err}\n\nIs the backend running? Check http://localhost:8000/health`, loading: false } : m
        ));
        setStreaming(false);
      },
      (retrieval) => {
        setMessages(prev => prev.map(m =>
          m.id === asstId ? { ...m, retrievalNote: retrieval } : m
        ));
      },
    );
  }, [input, messages, streaming]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border bg-surface">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-text">AI Chat</h1>
            <p className="text-xs text-muted">Streaming · GraphRAG grounded · Evidence-cited</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="accent"><Zap size={10} />Claude Sonnet</Badge>
            <Badge variant="purple">GraphRAG</Badge>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map(m => (
          <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-lg bg-gradient-accent flex items-center justify-center flex-shrink-0 mr-3 mt-1 shadow-glow-accent">
                <Zap size={12} className="text-white" />
              </div>
            )}
            <div className={cn("max-w-[75%] rounded-xl px-4 py-3 text-sm leading-relaxed",
              m.role === "user"
                ? "bg-gradient-accent text-white rounded-br-sm"
                : "bg-surface border border-border text-text rounded-bl-sm")}>
              {m.retrievalNote && !m.loading && (
                <div className="text-[10px] text-muted mb-2 pb-2 border-b border-border flex items-center gap-1">
                  <span className="text-accent">⚡</span>{m.retrievalNote}
                </div>
              )}
              {m.loading ? (
                <div className="flex items-center gap-2 text-muted">
                  {m.retrievalNote ? <><Spinner size="xs" />Reasoning…</> : <><span className="text-[10px]">Searching knowledge base…</span><ThinkingDots /></>}
                </div>
              ) : (
                <div className="whitespace-pre-wrap">{m.content}</div>
              )}
              {m.confidence !== undefined && !m.loading && m.role === "assistant" && m.id !== "welcome" && (
                <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-border">
                  <span className="text-[10px] text-muted">Confidence: <span className="text-success font-bold">{Math.round(m.confidence * 100)}%</span></span>
                  {m.tokens && <span className="text-[10px] text-muted">{m.tokens} tokens</span>}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <div className="flex-shrink-0 px-6 pb-3">
          <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">Suggested prompts</div>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((p, i) => (
              <button key={i} onClick={() => send(p)}
                className="text-[11px] px-3 py-1.5 rounded-full bg-surface2 border border-border text-dim hover:text-text hover:border-border2 hover:bg-surface3 transition-all">
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-border bg-surface">
        <div className="flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about risks, procurement, specs, schedule, NCRs…"
            rows={1}
            disabled={streaming}
            className="flex-1 bg-surface2 border border-border2 rounded-xl text-text text-sm px-4 py-3 resize-none outline-none placeholder:text-muted focus:border-accent/50 transition-colors min-h-[44px] max-h-[120px] disabled:opacity-50"
            style={{ height: "auto" }}
            onInput={e => {
              const t = e.target as HTMLTextAreaElement;
              t.style.height = "auto";
              t.style.height = Math.min(t.scrollHeight, 120) + "px";
            }}
          />
          <Button variant="primary" size="icon" onClick={() => send()} disabled={streaming || !input.trim()}
            className="w-11 h-11 flex-shrink-0">
            {streaming ? <Spinner size="sm" /> : <Send size={15} />}
          </Button>
        </div>
        <div className="text-[10px] text-muted mt-2">Enter to send · Shift+Enter for new line · Grounded in 14,200 project documents</div>
      </div>
    </div>
  );
}
