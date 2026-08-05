"use client";
import { useEffect, useState } from "react";

// ── Types (mirror the existing /api/agents + /api/servers/:id/machines shapes) ──
type Agent = {
  id: string; name: string; displayName: string; status: string; activity?: string;
  runtime: string; machineId?: string; model?: string; avatarUrl?: string | null;
};
type Machine = { id: string; name?: string; status?: string; runtimes?: string[] };
type Pulse = { total: number; working: number; thinking: number; offline: number; machinesOnline: number; tasksOpen: number };

// Status mapping: server activity/status → dot color (🟢 working / 🟡 thinking / 🔴 offline / ⚪ sleeping)
function dotFor(a: Agent): string {
  if (a.status === "active") {
    if (a.activity === "working" || a.activity === "online") return "working";
    if (a.activity === "thinking") return "thinking";
    return "working";
  }
  if (a.status === "sleeping" || a.activity === "sleeping") return "sleeping";
  return "offline";
}

const RUNTIME_EMOJI: Record<string, string> = { claude: "✦", codex: "◈", opencode: "◇", hermes: "✧", copilot: "❖" };

async function api(path: string): Promise<any> {
  const token = typeof window !== "undefined" ? localStorage.getItem("Workora.token") : "";
  const sid = typeof window !== "undefined" ? localStorage.getItem("Workora.serverId") : "";
  const res = await fetch(path, { headers: { authorization: token ? `Bearer ${token}` : "", "x-server-id": sid || "" } });
  return res.json();
}

export default function CommandCenter() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [err, setErr] = useState("");

  async function load() {
    try {
      const sid = localStorage.getItem("Workora.serverId") || "";
      const ag = await api("/api/agents");
      if (Array.isArray(ag)) setAgents(ag);
      if (sid) { const mc = await api(`/api/servers/${sid}/machines`); setMachines(Array.isArray(mc?.machines) ? mc.machines : []); }
    } catch (e: any) { setErr(String(e?.message ?? e)); }
  }

  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, []);

  const machinesOnline = machines.filter((m) => m.status === "online").length;
  const working = agents.filter((a) => dotFor(a) === "working").length;
  const thinking = agents.filter((a) => dotFor(a) === "thinking").length;
  const offline = agents.filter((a) => dotFor(a) === "offline").length;
  const pulse: Pulse = { total: agents.length, working, thinking, offline, machinesOnline, tasksOpen: 0 };

  return (
    <div className="min-h-screen p-6" style={{ background: "var(--bg)", color: "var(--ink)" }}>
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl" style={{ fontFamily: "var(--font-display, 'EB Garamond')", letterSpacing: "-0.02em" }}>
          Workora <span style={{ color: "var(--accent)" }}>Command Center</span>
        </h1>
        <button className="px-4 py-2 rounded-full text-sm font-medium" style={{ background: "var(--accent)", color: "#0c0a09", border: 0, cursor: "pointer" }} onClick={load}>Refresh</button>
      </header>

      {/* Company pulse */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <PulseCard label="Agents" value={pulse.total} />
        <PulseCard label="Working" value={pulse.working} color="var(--ok)" />
        <PulseCard label="Thinking" value={pulse.thinking} color="var(--warn)" />
        <PulseCard label="Offline" value={pulse.offline} color="var(--err)" />
        <PulseCard label="Machines online" value={pulse.machinesOnline} />
      </div>

      {err && <p className="mb-4 text-sm" style={{ color: "var(--err)" }}>{err} — sign in at office.ramagiritharun.in first, then reload.</p>}

      {/* Agent roster grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {agents.map((a) => (
          <div key={a.id} className="card" style={{ background: "var(--surface)", border: "1px solid var(--hair)", borderRadius: 16, padding: 16 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: "var(--surface-strong)" }}>
                {RUNTIME_EMOJI[a.runtime] || "✦"}
              </div>
              <div className="min-w-0">
                <div className="font-semibold truncate">{a.displayName || a.name}</div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>@{a.name} · {a.runtime}</div>
              </div>
              <span className={`dot ${dotFor(a)} ml-auto`} title={a.activity || a.status} />
            </div>
            <div className="flex items-center gap-2">
              <span className="badge">{dotFor(a) === "working" ? "Working" : dotFor(a) === "thinking" ? "Thinking" : dotFor(a) === "sleeping" ? "Sleeping" : "Offline"}</span>
              {a.model && <span className="badge" style={{ background: "var(--surface-strong)", color: "var(--muted)", borderColor: "var(--hair-strong)" }}>{a.model}</span>}
            </div>
          </div>
        ))}
        {!agents.length && !err && <p style={{ color: "var(--muted)" }}>Loading roster…</p>}
      </div>
    </div>
  );
}

function PulseCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="card text-center" style={{ background: "var(--surface)", border: "1px solid var(--hair)", borderRadius: 12, padding: "12px 8px" }}>
      <div className="text-2xl font-semibold" style={{ color: color || "var(--ink)" }}>{value}</div>
      <div className="text-xs" style={{ color: "var(--muted)" }}>{label}</div>
    </div>
  );
}
