import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "../store.tsx";
import { IconWrench } from "../icons.tsx";
import { Plus } from "lucide-react";
import { PaneEmpty } from "../PaneEmpty.tsx";

type Skill = {
  id: string;
  name: string;
  description: string;
  vendor: string;
  assignedTo: string[];
};

export function Skills() {
  const { t } = useTranslation();
  const { api, agents } = useStore();

  const [skills, setSkills] = useState<Skill[] | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [content, setContent] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const load = useCallback(async () => {
    try { const list = await api("GET", "/api/skills"); setSkills(Array.isArray(list) ? list : []); }
    catch { setSkills([]); }
  }, [api]);

  useEffect(() => { void load(); }, [load]);

  const publish = async () => {
    setErr(""); setOk("");
    if (!name.trim() || !content.trim()) { setErr(t("skills.name") + " + " + t("skills.content") + " required"); return; }
    setPublishing(true);
    try {
      const r = await api("POST", "/api/skills", { name: name.trim(), description: desc.trim(), content });
      setOk(`Published ${r?.name ?? name.trim()}`); setName(""); setDesc(""); setContent("");
      await load();
    } catch (e: any) { setErr(String(e?.message ?? e)); }
    finally { setPublishing(false); }
  };

  const assign = async (skillId: string, agentId: string) => {
    try { await api("POST", `/api/skills/${skillId}/assign`, { agentId }); await load(); } catch { /* ignore */ }
  };
  const unassign = async (skillId: string, agentId: string) => {
    try { await api("POST", `/api/skills/${skillId}/unassign`, { agentId }); await load(); } catch { /* ignore */ }
  };
  const del = async (skillId: string) => {
    try { await api("DELETE", `/api/skills/${skillId}`, {}); await load(); } catch { /* ignore */ }
  };

  return (
    <>
      <aside className="sidebar">
        <div className="sb-scroll">
          <div className="sb-title">{t("nav.skills")}</div>
          <div className="sec">{t("nav.skills")} <span className="cnt">{skills?.length ?? 0}</span></div>
          {skills?.length ? skills.map((s) => (
            <button key={s.id} className="item" onClick={() => { /* select */ }}>
              <IconWrench size={15} /><span className="grow">{s.name}</span>
            </button>
          )) : <div className="empty">{t("skills.empty")}</div>}
        </div>
      </aside>
      <main className="content-col">
        <div className="head"><h1>{t("nav.skills")}</h1><small>{t("skills.subtitle")}</small>
          <div style={{ marginLeft: "auto" }}></div>
        </div>
        <div className="scroll">
          {!skills?.length ? (
            <PaneEmpty icon={<IconWrench size={30} />} title={t("skills.empty")} sub={t("skills.subtitle")}
              action={<button className="pe-cta" onClick={() => document.getElementById("skill-name")?.focus()}><Plus size={15} /> {t("skills.publish")}</button>} />
          ) : skills.map((s) => (
            <div key={s.id} className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <strong style={{ fontSize: 15 }}>{s.name}</strong>
                <span className="muted" style={{ marginLeft: 8 }}>{s.vendor}</span>
                <button className="danger-btn" style={{ marginLeft: "auto" }} onClick={() => void del(s.id)}>{t("skills.delete")}</button>
              </div>
              {s.description && <p className="muted" style={{ margin: "4px 0 8px" }}>{s.description}</p>}
              {s.assignedTo.length > 0 && <div className="muted" style={{ marginBottom: 6 }}>{t("skills.assigned")}: {s.assignedTo.join(", ")}</div>}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                {agents.filter((a) => a.status === "active").map((a) => (
                  s.assignedTo.includes(a.name)
                    ? <button key={a.id} className="action-btn" onClick={() => void unassign(s.id, a.id)}>{t("skills.unassign")} · {a.name}</button>
                    : <button key={a.id} className="action-btn" onClick={() => void assign(s.id, a.id)}>{t("skills.assignTo")} · {a.name}</button>
                ))}
                {!agents.some((a) => a.status === "active") && <span className="muted">{t("skills.noAgents")}</span>}
              </div>
            </div>
          ))}

          <div className="card">
            <h3>{t("skills.publish")}</h3>
            <label>{t("skills.name")}</label>
            <input id="skill-name" className="inp" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("skills.namePlaceholder")} />
            <label>{t("skills.desc")}</label>
            <input className="inp" value={desc} onChange={(e) => setDesc(e.target.value)} />
            <label>{t("skills.content")}</label>
            <textarea className="inp" rows={5} value={content} onChange={(e) => setContent(e.target.value)} placeholder="---\nname: test-and-push\n---\n..." />
            {err && <p className="form-err">{err}</p>}
            {ok && <p className="muted">{ok}</p>}
            <div className="acts" style={{ marginTop: 10 }}>
              <button className="ok" onClick={() => void publish()} disabled={publishing}>{publishing ? "…" : t("skills.publishBtn")}</button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}