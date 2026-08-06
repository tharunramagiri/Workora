"use client";

// Command Center Phase 5 — Fleet control (fleet-engineering + loop-engineering).
// Per-agent autonomy tier (L1 report / L2 assisted / L3 unattended, derived from
// executionMode), security posture, activity volume (fleet budget guard proxy),
// and a real sovereign kill switch (stops all active agents via the lifecycle API).

import { useCallback, useEffect, useState } from "react";
import {
  ApiError,
  api,
  ensureServerId,
  getToken,
  dotFor,
  dotLabel,
} from "../../lib/api";
import type { ActivityItem, Agent, Machine } from "../../lib/types";
import SignInGate from "../../components/gate";
import Sidebar from "../../components/sidebar";

// executionMode → autonomy tier (loop-engineering L1/L2/L3)
function tierFor(a: Agent): { tier: "L1" | "L2" | "L3"; label: string } {
  const mode = a.executionMode || "auto";
  if (mode === "fast") return { tier: "L3", label: "L3 unattended" };
  if (mode === "auto") return { tier: "L2", label: "L2 assisted" };
  return { tier: "L1", label: "L1 report" };
}

export default function FleetPage() {
  const [phase, setPhase] = useState<"boot" | "ready" | "no-token" | "expired" | "error">("boot");
  const [error, setError] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [volume, setVolume] = useState<Record<string, number>>({});
  const [stopping, setStopping] = useState(false);
  const [stoppingId, setStoppingId] = useState("");

  const load = useCallback(async () => {
    const sid = await ensureServerId();
    const [ag, mc] = await Promise.all([
      api<Agent[]>("/api/agents"),
      api<{ machines: Machine[] }>(`/api/servers/${sid}/machines`),
    ]);
    const list = Array.isArray(ag) ? ag : [];
    setAgents(list);
    setMachines(Array.isArray(mc?.machines) ? mc.machines : []);

    // Fleet budget guard (honest proxy): per-agent activity volume.
    const counts: Record<string, number> = {};
    const logs = await Promise.all(
      list.filter((a) => a.creatorType !== "system").map(async (a) => {
        try {
          const rows = await api<ActivityItem[]>(`/api/agents/${a.id}/activity-log?limit=200`);
          return [a.id, Array.isArray(rows) ? rows.length : 0] as const;
        } catch {
          return [a.id, 0] as const;
        }
      }),
    );
    for (const [id, n] of logs) counts[id] = n;
    setVolume(counts);
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
    const t = setInterval(() => load().catch(() => {}), 12000);
    return () => clearInterval(t);
  }, [boot, load]);

  const stopAgent = async (id: string) => {
    setStoppingId(id);
    try {
      await api(`/api/agents/${id}/stop`, { method: "POST" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setStoppingId("");
    }
  };

  const stopAll = async () => {
    setStopping(true);
    try {
      const active = agents.filter((a) => a.status === "active" || a.status === "starting" || a.status === "queued");
      for (const a of active) {
        try {
          await api(`/api/agents/${a.id}/stop`, { method: "POST" });
        } catch { /* keep stopping the rest */ }
      }
      await load();
    } finally {
      setStopping(false);
    }
  };

  if (phase === "no-token" || phase === "expired") return <SignInGate reason={phase} />;
  if (phase === "boot")
    return <div className="min-h-screen flex items-center justify-center" style={{ color: "var(--muted-foreground)" }}>Loading fleet…</div>;

  const visible = agents.filter((a) => a.creatorType !== "system");
  const active = visible.filter((a) => a.status === "active").length;
  const machinesOnline = machines.filter((m) => m.status === "online").length;
  const totalVolume = Object.values(volume).reduce((s, n) => s + n, 0);

  return (
    <div className="flex min-h-screen" style={{ background: "var(--background)" }}>
      <Sidebar agents={visible} activeLabel="Fleet" />

      <div className="glass-bg flex min-w-0 flex-1 flex-col">
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8 md:py-12">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="display" style={{ color: "var(--foreground)" }}>Fleet</h1>
              <p className="mt-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
                Govern the population: autonomy tiers, security posture, activity volume, and the kill switch.
              </p>
            </div>
            <button
              className="btn"
              style={{ background: "rgba(249,68,68,0.12)", color: "var(--err)", borderColor: "rgba(249,68,68,0.3)" }}
              onClick={stopAll}
              disabled={stopping || active === 0}
              aria-label="Stop all agents"
            >
              {stopping ? "Stopping…" : `Stop all (${active} active)`}
            </button>
          </header>

          {phase === "error" && error && (
            <div className="text-sm" style={{ color: "var(--err)", background: "rgba(249,68,68,0.08)", border: "1px solid rgba(249,68,68,0.3)", borderRadius: 12, padding: "10px 14px" }}>
              {error}
            </div>
          )}

          {/* Fleet pulse */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Pulse label="Agents" value={visible.length} />
            <Pulse label="Active" value={active} color="var(--ok)" />
            <Pulse label="Machines online" value={machinesOnline} />
            <Pulse label="Activity steps" value={totalVolume} />
          </div>

          {/* Roster with governance */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {visible.map((a) => {
              const t = tierFor(a);
              const dot = dotFor(a);
              return (
                <div key={a.id} className="card p-4">
                  <div className="flex items-center gap-3">
                    <span className={`dot ${dot}`} title={dotLabel(dot)} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                        {a.displayName || a.name}
                      </div>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>@{a.name} · {a.runtime}</div>
                    </div>
                    <span className={`chip ${t.tier === "L3" ? "warn" : t.tier === "L2" ? "accent" : ""}`}>{t.label}</span>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <Mini label="Posture" value={a.executionMode || "auto"} />
                    <Mini label="Status" value={a.status} />
                    <Mini label="Steps" value={String(volume[a.id] ?? 0)} />
                  </div>

                  <div className="mt-3 flex justify-end">
                    <button
                      className="btn ghost"
                      style={{ padding: "3px 10px", fontSize: 12, color: "var(--err)" }}
                      onClick={() => stopAgent(a.id)}
                      disabled={stoppingId === a.id || a.status !== "active"}
                      aria-label={`Stop ${a.displayName || a.name}`}
                    >
                      {stoppingId === a.id ? "Stopping…" : "Stop"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Pulse({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="pulse-card">
      <div className="label">{label}</div>
      <div className="value" style={{ color: color || "var(--foreground)" }}>{value}</div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg px-2 py-1.5" style={{ background: "rgba(255,255,255,0.03)" }}>
      <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>{label}</div>
      <div className="truncate text-xs font-medium" style={{ color: "var(--foreground)" }}>{value}</div>
    </div>
  );
}
