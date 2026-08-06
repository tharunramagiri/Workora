"use client";

// Command Center Phase 2 — Tasks + briefs loop (looper / goal-engineering applied).
// The forge stays the source of truth: this board reads and mutates the real
// tasks API. A brief composer creates tasks with @mention routing via the real
// messages API (asTask), so a brief becomes goals agents can pick up.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ApiError,
  api,
  ensureServerId,
  getToken,
  relTime,
} from "../../lib/api";
import type { Agent, Channel, Task } from "../../lib/types";
import SignInGate from "../../components/gate";
import Sidebar from "../../components/sidebar";

const STATUSES = ["todo", "in_progress", "in_review", "done", "closed"] as const;
const STATUS_LABEL: Record<string, string> = {
  todo: "Todo",
  in_progress: "In progress",
  in_review: "In review",
  done: "Done",
  closed: "Closed",
};

export default function TasksPage() {
  const [phase, setPhase] = useState<"boot" | "ready" | "no-token" | "expired" | "error">("boot");
  const [error, setError] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [meId, setMeId] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    const sid = await ensureServerId();
    const [tk, ch, ag, me] = await Promise.all([
      api<{ tasks: Task[] }>("/api/tasks/server"),
      api<Channel[]>("/api/channels"),
      api<Agent[]>("/api/agents"),
      api<{ id: string }>("/api/auth/me").catch(() => ({ id: "" })),
    ]);
    setTasks(Array.isArray(tk?.tasks) ? tk.tasks : []);
    setChannels(Array.isArray(ch) ? ch.filter((c) => c.type === "channel" || c.type === "private") : []);
    setAgents(Array.isArray(ag) ? ag : []);
    setMeId(me?.id || "");
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
    const t = setInterval(() => load().catch(() => {}), 10000);
    return () => clearInterval(t);
  }, [boot, load]);

  const notify = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  };

  const move = async (t: Task, status: string) => {
    try {
      await api(`/api/tasks/${t.id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      await load();
      notify(`#${t.taskNumber} → ${STATUS_LABEL[status] || status}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const claim = async (t: Task) => {
    try {
      await api(`/api/tasks/${t.id}/claim`, { method: "PATCH" });
      await load();
      notify(`Claimed #${t.taskNumber}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  if (phase === "no-token" || phase === "expired") return <SignInGate reason={phase} />;
  if (phase === "boot")
    return <div className="min-h-screen flex items-center justify-center" style={{ color: "var(--muted-foreground)" }}>Loading tasks…</div>;

  const channelName = (id?: string) => channels.find((c) => c.id === id)?.name || (id ? id.slice(0, 8) : "");
  const assignee = (t: Task) => {
    if (!t.taskAssigneeId) return null;
    if (t.taskAssigneeId === meId) return "you";
    const a = agents.find((x) => x.id === t.taskAssigneeId);
    return a ? a.displayName || a.name : t.taskAssigneeId.slice(0, 8);
  };

  return (
    <div className="flex min-h-screen" style={{ background: "var(--background)" }}>
      <Sidebar agents={agents} activeLabel="Tasks" />

      <div className="glass-bg flex min-w-0 flex-1 flex-col">
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8 md:py-12">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="display" style={{ color: "var(--foreground)" }}>
                Briefs &amp; tasks
              </h1>
              <p className="mt-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
                Brief once. Agents pick up goals and ship. This board is the live view of the task loop.
              </p>
            </div>
            <button className="btn solid" onClick={() => setComposerOpen(true)} aria-label="Compose a brief">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5v14" />
              </svg>
              Compose brief
            </button>
          </header>

          {phase === "error" && error && (
            <div className="text-sm" style={{ color: "var(--err)", background: "rgba(249,68,68,0.08)", border: "1px solid rgba(249,68,68,0.3)", borderRadius: 12, padding: "10px 14px" }}>
              {error}
            </div>
          )}

          {/* Kanban */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {STATUSES.map((st) => {
              const col = tasks.filter((t) => (t.taskStatus || "todo") === st);
              return (
                <div key={st} className="flex min-h-[60vh] flex-col" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: 12, padding: 10 }}>
                  <div className="mb-2 flex items-center justify-between px-1">
                    <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                      {STATUS_LABEL[st]}
                    </span>
                    <span className="chip">{col.length}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {col.length === 0 && (
                      <div className="rounded-lg px-2 py-4 text-center text-xs" style={{ color: "var(--muted-foreground)" }}>
                        Empty
                      </div>
                    )}
                    {col.map((t) => (
                      <div key={t.id} className="card p-3" style={{ borderRadius: 10 }}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="chip accent">#{t.taskNumber}</span>
                          <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>{channelName(t.channelId)}</span>
                        </div>
                        <p className="mt-2 text-sm leading-snug" style={{ color: "var(--foreground)" }}>
                          {t.content}
                        </p>
                        <div className="mt-2 flex items-center gap-1.5 text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                          {assignee(t) ? <span className="chip ok">⛭ {assignee(t)}</span> : <span className="chip">unclaimed</span>}
                          {t.createdAt && <span>{relTime(new Date(t.createdAt).getTime())}</span>}
                        </div>
                        <div className="mt-2 flex items-center gap-1">
                          <button className="btn ghost" style={{ padding: "3px 8px", fontSize: 12 }} onClick={() => claim(t)} disabled={!!t.taskAssigneeId} aria-label={`Claim task ${t.taskNumber}`}>
                            Claim
                          </button>
                          {STATUSES.indexOf(st as (typeof STATUSES)[number]) < STATUSES.length - 1 && (
                            <button className="btn ghost" style={{ padding: "3px 8px", fontSize: 12 }} onClick={() => move(t, STATUSES[STATUSES.indexOf(st as (typeof STATUSES)[number]) + 1])} aria-label={`Move task ${t.taskNumber} forward`}>
                              → {STATUS_LABEL[STATUSES[STATUSES.indexOf(st as (typeof STATUSES)[number]) + 1]]}
                            </button>
                          )}
                          {STATUSES.indexOf(st as (typeof STATUSES)[number]) > 0 && (
                            <button className="btn ghost" style={{ padding: "3px 8px", fontSize: 12 }} onClick={() => move(t, STATUSES[STATUSES.indexOf(st as (typeof STATUSES)[number]) - 1])} aria-label={`Move task ${t.taskNumber} back`}>
                              ←
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {composerOpen && (
        <BriefComposer
          channels={channels}
          onClose={() => setComposerOpen(false)}
          onCreated={async (n) => {
            await load();
            notify(`${n} task${n === 1 ? "" : "s"} created`);
          }}
          onBusy={setBusy}
          busy={busy}
        />
      )}

      {toast && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-sm" style={{ background: "var(--surface-strong)", color: "var(--tertiary)", border: "1px solid var(--border-strong)", boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

function BriefComposer({ channels, onClose, onCreated, onBusy, busy }: {
  channels: Channel[];
  onClose: () => void;
  onCreated: (n: number) => void;
  onBusy: (b: boolean) => void;
  busy: boolean;
}) {
  const [text, setText] = useState("");
  const [channelId, setChannelId] = useState("");
  const [err, setErr] = useState("");
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (channels.length && !channelId) {
      const all = channels.find((c) => c.name === "all") || channels[0];
      if (all) setChannelId(all.id);
    }
  }, [channels, channelId]);

  useEffect(() => {
    taRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async () => {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length || !channelId) return;
    setErr("");
    onBusy(true);
    try {
      let n = 0;
      for (const content of lines) {
        await api("/api/messages", { method: "POST", body: JSON.stringify({ channelId, content, asTask: true }) });
        n++;
      }
      setText("");
      onCreated(n);
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      onBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true" aria-label="Compose a brief" style={{ background: "rgba(0,0,0,0.7)" }} onClick={onClose}>
      <div className="card w-full max-w-lg p-5" style={{ background: "var(--surface)" }} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>Compose a brief</h2>
        <p className="mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
          Each line becomes a task. Mention an agent (e.g. <code className="trace-code">@cto</code>) to route it — goals, not just messages.
        </p>
        <textarea
          ref={taRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder={"Ship a landing page for the new product\n@marketing write the launch copy"}
          className="mt-3 w-full resize-y rounded-lg border p-3 text-sm"
          style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)", outline: "none" }}
          aria-label="Brief text"
        />
        <div className="mt-2">
          <label className="text-xs" style={{ color: "var(--muted-foreground)" }}>Channel</label>
          <select
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
          >
            {channels.map((c) => (
              <option key={c.id} value={c.id}>#{c.name}</option>
            ))}
          </select>
        </div>
        {err && <p className="mt-2 text-xs" style={{ color: "var(--err)" }}>{err}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn solid" onClick={submit} disabled={busy || !text.trim() || !channelId}>
            {busy ? "Creating…" : "Create brief"}
          </button>
        </div>
      </div>
    </div>
  );
}
