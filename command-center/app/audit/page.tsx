"use client";

// Cross-agent audit (fleet-engineering): answer "which agent did it, with what
// authority, against what task, evidenced by what?" across every agent's
// activity log in one searchable stream.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ApiError,
  api,
  ensureServerId,
  getToken,
  relTime,
} from "../../lib/api";
import type { ActivityItem, Agent } from "../../lib/types";
import SignInGate from "../../components/gate";
import Sidebar from "../../components/sidebar";

type AuditRow = {
  agentId: string;
  agentName: string;
  runtime: string;
  ts: number;
  kind: string;
  toolName?: string | null;
  text?: string | null;
  detail?: string | null;
  activity?: string | null;
};

export default function AuditPage() {
  const [phase, setPhase] = useState<"boot" | "ready" | "no-token" | "expired" | "error">("boot");
  const [error, setError] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [query, setQuery] = useState("");
  const [agentFilter, setAgentFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const sid = await ensureServerId();
    const [ag] = await Promise.all([api<Agent[]>("/api/agents")]);
    const list = Array.isArray(ag) ? ag.filter((a) => a.creatorType !== "system") : [];
    setAgents(list);

    setLoading(true);
    try {
      const perAgent = await Promise.all(
        list.map(async (a) => {
          try {
            const log = await api<ActivityItem[]>(`/api/agents/${a.id}/activity-log?limit=100`);
            return (Array.isArray(log) ? log : []).map((it) => ({
              agentId: a.id,
              agentName: a.displayName || a.name,
              runtime: a.runtime,
              ts: it.timestamp * 1000,
              kind: it.entry?.kind || "activity",
              toolName: it.entry?.toolName ?? null,
              text: it.entry?.text ?? null,
              detail: it.entry?.detail ?? null,
              activity: it.entry?.activity ?? null,
            }));
          } catch {
            return [] as AuditRow[];
          }
        }),
      );
      setRows(perAgent.flat().sort((a, b) => b.ts - a.ts));
    } finally {
      setLoading(false);
    }
  }, []);

  const boot = useCallback(async () => {
    if (!getToken()) {
      setPhase("no-token");
      return;
    }
    try {
      await load();
      setPhase("ready");
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setPhase("expired");
      else {
        setPhase("error");
        setError(e instanceof Error ? e.message : String(e));
      }
    }
  }, [load]);

  useEffect(() => {
    boot();
    const t = setInterval(() => load().catch(() => {}), 20000);
    return () => clearInterval(t);
  }, [boot, load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (agentFilter && r.agentId !== agentFilter) return false;
      if (!q) return true;
      const hay = [r.kind, r.toolName, r.text, r.detail, r.activity, r.agentName].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [rows, query, agentFilter]);

  if (phase === "no-token" || phase === "expired") return <SignInGate reason={phase} />;
  if (phase === "boot")
    return <div className="min-h-screen flex items-center justify-center" style={{ color: "var(--muted-foreground)" }}>Loading audit…</div>;

  const byAgent = new Map<string, number>();
  for (const r of rows) byAgent.set(r.agentId, (byAgent.get(r.agentId) || 0) + 1);

  return (
    <div className="flex min-h-screen" style={{ background: "var(--background)" }}>
      <Sidebar agents={agents} activeLabel="Audit" />

      <div className="glass-bg flex min-w-0 flex-1 flex-col">
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8 md:py-12">
          <header>
            <h1 className="display" style={{ color: "var(--foreground)" }}>Audit</h1>
            <p className="mt-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
              Every agent action, one searchable stream — which agent, what authority, what task, what evidence. {rows.length} events.
            </p>
          </header>

          {phase === "error" && error && (
            <div className="text-sm" style={{ color: "var(--err)", background: "rgba(249,68,68,0.08)", border: "1px solid rgba(249,68,68,0.3)", borderRadius: 12, padding: "10px 14px" }}>
              {error}
            </div>
          )}

          {/* Per-agent volume (fleet budget guard proxy) */}
          <div className="flex flex-wrap gap-2">
            {agents.map((a) => (
              <button
                key={a.id}
                className={`chip ${agentFilter === a.id ? "accent" : ""}`}
                style={{ cursor: "pointer", border: agentFilter === a.id ? "1px solid rgba(178,208,250,0.5)" : "1px solid var(--border-strong)" }}
                onClick={() => setAgentFilter(agentFilter === a.id ? "" : a.id)}
                title="Filter by agent"
              >
                {a.displayName || a.name} · {byAgent.get(a.id) || 0}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tools, messages, kinds… (e.g. git:diff, thinking, deploy)"
                className="w-full rounded-lg border px-3 py-2 pl-9 text-sm"
                style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)", outline: "none" }}
                aria-label="Search audit log"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--muted-foreground)" }}>⌕</span>
            </div>
            <span className="chip self-center">{loading ? "loading…" : `${filtered.length} results`}</span>
          </div>

          {/* Stream */}
          <div className="card p-2">
            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
                {loading ? "Loading…" : "No matching events."}
              </p>
            ) : (
              <ul className="max-h-[65vh] overflow-y-auto">
                {filtered.map((r, i) => (
                  <li key={`${r.agentId}:${r.ts}:${i}`} className="flex items-start gap-3 border-b px-3 py-2.5" style={{ borderColor: "var(--border)" }}>
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs" style={{ background: "rgba(255,255,255,0.06)" }}>
                      {iconFor(r.kind, r.toolName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{r.agentName}</span>
                        <span className="chip">{r.runtime}</span>
                        <span className="chip accent">{r.kind}</span>
                        {r.toolName && <span className="chip">{r.toolName}</span>}
                      </div>
                      {(r.text || r.detail || r.activity) && (
                        <div className="mt-0.5 truncate text-xs" style={{ color: "var(--muted-foreground)" }}>
                          {r.text || r.detail || r.activity}
                        </div>
                      )}
                      <div className="mt-0.5 text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                        {new Date(r.ts).toLocaleString()} · {relTime(r.ts)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function iconFor(kind: string, toolName?: string | null): string {
  if (kind === "tool_start") return toolName === "git:diff" ? "🔀" : "🛠";
  if (kind === "thinking") return "💭";
  if (kind === "working") return "⚡";
  if (kind === "deliverable") return "📦";
  if (kind === "task") return "📋";
  return "•";
}
