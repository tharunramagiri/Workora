"use client";

// Command Center Phase 3 — Deliverables gallery (transparent execution).
// Real projects from the projects API; branches + diffs come from the daemon
// (handled gracefully when offline). Every deliverable is a stays-alive link:
// repo, commit, branch channel, and diff.

import { useCallback, useEffect, useState } from "react";
import {
  ApiError,
  api,
  ensureServerId,
  getToken,
  relTime,
} from "../../lib/api";
import type { Agent, Channel, Project } from "../../lib/types";
import SignInGate from "../../components/gate";
import Sidebar from "../../components/sidebar";

export default function DeliverablesPage() {
  const [phase, setPhase] = useState<"boot" | "ready" | "no-token" | "expired" | "error">("boot");
  const [error, setError] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [branches, setBranches] = useState<Record<string, { current: string | null; list: string[]; error?: string }>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [diffFor, setDiffFor] = useState<{ id: string; name: string; diff: string; branch?: string; error?: string } | null>(null);

  const load = useCallback(async () => {
    const sid = await ensureServerId();
    const [pr, ch, ag] = await Promise.all([
      api<Project[]>("/api/projects"),
      api<Channel[]>("/api/channels").catch(() => []),
      api<Agent[]>("/api/agents"),
    ]);
    setProjects(Array.isArray(pr) ? pr : []);
    setChannels(Array.isArray(ch) ? ch : []);
    setAgents(Array.isArray(ag) ? ag : []);
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
    const t = setInterval(() => load().catch(() => {}), 15000);
    return () => clearInterval(t);
  }, [boot, load]);

  const loadBranches = async (p: Project) => {
    setBusy((b) => ({ ...b, [p.id]: true }));
    try {
      const r = await api<{ ok: boolean; branches?: string[]; current?: string | null; error?: string }>(`/api/projects/${p.id}/branches`, { method: "POST" });
      setBranches((b) => ({
        ...b,
        [p.id]: r?.ok ? { current: r.current ?? null, list: (r.branches ?? []) } : { current: null, list: [], error: r?.error || "branches failed" },
      }));
    } catch (e) {
      setBranches((b) => ({ ...b, [p.id]: { current: null, list: [], error: e instanceof Error ? e.message : "branches failed" } }));
    } finally {
      setBusy((b) => ({ ...b, [p.id]: false }));
    }
  };

  const loadDiff = async (p: Project) => {
    setDiffFor({ id: p.id, name: p.name, diff: "Loading diff…" });
    try {
      const r = await api<{ ok: boolean; diff?: string; branch?: string; error?: string }>(`/api/projects/${p.id}/diff`, { method: "POST", body: JSON.stringify({}) });
      setDiffFor(r?.ok ? { id: p.id, name: p.name, diff: r.diff ?? "(empty diff)", branch: r.branch } : { id: p.id, name: p.name, diff: "", error: r?.error || "diff failed" });
    } catch (e) {
      setDiffFor({ id: p.id, name: p.name, diff: "", error: e instanceof Error ? e.message : "diff failed" });
    }
  };

  if (phase === "no-token" || phase === "expired") return <SignInGate reason={phase} />;
  if (phase === "boot")
    return <div className="min-h-screen flex items-center justify-center" style={{ color: "var(--muted-foreground)" }}>Loading deliverables…</div>;

  const channelName = (id?: string | null) => channels.find((c) => c.id === id)?.name || "";

  return (
    <div className="flex min-h-screen" style={{ background: "var(--background)" }}>
      <Sidebar agents={agents} activeLabel="Deliverables" />

      <div className="glass-bg flex min-w-0 flex-1 flex-col">
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8 md:py-12">
          <header>
            <h1 className="display" style={{ color: "var(--foreground)" }}>Deliverables</h1>
            <p className="mt-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
              Every artifact stays alive: repos, commits, branch channels, and diffs. Open any link and it still works.
            </p>
          </header>

          {phase === "error" && error && (
            <div className="text-sm" style={{ color: "var(--err)", background: "rgba(249,68,68,0.08)", border: "1px solid rgba(249,68,68,0.3)", borderRadius: 12, padding: "10px 14px" }}>
              {error}
            </div>
          )}

          {projects.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                No projects yet. Import a repo in Workora, then its deliverables appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {projects.map((p) => {
                const br = branches[p.id];
                return (
                  <div key={p.id} className="card p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-semibold" style={{ color: "var(--foreground)" }}>{p.name}</h2>
                        <a href={p.repoUrl} target="_blank" rel="noreferrer" className="mt-0.5 block truncate text-xs" style={{ color: "var(--tertiary)" }}>
                          {p.repoUrl} ↗
                        </a>
                      </div>
                      <span className={`chip ${p.status === "ready" ? "ok" : p.status === "error" ? "err" : "warn"}`}>{p.status}</span>
                    </div>

                    <dl className="mt-3 space-y-1.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
                      <Row k="Branch" v={p.defaultBranch || "—"} />
                      <Row k="Commit" v={p.lastCommit ? p.lastCommit.slice(0, 10) : "—"} />
                      <Row k="Synced" v={p.lastSyncedAt ? relTime(new Date(p.lastSyncedAt).getTime()) : "—"} />
                    </dl>

                    {p.lastError && <p className="mt-2 text-xs" style={{ color: "var(--err)" }}>{p.lastError}</p>}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button className="btn" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => loadBranches(p)} disabled={busy[p.id]} aria-label={`Load branches for ${p.name}`}>
                        {busy[p.id] ? "…" : "Branches"}
                      </button>
                      <button className="btn" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => loadDiff(p)} aria-label={`View diff for ${p.name}`}>
                        View diff
                      </button>
                      {channelName(p.channelId) && (
                        <a
                          href={`https://office.ramagiritharun.in`}
                          target="_blank"
                          rel="noreferrer"
                          className="chip accent"
                          title={channelName(p.channelId)}
                        >
                          # {channelName(p.channelId)} ↗
                        </a>
                      )}
                    </div>

                    {br && (
                      <div className="mt-3 rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                        {br.error ? (
                          <p className="text-xs" style={{ color: "var(--warn)" }}>
                            {br.error} — daemon offline? Try again when the machine is connected.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {br.list.length === 0 && <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>No branches</span>}
                            {br.list.map((b) => (
                              <span key={b} className={`chip ${b === br.current ? "accent" : ""}`} title={b === br.current ? "current" : ""}>
                                {b === br.current ? "● " : ""}{b}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {diffFor && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`Diff for ${diffFor.name}`} style={{ background: "rgba(0,0,0,0.75)" }} onClick={() => setDiffFor(null)}>
          <div className="card flex max-h-[85vh] w-full max-w-3xl flex-col p-0" style={{ background: "var(--surface)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold" style={{ color: "var(--foreground)" }}>{diffFor.name} — diff{diffFor.branch ? ` (${diffFor.branch})` : ""}</h2>
              </div>
              <button className="btn ghost" style={{ padding: "3px 10px" }} onClick={() => setDiffFor(null)} aria-label="Close diff">✕</button>
            </div>
            {diffFor.error ? (
              <p className="p-5 text-sm" style={{ color: "var(--warn)" }}>{diffFor.error} — daemon offline?</p>
            ) : (
              <pre className="m-0 overflow-auto p-4 text-xs leading-relaxed" style={{ color: "var(--foreground)", background: "var(--background)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {diffFor.diff}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-14 shrink-0" style={{ color: "var(--muted-foreground)" }}>{k}</dt>
      <dd className="m-0 truncate" style={{ color: "var(--foreground)" }}>{v}</dd>
    </div>
  );
}
