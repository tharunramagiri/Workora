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
import type { ActivityItem, Agent, Machine, Skill, Task } from "../../../lib/types";
import { runMap } from "../../../lib/rungraph";
import SignInGate from "../../../components/gate";
import Sidebar from "../../../components/sidebar";

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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lastRefresh, setLastRefresh] = useState(0);

  const load = useCallback(async () => {
    const sid = await ensureServerId();
    const [ag, mc, sk, log, tk] = await Promise.all([
      api<Agent>(`/api/agents/${id}`),
      api<{ machines: Machine[] }>(`/api/servers/${sid}/machines`),
      api<Skill[]>("/api/skills"),
      api<ActivityItem[]>(`/api/agents/${id}/activity-log?limit=80`).catch(() => []),
      api<{ tasks: Task[] }>("/api/tasks/server").catch(() => ({ tasks: [] })),
    ]);
    setAgent(ag);
    setMachines(Array.isArray(mc?.machines) ? mc.machines : []);
    setSkills(Array.isArray(sk) ? sk : []);
    setTrace(Array.isArray(log) ? log : []);
    setTasks(Array.isArray(tk?.tasks) ? tk.tasks : []);
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
    return <div className="min-h-screen flex items-center justify-center" style={{ color: "var(--muted-foreground)" }}>Loading agent…</div>;

  const machine = machines.find((m) => m.id === agent.machineId);
  const agentSkills = skills.filter((s) => s.assignedTo.includes(agent.name));
  const dot = dotFor(agent);
  const run = runMap(trace);
  const assignedTasks = tasks.filter((t) => t.taskAssigneeId === agent.id);

  return (
    <div className="flex min-h-screen" style={{ background: "var(--background)" }}>
      <Sidebar agents={[agent]} activeLabel={agent.displayName || agent.name} />

      <div className="glass-bg flex min-w-0 flex-1 flex-col">
        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-8 md:py-12">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href="/" className="nav-item" style={{ width: "auto" }} aria-label="Back to command center">
                ←
              </Link>
              <h1 className="display" style={{ color: "var(--foreground)" }}>
                {agent.displayName || agent.name}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                trace updated {relTime(lastRefresh)}
              </span>
              <button className="btn" onClick={() => load().catch(() => {})} aria-label="Refresh trace">
                ↻ Refresh
              </button>
            </div>
          </header>

          {phase === "error" && (
            <div className="text-sm" style={{ color: "var(--err)", background: "rgba(249,68,68,0.08)", border: "1px solid rgba(249,68,68,0.3)", borderRadius: 12, padding: "10px 14px" }}>
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
            {/* Role card */}
            <section className="card self-start p-5">
              <div className="flex items-center gap-4">
                {signedAvatar(agent.avatarUrl) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={signedAvatar(agent.avatarUrl)!} alt="" className="avatar lg" />
                ) : (
                  <div className="avatar lg">{runtimeGlyph(agent.runtime)}</div>
                )}
                <div className="min-w-0">
                  <div className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>{agent.displayName || agent.name}</div>
                  <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>@{agent.name}</div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                <span className={`chip ${dot === "working" ? "ok" : dot === "thinking" ? "warn" : dot === "offline" ? "err" : ""}`}>
                  <span className={`dot ${dot}`} /> {dotLabel(dot)}
                </span>
                <span className="chip">{agent.runtime}</span>
                {agent.model && <span className="chip">{agent.model}</span>}
              </div>

              {agent.description && (
                <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                  {agent.description}
                </p>
              )}

              <dl className="mt-4 space-y-2 text-sm">
                <Row k="Status" v={`${agent.status}${agent.activity ? ` · ${agent.activity}` : ""}`} />
                <Row k="Machine" v={machine ? (machine.name || machine.hostname || machine.id) : (agent.machineId ? agent.machineId.slice(0, 8) : "unbound")} />
                {agent.projectBound && <Row k="Project" v="bound" />}
              </dl>

              <h3 className="mt-5 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                Skills
              </h3>
              {agentSkills.length === 0 ? (
                <p className="mt-2 text-xs" style={{ color: "var(--muted-foreground)" }}>No skills assigned yet.</p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {agentSkills.map((s) => (
                    <span key={s.id} className="chip accent" title={s.description || ""}>{s.name}</span>
                  ))}
                </div>
              )}
            </section>

            {/* Live execution trace */}
            <section>
              <h2 className="mb-3 text-lg font-medium" style={{ color: "var(--foreground)" }}>Live execution trace</h2>

              {/* Run graph — control flow you can see (graph-engineering) */}
              {run.nodes.length > 0 && (
                <div className="card mb-4 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                      Run map
                    </span>
                    <span className="chip">
                      {run.total} steps{run.retries > 0 ? ` · ${run.retries} retry loop${run.retries > 1 ? "s" : ""}` : ""}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {run.nodes.map((n, i) => (
                      <span key={n.id} className="flex items-center gap-1.5">
                        {i > 0 && <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>→</span>}
                        <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                          <span>{n.icon}</span>
                          <span className="truncate max-w-[140px]">{n.label}</span>
                          {n.retries > 0 && (
                            <span className="chip warn" title={`retried ${n.retries}×`}>↻ {n.retries}</span>
                          )}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Assigned work — the agent's open goals (goal-engineering) */}
              <div className="card mb-4 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                    Assigned work
                  </span>
                  <span className="chip">{assignedTasks.length}</span>
                </div>
                {assignedTasks.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>No tasks assigned to this agent yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {assignedTasks.map((t) => (
                      <li key={t.id} className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm" style={{ background: "rgba(255,255,255,0.03)" }}>
                        <span className="min-w-0 truncate" style={{ color: "var(--foreground)" }}>
                          <span className="chip accent mr-2">#{t.taskNumber}</span>{t.content}
                        </span>
                        <span className={`chip ${t.taskStatus === "done" ? "ok" : t.taskStatus === "in_review" ? "warn" : ""}`}>
                          {t.taskStatus || "todo"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="card p-0">
                {trace.length === 0 ? (
                  <p className="p-6 text-sm" style={{ color: "var(--muted-foreground)" }}>
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
                              <div className="mt-0.5 text-xs" style={{ color: "var(--muted-foreground)" }}>{e.text || e.detail}</div>
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
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-20 shrink-0" style={{ color: "var(--muted-foreground)" }}>{k}</dt>
      <dd className="m-0 truncate" style={{ color: "var(--foreground)" }}>{v}</dd>
    </div>
  );
}

function time(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
