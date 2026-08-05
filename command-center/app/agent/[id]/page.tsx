"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ApiError,
  api,
  ensureServerId,
  getToken,
  relTime,
  runtimeGlyph,
  signedAvatar,
  dotFor,
  dotLabel,
} from "../../../lib/api";
import type { ActivityItem, Agent, Machine, Skill } from "../../../lib/types";
import SignInGate from "../../../components/gate";

const TRACE_POLL_MS = 4000;

function traceIcon(kind: string, toolName?: string | null): string {
  if (kind === "tool_start") return toolName === "git:diff" ? "🔀" : "🛠";
  if (kind === "thinking") return "💭";
  if (kind === "working") return "⚡";
  if (kind === "task") return "📋";
  if (kind === "deliverable") return "📦";
  return "•";
}

export default function AgentPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const [phase, setPhase] = useState<"boot" | "ready" | "no-token" | "expired" | "error">("boot");
  const [error, setError] = useState("");
  const [agent, setAgent] = useState<Agent | null>(null);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [trace, setTrace] = useState<ActivityItem[]>([]);
  const [lastRefresh, setLastRefresh] = useState(0);

  const load = useCallback(async () => {
    const sid = await ensureServerId();
    const [ag, mc, sk, log] = await Promise.all([
      api<Agent>(`/api/agents/${id}`),
      api<{ machines: Machine[] }>(`/api/servers/${sid}/machines`),
      api<Skill[]>("/api/skills"),
      api<ActivityItem[]>(`/api/agents/${id}/activity-log?limit=80`).catch(() => []),
    ]);
    setAgent(ag);
    setMachines(Array.isArray(mc?.machines) ? mc.machines : []);
    setSkills(Array.isArray(sk) ? sk : []);
    setTrace(Array.isArray(log) ? log : []);
    setLastRefresh(Date.now());
  }, [id]);

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
      else if (e instanceof ApiError && e.status === 404) {
        setPhase("error");
        setError("Agent not found.");
      } else {
        setPhase("error");
        setError(e instanceof Error ? e.message : String(e));
      }
    }
  }, [load]);

  useEffect(() => {
    boot();
    const t = setInterval(() => {
      load().catch((e) => {
        if (e instanceof ApiError && e.status === 401) setPhase("expired");
        else setError(e instanceof Error ? e.message : String(e));
      });
    }, TRACE_POLL_MS);
    return () => clearInterval(t);
  }, [boot, load]);

  if (phase === "no-token" || phase === "expired") return <SignInGate reason={phase} />;
  if (phase === "boot" || !agent)
    return <div className="min-h-screen flex items-center justify-center" style={{ color: "var(--muted)" }}>Loading agent…</div>;

  const machine = machines.find((m) => m.id === agent.machineId);
  const agentSkills = skills.filter((s) => s.assignedTo.includes(agent.name));
  const dot = dotFor(agent);

  return (
    <div className="min-h-screen p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <Link href="/" className="btn ghost">← Command Center</Link>
          <h1 className="text-2xl" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
            {agent.displayName || agent.name}
          </h1>
        </div>
        <div className="text-xs" style={{ color: "var(--muted)" }}>
          trace updated {relTime(lastRefresh)}
        </div>
      </header>

      {phase === "error" && (
        <div className="mb-4 text-sm" style={{ color: "var(--err)", background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 12, padding: "10px 14px" }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        {/* Role card */}
        <section className="card self-start" style={{ padding: 24 }}>
          <div className="flex items-center gap-4 mb-4">
            {signedAvatar(agent.avatarUrl) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={signedAvatar(agent.avatarUrl)!} alt="" className="avatar lg" />
            ) : (
              <div className="avatar lg" style={{ background: "var(--surface-strong)" }}>{runtimeGlyph(agent.runtime)}</div>
            )}
            <div className="min-w-0">
              <div className="text-lg font-semibold">{agent.displayName || agent.name}</div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>@{agent.name}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <span className={`dot ${dot}`} />
            <span className="badge">{dotLabel(dot)}</span>
            <span className="badge neutral">{agent.runtime}</span>
            {agent.model && <span className="badge neutral">{agent.model}</span>}
          </div>

          {agent.description && (
            <p className="text-sm mb-4" style={{ color: "var(--muted)", lineHeight: 1.5 }}>{agent.description}</p>
          )}

          <dl className="text-sm space-y-2 mb-4">
            <Row k="Status" v={`${agent.status}${agent.activity ? ` · ${agent.activity}` : ""}`} />
            <Row k="Machine" v={machine ? (machine.name || machine.hostname || machine.id) : (agent.machineId ? agent.machineId.slice(0, 8) : "unbound")} />
            {agent.projectBound && <Row k="Project" v="bound" />}
          </dl>

          <h3 className="section-title">Skills</h3>
          {agentSkills.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--muted)" }}>No skills assigned yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {agentSkills.map((s) => (
                <span key={s.id} className="badge" title={s.description || ""}>{s.name}</span>
              ))}
            </div>
          )}
        </section>

        {/* Live execution trace */}
        <section>
          <h2 className="section-title">Live execution trace</h2>
          <div className="card" style={{ padding: 0 }}>
            {trace.length === 0 ? (
              <p className="p-6 text-sm" style={{ color: "var(--muted)" }}>
                No activity yet. Watch the trace fill in as this agent works.
              </p>
            ) : (
              <ul className="trace-list">
                {trace.slice().reverse().map((it, i) => {
                  const e = it.entry;
                  return (
                    <li key={`${it.timestamp}:${i}`} className="trace-item">
                      <div className="trace-time">{time(it.timestamp)}</div>
                      <div className="trace-icon">{traceIcon(e?.kind || "", e?.toolName)}</div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm">
                          {e?.kind === "tool_start" && e.toolName ? (
                            <span>ran <code className="trace-code">{e.toolName}</code></span>
                          ) : (
                            <span>{e?.activity || e?.kind || "activity"}</span>
                          )}
                        </div>
                        {(e?.text || e?.detail) && (
                          <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{e.text || e.detail}</div>
                        )}
                        {e?.toolInput && (
                          <pre className="trace-input">{String(e.toolInput).slice(0, 200)}{String(e.toolInput).length > 200 ? "…" : ""}</pre>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-20 shrink-0" style={{ color: "var(--muted)" }}>{k}</dt>
      <dd className="m-0 truncate" style={{ color: "var(--ink)" }}>{v}</dd>
    </div>
  );
}

function time(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
