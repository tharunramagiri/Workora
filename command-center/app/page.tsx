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
import Sidebar from "../components/sidebar";

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
    // capped. Dedupe keeps the newest occurrence of each id.
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
  if (phase === "boot")
    return <div className="min-h-screen flex items-center justify-center" style={{ color: "var(--muted-foreground)" }}>Booting command center…</div>;

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
    <div className="flex min-h-screen" style={{ background: "var(--background)" }}>
      <Sidebar agents={visible} activeLabel="Command Center" />

      <div className="glass-bg flex min-w-0 flex-1 flex-col">
        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-8 md:py-12">
          {/* Header / greeting */}
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="display" style={{ color: "var(--foreground)" }}>
                Let&apos;s get to work.
              </h1>
              <p className="mt-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
                See who&apos;s working, what&apos;s shipping, what&apos;s blocked.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {lastRefresh > 0 && (
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  updated {relTime(lastRefresh)}
                </span>
              )}
              <button className="btn" onClick={() => load().catch(() => {})} aria-label="Refresh roster">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
                </svg>
                Refresh
              </button>
            </div>
          </header>

          {phase === "error" && (
            <div className="text-sm" style={{ color: "var(--err)", background: "rgba(249,68,68,0.08)", border: "1px solid rgba(249,68,68,0.3)", borderRadius: 12, padding: "10px 14px" }}>
              {error}
            </div>
          )}

          {/* Company pulse */}
          <section className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            <PulseCard label="Agents" value={visible.length} />
            <PulseCard label="Working" value={working} color="var(--ok)" />
            <PulseCard label="Thinking" value={thinking} color="var(--warn)" />
            <PulseCard label="Sleeping" value={sleeping} />
            <PulseCard label="Offline" value={offline} color="var(--err)" />
            <PulseCard label="Machines" value={machinesOnline} />
          </section>

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_320px]">
            {/* Agent roster */}
            <section>
              <h2 className="mb-3 flex items-baseline justify-between">
                <span className="text-lg font-medium" style={{ color: "var(--foreground)" }}>Agent roster</span>
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{openTasks} open tasks</span>
              </h2>
              {visible.length === 0 ? (
                <div className="card p-8 text-center">
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                    No agents yet — create agents in Workora, then watch them appear here live.
                  </p>
                </div>
              ) : (
                <div className="columns-1 gap-3 sm:columns-2 lg:columns-3">
                  {visible.map((a) => (
                    <Link key={a.id} href={`/agent/${a.id}`} className="card card-hover mb-3 block break-inside-avoid p-0">
                      <div className="relative z-[2] flex flex-col p-4">
                        <div className="flex items-center gap-3">
                          {signedAvatar(a.avatarUrl) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={signedAvatar(a.avatarUrl)!} alt="" className="avatar" />
                          ) : (
                            <div className="avatar">{runtimeGlyph(a.runtime)}</div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium leading-tight" style={{ color: "var(--foreground)" }}>
                              {a.displayName || a.name}
                            </div>
                            <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                              @{a.name}
                            </div>
                          </div>
                          <span className={`dot ${dotFor(a)}`} title={`${dotLabel(dotFor(a))} · ${a.activity || a.status}`} />
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          <span className={`chip ${dotFor(a) === "working" ? "ok" : dotFor(a) === "thinking" ? "warn" : dotFor(a) === "offline" ? "err" : ""}`}>
                            {dotLabel(dotFor(a))}
                          </span>
                          <span className="chip">{a.runtime}</span>
                          {a.model && <span className="chip">{a.model}</span>}
                          {(skillNames.get(a.name) || []).slice(0, 2).map((s) => (
                            <span key={s} className="chip accent" title={s}>{s}</span>
                          ))}
                        </div>
                        <div className="mt-2 text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                          {a.activity ? `last: ${a.activity}` : a.status}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Activity feed */}
            <aside>
              <h2 className="mb-3 text-lg font-medium" style={{ color: "var(--foreground)" }}>Live activity</h2>
              <div className="card p-2">
                {feed.length === 0 ? (
                  <p className="px-3 py-4 text-sm" style={{ color: "var(--muted-foreground)" }}>
                    Nothing yet. Activity streams in as agents work.
                  </p>
                ) : (
                  feed.map((f) => <FeedRow key={f.id} f={f} />)
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

function PulseCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="pulse-card">
      <div className="label">{label}</div>
      <div className="value" style={{ color: color || "var(--foreground)" }}>{value}</div>
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
          <div className="text-sm leading-tight" style={{ color: "var(--foreground)" }}>
            {f.agentName ? <span className="font-medium">{f.agentName}</span> : null}{" "}
            <span style={{ color: "var(--muted-foreground)" }}>{f.title}</span>
          </div>
          {f.detail && <div className="mt-0.5 truncate text-xs" style={{ color: "var(--muted-foreground)" }}>{f.detail}</div>}
          <div className="mt-0.5 text-[11px]" style={{ color: "var(--muted-foreground)" }}>{relTime(f.ts)}</div>
        </div>
      </div>
    </div>
  );
}
