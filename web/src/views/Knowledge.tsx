// Knowledge base view — shared team/agent memory (memmy/qm-inspired).
// Lists durable facts agents + humans have written; lets a human add/remove
// entries. Backed by GET/POST/DELETE /api/knowledge (wired in the audit pass).
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "../store.tsx";
import { IconKnowledge } from "../icons.tsx";
import { Plus, Trash2 } from "lucide-react";
import { PaneEmpty } from "../PaneEmpty.tsx";

type KnowledgeEntry = { id: string; title: string; content: string; agentId: string | null; createdAt: string };

export function Knowledge() {
  const { t } = useTranslation();
  const { api } = useStore();
  const [entries, setEntries] = useState<KnowledgeEntry[] | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const load = useCallback(async () => {
    try { const list = await api("GET", "/api/knowledge"); setEntries(Array.isArray(list) ? list : []); }
    catch { setEntries([]); }
  }, [api]);
  useEffect(() => { void load(); }, [load]);

  const add = async () => {
    setErr(""); setOk("");
    if (!title.trim() || !content.trim()) { setErr(t("knowledge.title") + " + " + t("knowledge.content") + " required"); return; }
    setBusy(true);
    try {
      const r = await api("POST", "/api/knowledge", { title: title.trim(), content: content.trim() });
      if (r?.error) { setErr(String(r.error)); return; }
      setOk(t("knowledge.added")); setTitle(""); setContent("");
      await load();
    } catch (e: any) { setErr(String(e?.message ?? e)); }
    finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    try { await api("DELETE", `/api/knowledge/${id}`, {}); await load(); } catch { /* ignore */ }
  };

  return (
    <>
      <aside className="sidebar">
        <div className="sb-scroll">
          <div className="sb-title">{t("nav.knowledge")}</div>
          <div className="sec">{t("nav.knowledge")} <span className="cnt">{entries?.length ?? 0}</span></div>
          {entries?.length ? entries.map((e) => (
            <button key={e.id} className="item" onClick={() => { setTitle(e.title); setContent(e.content); }}>
              <IconKnowledge size={15} /><span className="grow">{e.title}</span>
            </button>
          )) : <div className="empty">{t("knowledge.empty")}</div>}
        </div>
      </aside>
      <main className="content-col">
        <div className="head"><h1>{t("nav.knowledge")}</h1></div>
        <div className="scroll">
          {!entries?.length ? (
            <PaneEmpty icon={<IconKnowledge size={30} />} title={t("knowledge.empty")} sub={t("knowledge.subtitle")} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {entries.map((e) => (
                <div key={e.id} className="card">
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <b style={{ flex: 1 }}>{e.title}</b>
                    {e.agentId && <span className="badge">agent</span>}
                    <button className="danger-btn" onClick={() => void remove(e.id)} title="Delete"><Trash2 size={14} /></button>
                  </div>
                  <p className="muted" style={{ whiteSpace: "pre-wrap", marginTop: 6, fontSize: 14 }}>{e.content}</p>
                </div>
              ))}
            </div>
          )}

          <div className="card" style={{ marginTop: 18 }}>
            <h3>{t("knowledge.addTitle")}</h3>
            <input className="inp" style={{ marginTop: 8 }} placeholder={t("knowledge.title")} value={title} onChange={(e) => setTitle(e.target.value)} />
            <textarea className="inp" style={{ marginTop: 8, resize: "vertical", minHeight: 90 }} placeholder={t("knowledge.content")} value={content} onChange={(e) => setContent(e.target.value)} />
            {err && <p className="form-err" style={{ marginTop: 6 }}>{err}</p>}
            {ok && <p className="muted" style={{ marginTop: 6, color: "var(--success)" }}>{ok}</p>}
            <div className="acts" style={{ marginTop: 10 }}>
              <button className="ok" onClick={() => void add()} disabled={busy}><Plus size={15} /> {busy ? "…" : t("knowledge.add")}</button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
