"use client";

// Command Center Phase 4 — Role system + skill badges.
// The skill catalog (vendors: hyperagent, looper, workspace) grouped by theme,
// showing which agents carry which skills. Looper-style roles (planner,
// reviewer, fixer, worker) are first-class packs with success criteria.

import { useCallback, useEffect, useState } from "react";
import {
  ApiError,
  api,
  ensureServerId,
  getToken,
} from "../../lib/api";
import type { Agent, Skill } from "../../lib/types";
import SignInGate from "../../components/gate";
import Sidebar from "../../components/sidebar";

const ROLE_ORDER = ["planner", "reviewer", "fixer", "worker"];
const VENDOR_LABEL: Record<string, string> = { hyperagent: "Hyperagent", looper: "Looper role", workspace: "Workspace" };

export default function RolesPage() {
  const [phase, setPhase] = useState<"boot" | "ready" | "no-token" | "expired" | "error">("boot");
  const [error, setError] = useState("");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    const sid = await ensureServerId();
    const [sk, ag] = await Promise.all([
      api<Skill[]>("/api/skills"),
      api<Agent[]>("/api/agents"),
    ]);
    setSkills(Array.isArray(sk) ? sk : []);
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

  const assign = async (skillId: string, agentId: string) => {
    setBusyId(`${skillId}:${agentId}`);
    try {
      await api(`/api/skills/${skillId}/assign`, { method: "POST", body: JSON.stringify({ agentId }) });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId("");
    }
  };

  const unassign = async (skillId: string, agentId: string) => {
    setBusyId(`${skillId}:${agentId}`);
    try {
      await api(`/api/skills/${skillId}/unassign`, { method: "POST", body: JSON.stringify({ agentId }) });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId("");
    }
  };

  if (phase === "no-token" || phase === "expired") return <SignInGate reason={phase} />;
  if (phase === "boot")
    return <div className="min-h-screen flex items-center justify-center" style={{ color: "var(--muted-foreground)" }}>Loading roles…</div>;

  const visibleAgents = agents.filter((a) => a.creatorType !== "system");
  const rolePacks = skills.filter((s) => ROLE_ORDER.includes(s.name));
  const catalog = skills.filter((s) => !ROLE_ORDER.includes(s.name));

  return (
    <div className="flex min-h-screen" style={{ background: "var(--background)" }}>
      <Sidebar agents={visibleAgents} activeLabel="Roles & skills" />

      <div className="glass-bg flex min-w-0 flex-1 flex-col">
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8 md:py-12">
          <header>
            <h1 className="display" style={{ color: "var(--foreground)" }}>Roles &amp; skills</h1>
            <p className="mt-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
              A governed skill library — Hyperagent packs + looper-style roles — assigned to agents. {skills.length} skills in the catalog.
            </p>
          </header>

          {phase === "error" && error && (
            <div className="text-sm" style={{ color: "var(--err)", background: "rgba(249,68,68,0.08)", border: "1px solid rgba(249,68,68,0.3)", borderRadius: 12, padding: "10px 14px" }}>
              {error}
            </div>
          )}

          {/* Looper-style roles */}
          <section>
            <h2 className="mb-3 text-lg font-medium" style={{ color: "var(--foreground)" }}>Agent roles</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {ROLE_ORDER.map((role) => {
                const pack = rolePacks.find((s) => s.name === role);
                if (!pack) return null;
                return (
                  <div key={role} className="card p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold capitalize" style={{ color: "var(--foreground)" }}>{role}</h3>
                      <span className="chip accent">looper</span>
                    </div>
                    <p className="mt-2 line-clamp-3 text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                      {pack.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {pack.assignedTo.length === 0 && <span className="chip">unassigned</span>}
                      {pack.assignedTo.map((n) => (
                        <span key={n} className="chip ok">{n}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Skill catalog */}
          <section>
            <h2 className="mb-3 text-lg font-medium" style={{ color: "var(--foreground)" }}>Skill catalog</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {catalog.map((s) => {
                const vendor = VENDOR_LABEL[s.vendor || ""] || s.vendor || "workspace";
                const isHyper = s.vendor === "hyperagent";
                return (
                  <div key={s.id} className="card p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate text-sm font-semibold" style={{ color: "var(--foreground)" }}>{s.name}</h3>
                      <span className={`chip ${isHyper ? "accent" : ""}`}>{vendor}</span>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                      {s.description || "No description"}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>Assigned:</span>
                      {s.assignedTo.length === 0 && <span className="chip">none</span>}
                      {s.assignedTo.map((n) => (
                        <span key={n} className="chip ok">{n}</span>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {visibleAgents.map((a) => {
                        const has = s.assignedTo.includes(a.name);
                        return (
                          <button
                            key={a.id}
                            className={`chip ${has ? "ok" : ""}`}
                            style={{ cursor: "pointer", border: has ? "1px solid rgba(0,213,166,0.4)" : "1px solid var(--border-strong)" }}
                            disabled={busyId === `${s.id}:${a.id}`}
                            onClick={() => (has ? unassign(s.id, a.id) : assign(s.id, a.id))}
                            title={has ? `Remove from ${a.displayName || a.name}` : `Assign to ${a.displayName || a.name}`}
                          >
                            {busyId === `${s.id}:${a.id}` ? "…" : has ? "✓ " : "+ "}{a.displayName || a.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
