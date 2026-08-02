import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useStore } from "../store.tsx";
import { IconProject } from "../icons.tsx";
import { Plus } from "lucide-react";
import { PaneEmpty } from "../PaneEmpty.tsx";

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

export function Projects() {
  const { t } = useTranslation();
  const { api, slug, machines } = useStore();
  const nav = useNavigate();

  const [projects, setProjects] = useState<Project[] | null>(null);
  const [selected, setSelected] = useState<Project | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [name, setName] = useState("");
  const [machineId, setMachineId] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [pushBranch, setPushBranch] = useState("");
  const [pushMsg, setPushMsg] = useState("workora: agent changes");
  const [pushing, setPushing] = useState(false);

  const onlineMachines = machines.filter((m) => m.status === "online");

  // Auto-select the first online machine when opening the import modal.
  useEffect(() => {
    if (showImport && !machineId && onlineMachines.length > 0) setMachineId(onlineMachines[0]!.id);
  }, [showImport, onlineMachines.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(async () => {
    try { const list = await api("GET", "/api/projects"); setProjects(Array.isArray(list) ? list : []); }
    catch { setProjects([]); }
  }, [api]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (projects && !projects.find((p) => p.id === selected?.id)) setSelected(projects[0] ?? null);
  }, [projects]); // eslint-disable-line react-hooks/exhaustive-deps

  const cur = selected;

  const openImport = () => { setErr(""); setRepoUrl(""); setName(""); setShowImport(true); };

  const importRepo = async () => {
    setErr("");
    if (!repoUrl.trim()) { setErr(t("projects.repoUrlError")); return; }
    if (!machineId) { setErr(t("projects.chooseMachineError")); return; }
    setBusy(true);
    try {
      const r = await api("POST", "/api/projects", { repoUrl: repoUrl.trim(), name: name.trim() || undefined, machineId });
      if (r?.status === "error") { setErr(t("projects.importFailed", { error: String(r?.error ?? "") })); return; }
      setShowImport(false); setRepoUrl(""); setName("");
      await load();
    } catch (e: any) { setErr(String(e?.message ?? e)); }
    finally { setBusy(false); }
  };

  const sync = async () => {
    if (!cur) return;
    setSyncing(true);
    try { await api("POST", `/api/projects/${cur.id}/sync`, {}); } catch { /* ignore */ }
    await load();
    setSyncing(false);
  };

  const doPush = async () => {
    if (!cur) return;
    setPushing(true);
    try {
      const branch = pushBranch.trim() || `workora/${cur.name}/agent`;
      await api("POST", `/api/projects/${cur.id}/push`, { branch, message: pushMsg.trim() });
      try { await api("POST", `/api/projects/${cur.id}/branch-channel`, { branch }); } catch { /* non-fatal */ }
      setPushBranch(""); setPushMsg("workora: agent changes");
    } catch { /* ignore */ }
    await load();
    setPushing(false);
  };

  const remove = async () => {
    if (!cur) return;
    try { await api("DELETE", `/api/projects/${cur.id}`); } catch { /* ignore */ }
    await load();
  };

  const statusLabel = (p: Project) => p.status === "ready" ? t("projects.ready") : p.status === "cloning" ? t("projects.cloning") : p.status;

  return (
    <>
      <aside className="sidebar">
        <div className="sb-scroll">
          <div className="sb-title">{t("nav.projects")}</div>
          <div className="sec">{t("nav.projects")} <span className="cnt">{projects?.length ?? 0}</span><button className="addbtn" title={t("projects.importRepo")} onClick={openImport}>+</button></div>
          {projects?.length ? projects.map((p) => (
            <button key={p.id} className={"item" + (p.id === cur?.id ? " active" : "")} onClick={() => setSelected(p)}>
              <IconProject size={15} /><span className="grow">{p.name}</span><span className={"dot " + (p.status === "ready" ? "online" : "")} />
            </button>
          )) : <div className="empty">{t("projects.empty")}</div>}
        </div>
      </aside>
      <main className="content-col">
        {!cur ? (
          <>
            <div className="head"><h1>{t("nav.projects")}</h1></div>
            <div className="scroll">
              <PaneEmpty icon={<IconProject size={30} />} title={t("projects.empty")} sub={t("projects.subtitle")}
                action={onlineMachines.length ? <button className="pe-cta" onClick={openImport}><Plus size={15} /> {t("projects.importRepo")}</button>
                  : <span className="muted">{t("projects.noMachines")}</span>} />
            </div>
          </>
        ) : (
          <>
            <div className="head"><h1>{cur.name}</h1><small>{cur.repoUrl} · {statusLabel(cur)}</small>
              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                {cur.channelId && <button className="action-btn" onClick={() => nav(`/s/${slug}/channel/${cur.channelId}`)}>{t("projects.openChannel")}</button>}
                <button className="action-btn" disabled={syncing} onClick={() => void sync()}>{syncing ? "…" : t("projects.sync")}</button>
                <button className="danger-btn" onClick={() => void remove()}>{t("projects.remove")}</button>
              </div>
            </div>
            <div className="scroll">
              <div className="card" style={{ marginBottom: 14 }}>
                <div className="kv"><b>{t("projects.branch")}</b> {cur.defaultBranch}</div>
                <div className="kv"><b>{t("projects.clonePath")}</b> <code>{cur.clonePath}</code></div>
                {cur.lastCommit && <div className="kv"><b>{t("projects.lastCommit")}</b> <code>{cur.lastCommit}</code></div>}
                {cur.lastError && <div className="form-err">{t("projects.error")}: {cur.lastError}</div>}
              </div>
              <div className="card">
                <h3>{t("projects.push")}</h3>
                <div className="kv" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input className="inp" style={{ flex: "1 1 160px" }} placeholder={t("projects.pushBranch")} value={pushBranch} onChange={(e) => setPushBranch(e.target.value)} />
                  <input className="inp" style={{ flex: "2 1 220px" }} placeholder={t("projects.pushMessage")} value={pushMsg} onChange={(e) => setPushMsg(e.target.value)} />
                  <button className="ok" disabled={pushing} onClick={() => void doPush()}>{pushing ? "…" : t("projects.push")}</button>
                </div>
                <p className="muted" style={{ marginTop: 8 }}>{t("projects.assignAgentHint")}</p>
              </div>
            </div>
          </>
        )}
      </main>

      {showImport && (
        <div className="modal-bg" onClick={() => setShowImport(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t("projects.importRepo")}</h3>
            <label>{t("projects.repoUrl")}</label>
            <input autoFocus value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder="https://github.com/owner/repo" onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) void importRepo(); }} />
            <label>{t("projects.nameOptional")}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("projects.nameOptional")} />
            <label>{t("projects.machine")}</label>
            <select className="inp" value={machineId} onChange={(e) => setMachineId(e.target.value)}>
              <option value="">{t("projects.chooseMachine")}</option>
              {onlineMachines.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            {onlineMachines.length === 0 && <p className="form-err">{t("projects.noMachines")}</p>}
            {err && <p className="form-err">{err}</p>}
            <div className="acts">
              <button className="cancel" onClick={() => setShowImport(false)}>{t("misc.connectModalCancel")}</button>
              <button className="ok" onClick={() => void importRepo()} disabled={busy || onlineMachines.length === 0}>{busy ? t("projects.importing") : t("projects.import")}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
