// Reminders / cron view — recurring jobs that wake an agent on schedule.
// Backed by GET/POST/DELETE /api/reminders (human-facing cron API).
// A reminder whose content starts with @<agent> wakes that agent each time
// the scheduler fires it (recurrence = interval seconds).
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "../store.tsx";
import { IconReminder } from "../icons.tsx";
import { Plus, Trash2 } from "lucide-react";
import { PaneEmpty } from "../PaneEmpty.tsx";

type Reminder = { id: string; content: string; status: string; recurrence: string | null; remindAt: string; ownerType: string; ownerId: string; channelId: string | null };

export function Reminders() {
  const { t } = useTranslation();
  const { api } = useStore();
  const [items, setItems] = useState<Reminder[] | null>(null);
  const [content, setContent] = useState("");
  const [channel, setChannel] = useState("all");
  const [recurring, setRecurring] = useState("3600");
  const [inSec, setInSec] = useState("10");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const load = useCallback(async () => {
    try { const r = await api("GET", "/api/reminders"); setItems(Array.isArray(r?.reminders) ? r.reminders : []); }
    catch { setItems([]); }
  }, [api]);
  useEffect(() => { void load(); }, [load]);

  const add = async () => {
    setErr(""); setOk("");
    if (!content.trim()) { setErr(t("reminders.contentRequired")); return; }
    const sec = Number(recurring);
    if (!(sec > 0)) { setErr(t("reminders.recurringInvalid")); return; }
    setBusy(true);
    try {
      const r = await api("POST", "/api/reminders", { content: content.trim(), in: Math.max(1, Number(inSec) || 10), recurring: sec, channel: channel.trim() || "all" });
      if (r?.error) { setErr(String(r.error)); return; }
      setOk(t("reminders.added")); setContent("");
      await load();
    } catch (e: any) { setErr(String(e?.message ?? e)); }
    finally { setBusy(false); }
  };

  const cancel = async (id: string) => {
    try { await api("DELETE", `/api/reminders/${id}`, {}); await load(); } catch { /* ignore */ }
  };

  const fmt = (iso: string) => { try { return new Date(iso).toLocaleString(); } catch { return iso; } };
  const active = items?.filter((r) => r.status === "scheduled") ?? [];
  const done = items?.filter((r) => r.status !== "scheduled") ?? [];

  return (
    <>
      <aside className="sidebar">
        <div className="sb-scroll">
          <div className="sb-title">{t("nav.reminders")}</div>
          <div className="sec">{t("nav.reminders")} <span className="cnt">{active.length}</span></div>
          {active.map((r) => (
            <button key={r.id} className="item" onClick={() => setContent(r.content)}>
              <IconReminder size={15} /><span className="grow">{r.content.slice(0, 40)}</span>
            </button>
          ))}
          {!active.length && <div className="empty">{t("reminders.empty")}</div>}
        </div>
      </aside>
      <main className="content-col">
        <div className="head"><h1>{t("nav.reminders")}</h1><small>{t("reminders.subtitle")}</small></div>
        <div className="scroll">
          {!active.length ? (
            <PaneEmpty icon={<IconReminder size={30} />} title={t("reminders.empty")} sub={t("reminders.emptySub")} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {active.map((r) => (
                <div key={r.id} className="card">
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <b style={{ flex: 1 }}>{r.content}</b>
                    {r.recurrence && <span className="badge">{t("reminders.every")} {Math.round(Number(r.recurrence) / 60)}m</span>}
                    <button className="danger-btn" onClick={() => void cancel(r.id)} title="Delete"><Trash2 size={14} /></button>
                  </div>
                  <p className="muted" style={{ marginTop: 4, fontSize: 13 }}>{t("reminders.next")}: {fmt(r.remindAt)}</p>
                </div>
              ))}
            </div>
          )}

          {done.length > 0 && (
            <div className="card" style={{ marginTop: 18 }}>
              <h3>{t("reminders.fired")}</h3>
              {done.slice(0, 10).map((r) => <p key={r.id} className="muted" style={{ fontSize: 13, marginTop: 4 }}>{r.content} — {fmt(r.remindAt)}</p>)}
            </div>
          )}

          <div className="card" style={{ marginTop: 18 }}>
            <h3>{t("reminders.addTitle")}</h3>
            <input className="inp" style={{ marginTop: 8 }} placeholder="@AgentName + message…" value={content} onChange={(e) => setContent(e.target.value)} />
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              <input className="inp" style={{ flex: "1 1 120px" }} placeholder={t("reminders.channel")} value={channel} onChange={(e) => setChannel(e.target.value)} />
              <input className="inp" style={{ flex: "1 1 120px" }} placeholder={t("reminders.everySec")} value={recurring} onChange={(e) => setRecurring(e.target.value)} />
              <input className="inp" style={{ flex: "1 1 100px" }} placeholder={t("reminders.firstIn")} value={inSec} onChange={(e) => setInSec(e.target.value)} />
            </div>
            {err && <p className="form-err" style={{ marginTop: 6 }}>{err}</p>}
            {ok && <p className="muted" style={{ marginTop: 6, color: "var(--success)" }}>{ok}</p>}
            <div className="acts" style={{ marginTop: 10 }}>
              <button className="ok" onClick={() => void add()} disabled={busy}><Plus size={15} /> {busy ? "…" : t("reminders.add")}</button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
