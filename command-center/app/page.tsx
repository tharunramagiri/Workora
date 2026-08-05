"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  type Dot,
} from "../lib/api";
import type { ActivityItem, Agent, Machine, Skill, Task } from "../lib/types";
import { activityEntries, mergeFeed, statusEntries, taskEntries, type FeedEntry } from "../lib/feed";
import SignInGate from "../components/gate";

const POLL_MS = 5000;

function isVisible(a: Agent): boolean {
  return a.creatorType !== "system";
}

export default function CommandCenterHome() {
  const [phase, setPhase] = useState<"boot" | "ready" | "no-token" | "expired" | "error">("boot");
  const [error, setError] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [workspace, setWorkspace] = useState("");
  const [lastRefresh, setLastRefresh] = useState(0);

  const prevAgents = useRef<Agent[] | null>(null);
  const prevTasks = useRef<Task[] | null>(null);
  // Accumulating, deduped feed: each poll appends new entries instead of
  // replacing the stream, so status/task changes stay visible.
  const feedRef = useRef<FeedEntry[]>([]);

  const visible = agents.filter(isVisible);

  const load = useCallback(async () => {
    const now = Date.now();
    const [ag, mc, tk, sk] = await Promise.all([
      api<Agent[]>("/api/agents"),
      api<{ machines: Machine[] }>(`/api/servers/${await ensureServerId()}/machines`),
      api<{ tasks: Task[] }>("/api/tasks/server"),
      api<Skill[]>("/api/skills"),
    ]);
    const nextAgents = Array.isArray(ag) ? ag : [];
    const nextTasks = Array.isArray(tk?.tasks) ? tk.tasks : [];
    setAgents(nextAgents);
    setMachines(Array.isArray(mc?.machines) ? mc.machines : []);
    setTasks(nextTasks);
    setSkills(Array.isArray(sk) ? sk : []);

    // Feed: status changes (skip the first snapshot), task moves, agent activity.
    const entries: FeedEntry[] = [];
    if (prevAgents.current) entries.push(...statusEntries(prevAgents.current, nextAgents, now));
    if (prevTasks.current) {
      const resolveName = (t: Task): string => {
        if (!t.taskAssigneeId) return "someone";
        const a = nextAgents.find((x) => x.id === t.taskAssigneeId);
        return a ? a.displayName || a.name : t.taskAssigneeId.slice(0, 8);
      };
      entries.push(...taskEntries(prevTasks.current, nextTasks, resolveName, now));
    }
    prevAgents.current = nextAgents;
    prevTasks.current = nextTasks;

    // Per-agent activity (top of each log, newest first).
    const logs = await Promise.all(
      nextAgents.filter(isVisible).slice(0, 12).map(async (a) => {
        try {
          const rows = await api<ActivityItem[]>(`/api/agents/${a.id}/activity-log?limit=4`);
          return activityEntries(a, Array.isArray(rows) ? rows : []);
        } catch {
          return [] as FeedEntry[];
        }
      }),
    );
    for (const batch of logs) entries.push(...batch);

    // Merge new entries into the accumulated stream, newest first, deduped,
    // capped. Dedupe keeps the newest occurrence of each id (mergeFeed sorts
    // newest-first before we filter).
    const merged = mergeFeed([...entries, ...feedRef.current]);
    const seen = new Set<string>();
    const nextFeed = merged.filter((e) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });
    feedRef.current = nextFeed;
    setFeed(nextFeed);
    setLastRefresh(now);
  }, []);

  const boot = useCallback(async () => {
    if (!getToken()) {
      setPhase("no-token");
      return;
    }
    try {
      const sid = await ensureServerId();
      setWorkspace(sid);
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
    const t = setInterval(() => {
      load().catch((e) => {
        if (e instanceof ApiError && e.status === 401) setPhase("expired");
        else setError(e instanceof Error ? e.message : String(e));
      });
    }, POLL_MS);
    return () => clearInterval(t);
  }, [boot, load]);

  if (phase === "no-token" || phase === "expired") return <SignInGate reason={phase} />;
  if (phase === "boot") return <div className="min-h-screen flex items-center justify-center" style={{ color: "var(--muted)" }}>Booting command center…</div>;

  const machinesOnline = machines.filter((m) => m.status === "online").length;
  const working = visible.filter((a) => dotFor(a) === "working").length;
  const thinking = visible.filter((a) => dotFor(a) === "thinking").length;
  const sleeping = visible.filter((a) => dotFor(a) === "sleeping").length;
  const offline = visible.filter((a) => dotFor(a) === "offline").length;
  const openTasks = tasks.filter((t) => t.taskStatus && t.taskStatus !== "done" && t.taskStatus !== "closed").length;

  const skillNames = new Map<string, string[]>();
  for (const s of skills) for (const n of s.assignedTo) {
    const arr = skillNames.get(n) || [];
    arr.push(s.name);
    skillNames.set(n, arr);
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
            Workora <span style={{ color: "var(--accent)" }}>Command Center</span>
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            {workspace.slice(0, 8)} · live · last refresh {relTime(lastRefresh) || "—"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://office.ramagiritharun.in"
            target="_blank"
            rel="noreferrer"
            className="btn ghost"
          >
            Open Workora ↗
          </a>
          <button className="btn" onClick={() => load().catch(() => {})}>
            ↻ Refresh
          </button>
        </div>
      </header>

      {phase === "error" && (
        <div className="mb-4 text-sm" style={{ color: "var(--err)", background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 12, padding: "10px 14px" }}>
          {error}
        </div>
      )}

      {/* Company pulse */}
      <section className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        <PulseCard label="Agents" value={visible.length} icon="🤖" />
        <PulseCard label="Working now" value={working} icon="⚡" color="var(--ok)" />
        <PulseCard label="Thinking" value={thinking} icon="💭" color="var(--warn)" />
        <PulseCard label="Sleeping" value={sleeping} icon="🌙" color="var(--muted)" />
        <PulseCard label="Offline" value={offline} icon="🔴" color="var(--err)" />
        <PulseCard label="Machines online" value={machinesOnline} icon="🖥" />
      </section>
      <section className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mb-8">
        <PulseCard label="Open tasks" value={openTasks} icon="📋" accent />
        <PulseCard label="Tasks done" value={tasks.length - openTasks} icon="✅" />
        <PulseCard label="Skills catalog" value={skills.length} icon="🧩" />
      </section>

      {/* Roster + feed */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
        <section>
          <h2 className="section-title">Agent roster</h2>
          {visible.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>
              No agents yet — create agents in Workora, then watch them appear here live.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visible.map((a) => (
                <Link key={a.id} href={`/agent/${a.id}`} className="agent-card">
                  <div className="flex items-center gap-3 mb-3">
                    {signedAvatar(a.avatarUrl) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={signedAvatar(a.avatarUrl)!} alt="" className="avatar" />
                    ) : (
                      <div className="avatar" style={{ background: "var(--surface-strong)" }}>
                        {runtimeGlyph(a.runtime)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate" style={{ color: "var(--ink)" }}>
                        {a.displayName || a.name}
                      </div>
                      <div className="text-xs" style={{ color: "var(--muted)" }}>
                        @{a.name} · {a.runtime}
                      </div>
                    </div>
                    <span className={`dot ${dotFor(a)}`} title={`${dotLabel(dotFor(a))} · ${a.activity || a.status}`} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="badge">{dotLabel(dotFor(a))}</span>
                    {a.model && (
                      <span className="badge neutral">{a.model}</span>
                    )}
                    {(skillNames.get(a.name) || []).slice(0, 3).map((s) => (
                      <span key={s} className="badge neutral" title={s}>
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs mt-3" style={{ color: "var(--muted)" }}>
                    {a.activity ? `last: ${a.activity}` : a.status}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <aside>
          <h2 className="section-title">Live activity</h2>
          <div className="feed">
            {feed.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Nothing yet. Activity streams in as agents work.
              </p>
            ) : (
              feed.map((f) => <FeedRow key={f.id} f={f} />)
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function PulseCard({ label, value, icon, color, accent }: { label: string; value: number; icon: string; color?: string; accent?: boolean }) {
  return (
    <div className="pulse-card" style={accent ? { borderColor: "rgba(249,115,22,0.4)", background: "linear-gradient(180deg, var(--accent-soft), transparent)" } : undefined}>
      <div className="text-xs" style={{ color: "var(--muted)" }}>{icon} {label}</div>
      <div className="text-2xl font-semibold mt-1" style={{ color: color || "var(--ink)" }}>{value}</div>
    </div>
  );
}

function FeedRow({ f }: { f: FeedEntry }) {
  const icon = f.icon ?? (f.kind === "task" ? "📋" : f.kind === "status" ? (f.dot === "working" ? "⚡" : f.dot === "thinking" ? "💭" : f.dot === "sleeping" ? "🌙" : "🔴") : "•");
  return (
    <div className="feed-item">
      <div className="flex items-start gap-3">
        <div className="feed-icon">{icon}</div>
        <div className="min-w-0 flex-1">
          <div className="text-sm" style={{ color: "var(--ink)" }}>
            {f.agentName ? <span className="font-medium">{f.agentName}</span> : null}{" "}
            <span style={{ color: "var(--muted)" }}>{f.title}</span>
          </div>
          {f.detail && <div className="text-xs mt-0.5 truncate" style={{ color: "var(--muted)" }}>{f.detail}</div>}
          <div className="text-[11px] mt-1" style={{ color: "var(--muted)" }}>{relTime(f.ts)}</div>
        </div>
      </div>
    </div>
  );
}
