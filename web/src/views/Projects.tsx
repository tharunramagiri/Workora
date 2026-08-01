import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useStore } from "../store.tsx";

type Project = {
  id: string;
  name: string;
  repoUrl: string;
  clonePath: string;
  defaultBranch: string;
  channelId: string | null;
  status: string;
  lastError: string | null;
  lastCommit: string | null;
  lastSyncedAt: string | null;
  createdAt: string;
};

type Machine = { id: string; name: string; status: string };
type Agent = { id: string; name: string; status: string };

export function Projects() {
  const { t } = useTranslation();
  const { api, slug, machines, agents } = useStore();
  const nav = useNavigate();

  const [projects, setProjects] = useState<Project[] | null>(null);
  const [repoUrl, setRepoUrl] = useState("");
  const [name, setName] = useState("");
  const [machineId, setMachineId] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [syncing, setSyncing] = useState<string | null>(null);
  const [pushBranch, setPushBranch] = useState("");
  const [pushMsg, setPushMsg] = useState("workora: agent changes");
  const [pushing, setPushing] = useState<string | null>(null);

  const onlineMachines = machines.filter((m) => m.status === "online");

  // Auto-select the first online machine (most setups have exactly one); still overridable.
  useEffect(() => {
    if (!machineId && onlineMachines.length > 0) setMachineId(onlineMachines[0]!.id);
  }, [onlineMachines.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(async () => {
    try { const list = await api("GET", "/api/projects"); setProjects(Array.isArray(list) ? list : []); }
    catch { setProjects([]); }
  }, [api]);

  useEffect(() => { void load(); }, [load]);

  const importRepo = async () => {
    setErr("");
    if (!repoUrl.trim()) { setErr(t("projects.repoUrlError")); return; }
    if (!machineId) { setErr(t("projects.chooseMachineError")); return; }
    setBusy(true);
    try {
      const r = await api("POST", "/api/projects", { repoUrl: repoUrl.trim(), name: name.trim() || undefined, machineId });
      if (r?.status === "error") setErr(t("projects.importFailed", { error: String(r?.error ?? "") }));
      setRepoUrl(""); setName("");
      await load();
    } catch (e: any) { setErr(String(e?.message ?? e)); }
    finally { setBusy(false); }
  };

  const sync = async (p: Project) => {
    setSyncing(p.id);
    try { await api("POST", `/api/projects/${p.id}/sync`, {}); } catch { /* ignore */ }
    await load();
    setSyncing(null);
  };

  const doPush = async (p: Project) => {
    setPushing(p.id);
    try {
      const branch = pushBranch.trim() || `workora/${p.name}/agent`;
      await api("POST", `/api/projects/${p.id}/push`, { branch, message: pushMsg.trim() });
      // Phase 3: auto-create the #<repo>-<branch> channel so patches/review live with the branch.
      try { await api("POST", `/api/projects/${p.id}/branch-channel`, { branch }); } catch { /* non-fatal */ }
      setPushBranch(""); setPushMsg("workora: agent changes");
    } catch { /* ignore */ }
    await load();
    setPushing(null);
  };

  const remove = async (p: Project) => {
    try { await api("DELETE", `/api/projects/${p.id}`); } catch { /* ignore */ }
    await load();
  };

  const activeAgents = agents.filter((a) => a.status === "active");

  return (
    <div className="page">
      <div className="page-head">
        <h1>{t("projects.title")}</h1>
        <p className="page-sub">{t("projects.subtitle")}</p>
      </div>

      <div className="project-import card">
        <h3>{t("projects.importRepo")}</h3>
        <div className="project-import-row">
          <input className="inp" placeholder={t("projects.repoUrl")} value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} />
          <input className="inp" placeholder={t("projects.nameOptional")} value={name} onChange={(e) => setName(e.target.value)} />
          <select className="inp" value={machineId} onChange={(e) => setMachineId(e.target.value)}>
            <option value="">{t("projects.chooseMachine")}</option>
            {onlineMachines.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <button className="ok" disabled={busy || onlineMachines.length === 0} onClick={() => void importRepo()}>{busy ? t("projects.importing") : t("projects.import")}</button>
        </div>
        {onlineMachines.length === 0 && <p className="form-err">{t("projects.noMachines")}</p>}
        {err && <p className="form-err">{err}</p>}
      </div>

      {projects === null ? <p className="muted">…</p> : projects.length === 0 ? (
        <div className="card pane-empty"><div>{t("projects.empty")}</div></div>
      ) : (
        <div className="project-list">
          {projects.map((p) => (
            <div key={p.id} className="project-row card">
              <div className="project-main">
                <div className="project-name">
                  <strong>{p.name}</strong>
                  <span className={"badge " + (p.status === "ready" ? "badge-ok" : p.status === "cloning" ? "badge-warn" : "badge-err")}>
                    {p.status === "ready" ? t("projects.ready") : p.status === "cloning" ? t("projects.cloning") : p.status}
                  </span>
                </div>
                <div className="project-url">{p.repoUrl}</div>
                <div className="project-meta">
                  <span>{t("projects.branch")}: <code>{p.defaultBranch}</code></span>
                  {p.lastCommit && <span>{t("projects.lastCommit")}: <code>{p.lastCommit}</code></span>}
                  <span>{t("projects.clonePath")}: <code>{p.clonePath}</code></span>
                </div>
                {p.lastError && <div className="form-err">{t("projects.error")}: {p.lastError}</div>}
              </div>
              <div className="project-actions">
                {p.channelId && <button className="btn" onClick={() => nav(`/s/${slug}/channel/${p.channelId}`)}>{t("projects.openChannel")}</button>}
                <button className="btn" disabled={syncing === p.id} onClick={() => void sync(p)}>{syncing === p.id ? "…" : t("projects.sync")}</button>
                <div className="project-push">
                  <input className="inp inp-sm" placeholder="branch" value={pushBranch} onChange={(e) => setPushBranch(e.target.value)} />
                  <input className="inp inp-sm" placeholder={t("projects.pushMessage")} value={pushMsg} onChange={(e) => setPushMsg(e.target.value)} />
                  <button className="ok" disabled={pushing === p.id} onClick={() => void doPush(p)}>{pushing === p.id ? "…" : t("projects.push")}</button>
                </div>
                <button className="btn danger" onClick={() => void remove(p)}>{t("projects.remove")}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeAgents.length > 0 && (
        <div className="card project-agents">
          <h4>{t("projects.assignAgent")}</h4>
          <p className="muted">{t("projects.assignAgentHint")}</p>
          <div className="project-agent-chips">
            {activeAgents.map((a) => (
              <span key={a.id} className="chip">{a.name} · {a.status}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
