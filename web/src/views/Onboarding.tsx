// First-run onboarding wizard: machine -> repo -> team -> first task -> watch -> review.
// Every step is driven by real backend state (store.machines/agents + direct api() calls), never
// mocked. Reachable at /s/:server/onboarding; the empty-state Projects/Computers panels link here so
// a fresh workspace has one guided path from zero to a completed repo task instead of five separate
// screens the user has to discover on their own. See docs/product/homepage-onboarding-spec-2026-08-03.md.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, GitBranch, ListChecks, MonitorSmartphone, Users } from "lucide-react";
import { useStore } from "../store.tsx";
import { daemonConnectCommand } from "../machineUi.ts";
import "./onboarding.css";

type StepId = "machine" | "repo" | "team" | "task" | "watch" | "review";
const STEPS: { id: StepId; label: string }[] = [
  { id: "machine", label: "Machine" },
  { id: "repo", label: "Repo" },
  { id: "team", label: "Team" },
  { id: "task", label: "Task" },
  { id: "watch", label: "Ship" },
  { id: "review", label: "Review" },
];

type Project = {
  id: string; name: string; repoUrl: string; clonePath: string; defaultBranch: string;
  channelId: string | null; status: string; lastError: string | null; lastCommit: string | null;
};

const TEMPLATES: { key: string; label: string; hint: string; agentName: string; prompt: (repo: string) => string }[] = [
  {
    key: "solo",
    label: "Solo engineer",
    hint: "One agent claims implementation, tests, and the push.",
    agentName: "engineer",
    prompt: (repo) => `Fix the highest-priority failing test in ${repo}, then push a branch with the fix.`,
  },
  {
    key: "bugfix",
    label: "Bug-fix squad",
    hint: "Two agents: one implements, one verifies.",
    agentName: "fixer",
    prompt: (repo) => `Reproduce and fix the most impactful bug you can find in ${repo}. Push a branch with the fix and a short repro note.`,
  },
];

function StepDot({ i, active, done }: { i: number; active: boolean; done: boolean }) {
  return (
    <div className={"ob-dot" + (active ? " is-active" : "") + (done ? " is-done" : "")}>
      {done ? <CheckCircle2 size={14} /> : <span>{i + 1}</span>}
    </div>
  );
}

export function Onboarding() {
  const { api, slug, machines, agents, reload, serverId } = useStore();
  const nav = useNavigate();

  const [step, setStep] = useState<StepId>("machine");

  // Machine step
  const [genRes, setGenRes] = useState<{ id: string; key: string } | null>(null);
  const [genBusy, setGenBusy] = useState(false);
  const [genErr, setGenErr] = useState("");
  const [copied, setCopied] = useState(false);

  // Repo step
  const [repoUrl, setRepoUrl] = useState("");
  const [importBusy, setImportBusy] = useState(false);
  const [importErr, setImportErr] = useState("");
  const [project, setProject] = useState<Project | null>(null);

  // Team step
  const [templateKey, setTemplateKey] = useState<string>("solo");
  const [teamBusy, setTeamBusy] = useState(false);
  const [teamErr, setTeamErr] = useState("");
  const [boundAgentId, setBoundAgentId] = useState<string | null>(null);
  const [boundAgentName, setBoundAgentName] = useState<string>("");

  // Task step
  const [prompt, setPrompt] = useState("");
  const [taskBusy, setTaskBusy] = useState(false);
  const [taskErr, setTaskErr] = useState("");
  const [taskChannelId, setTaskChannelId] = useState<string | null>(null);

  const onlineMachines = machines.filter((m) => m.status === "online");
  const liveMachine = genRes ? machines.find((m) => m.id === genRes.id) : undefined;
  const machineOnline = onlineMachines.length > 0 || liveMachine?.status === "online";

  const genKeyRef = useRef(false); // guards against React 18 StrictMode double-invoking the auto-gen effect, which would otherwise create two machine rows for one onboarding run
  const genKey = useCallback(async () => {
    if (!serverId) return;
    setGenBusy(true); setGenErr("");
    try {
      const r = await api("POST", `/api/servers/${serverId}/machines`, {});
      if (r?.key) { setGenRes({ id: r.id, key: r.key }); await reload(); }
      else setGenErr(r?.error || "Could not generate a connect key. Try again.");
    } catch { setGenErr("Could not generate a connect key. Try again."); }
    finally { setGenBusy(false); }
  }, [api, reload, serverId]);

  // Auto-generate a connect key once when this step is first shown and no machine is online yet.
  // The ref (not just state) makes this idempotent under StrictMode's double effect invocation.
  useEffect(() => {
    if (step === "machine" && !genRes && !genKeyRef.current && onlineMachines.length === 0 && serverId) {
      genKeyRef.current = true;
      void genKey();
    }
  }, [step, genRes, onlineMachines.length, serverId, genKey]);

  const cmd = genRes ? daemonConnectCommand(window.location.origin, genRes.key) : "";
  const copy = () => { navigator.clipboard?.writeText(cmd); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  const importRepo = async () => {
    setImportErr("");
    if (!repoUrl.trim()) { setImportErr("Paste a git URL first."); return; }
    const machineId = onlineMachines[0]?.id;
    if (!machineId) { setImportErr("No online machine yet — go back and connect one."); return; }
    setImportBusy(true);
    try {
      const r = await api("POST", "/api/projects", { repoUrl: repoUrl.trim(), machineId });
      // Real API failure modes for this endpoint: r.error present (400 bad URL, 404 machine, 409
      // dup-repo w/ projectId, or the 200-with-status:"error" clone-failure shape). Any of these
      // must stop the wizard here instead of advancing with a project object missing an id/channel.
      if (r?.error || r?.status === "error" || !r?.id) {
        setImportErr(String(r?.error ?? "Import failed."));
        return;
      }
      if (r.status !== "ready") { setImportErr(`Clone did not finish (status: ${r.status}). Try again or check the machine.`); return; }
      setProject({ id: r.id, name: repoUrl.split("/").pop()?.replace(/\.git$/, "") || "repo", repoUrl: repoUrl.trim(), clonePath: r.clonePath, defaultBranch: r.defaultBranch, channelId: r.channelId ?? null, status: r.status, lastError: null, lastCommit: null });
      setStep("team");
    } catch (e: any) { setImportErr(String(e?.message ?? e)); }
    finally { setImportBusy(false); }
  };

  const createTeam = async () => {
    if (!project) return;
    setTeamErr(""); setTeamBusy(true);
    try {
      const machineId = onlineMachines[0]?.id;
      if (!machineId) { setTeamErr("Machine went offline — reconnect and retry."); return; }
      const tpl = TEMPLATES.find((t) => t.key === templateKey)!;
      const baseName = tpl.agentName;
      let name = baseName; let suffix = 1;
      const taken = new Set(agents.map((a) => a.name));
      while (taken.has(name)) { name = `${baseName}${++suffix}`; }
      const r = await api("POST", "/api/agents", { name, displayName: name, machineId, runtime: "claude", projectPath: project.clonePath });
      if (!r?.id) { setTeamErr(String(r?.error ?? "Could not create the agent.")); return; }
      setBoundAgentId(r.id); setBoundAgentName(name);
      setPrompt(tpl.prompt(project.name));
      await reload();
      setStep("task");
    } catch (e: any) { setTeamErr(String(e?.message ?? e)); }
    finally { setTeamBusy(false); }
  };

  const giveTask = async () => {
    if (!project?.channelId || !boundAgentId) { setTaskErr("Missing project channel or agent."); return; }
    setTaskErr(""); setTaskBusy(true);
    try {
      const content = `@${boundAgentName} ${prompt.trim()}`;
      const r = await api("POST", "/api/messages", { channelId: project.channelId, content, asTask: true });
      if (!r?.id) { setTaskErr(String(r?.error ?? "Could not create the task.")); return; }
      setTaskChannelId(project.channelId);
      setStep("watch");
    } catch (e: any) { setTaskErr(String(e?.message ?? e)); }
    finally { setTaskBusy(false); }
  };

  const doneUpTo = useMemo(() => {
    const order: StepId[] = ["machine", "repo", "team", "task", "watch", "review"];
    const idx = order.indexOf(step);
    return order.slice(0, idx);
  }, [step]);

  return (
    <main className="ob-root">
      <div className="ob-shell">
        <div className="ob-steps" aria-label="Onboarding progress">
          {STEPS.map((s, i) => (
            <div className="ob-step" key={s.id}>
              <StepDot i={i} active={s.id === step} done={doneUpTo.includes(s.id)} />
              <span className="ob-step__label">{s.label}</span>
              {i < STEPS.length - 1 && <span className="ob-step__line" />}
            </div>
          ))}
        </div>

        {step === "machine" && (
          <section className="ob-card">
            <MonitorSmartphone size={22} className="ob-card__icon" />
            <h2>Connect the machine where agents will run</h2>
            <p className="ob-card__lead">Code stays on this machine. Workora's daemon runs your agents here and streams progress back to the workspace.</p>
            {machineOnline ? (
              <div className="ob-ok"><CheckCircle2 size={18} /> Machine connected{onlineMachines[0]?.name ? ` — ${onlineMachines[0].name}` : ""}.</div>
            ) : genErr ? (
              <>
                <p className="ob-err">{genErr}</p>
                <button className="ok" onClick={() => void genKey()} disabled={genBusy}>{genBusy ? "…" : "Retry"}</button>
              </>
            ) : !genRes ? (
              <div className="ob-wait"><span className="ob-pulse" /> Generating a connect key…</div>
            ) : (
              <>
                <label className="ob-label">Run this on the target machine</label>
                <div className="ob-codebox"><code className="grow">{cmd}</code><button className="joinbtn" onClick={copy}>{copied ? "Copied" : "Copy"}</button></div>
                <div className="ob-wait"><span className="ob-pulse" /> Waiting for the daemon to connect…</div>
              </>
            )}
            <div className="ob-acts">
              <button className="ok" disabled={!machineOnline} onClick={() => setStep("repo")}>Continue <ArrowRight size={16} /></button>
            </div>
          </section>
        )}

        {step === "repo" && (
          <section className="ob-card">
            <GitBranch size={22} className="ob-card__icon" />
            <h2>Import your first repo</h2>
            <p className="ob-card__lead">Paste a git URL. Workora clones it on the connected machine and opens a project channel for it.</p>
            <label className="ob-label">Git URL</label>
            <input className="inp" autoFocus value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder="https://github.com/owner/repo" onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) void importRepo(); }} />
            {importErr && <p className="ob-err">{importErr}</p>}
            <div className="ob-acts">
              <button className="cancel" onClick={() => setStep("machine")}>Back</button>
              <button className="ok" disabled={importBusy} onClick={() => void importRepo()}>{importBusy ? "Importing…" : "Import repo"}</button>
            </div>
          </section>
        )}

        {step === "team" && project && (
          <section className="ob-card">
            <Users size={22} className="ob-card__icon" />
            <h2>Choose the team for {project.name}</h2>
            <p className="ob-card__lead">Pick a starting template. You can add more agents later from Projects.</p>
            <div className="ob-templates">
              {TEMPLATES.map((t) => (
                <button key={t.key} className={"ob-template" + (templateKey === t.key ? " is-active" : "")} onClick={() => setTemplateKey(t.key)}>
                  <b>{t.label}</b>
                  <span>{t.hint}</span>
                </button>
              ))}
            </div>
            {teamErr && <p className="ob-err">{teamErr}</p>}
            <div className="ob-acts">
              <button className="cancel" onClick={() => setStep("repo")}>Back</button>
              <button className="ok" disabled={teamBusy} onClick={() => void createTeam()}>{teamBusy ? "Creating…" : "Create team"}</button>
            </div>
          </section>
        )}

        {step === "task" && project && (
          <section className="ob-card">
            <ListChecks size={22} className="ob-card__icon" />
            <h2>Give {project.name} its first task</h2>
            <p className="ob-card__lead">@{boundAgentName} will claim this task, create a branch, and report back in the project channel.</p>
            <label className="ob-label">Task</label>
            <textarea className="inp ob-textarea" value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} />
            {taskErr && <p className="ob-err">{taskErr}</p>}
            <div className="ob-acts">
              <button className="cancel" onClick={() => setStep("team")}>Back</button>
              <button className="ok" disabled={taskBusy || !prompt.trim()} onClick={() => void giveTask()}>{taskBusy ? "Assigning…" : "Assign task"}</button>
            </div>
          </section>
        )}

        {step === "watch" && project && taskChannelId && (
          <section className="ob-card">
            <div className="ob-ok"><CheckCircle2 size={18} /> Task assigned to @{boundAgentName}.</div>
            <h2>Workora is shipping the task</h2>
            <p className="ob-card__lead">Follow along in the project channel — branch creation, tool calls, and the final report all show up live.</p>
            <div className="ob-acts">
              <button className="ok" onClick={() => { setStep("review"); nav(`/s/${slug}/channel/${taskChannelId}`); }}>
                Open the project channel <ArrowRight size={16} />
              </button>
            </div>
          </section>
        )}

        {step === "review" && (
          <section className="ob-card">
            <div className="ob-ok"><CheckCircle2 size={18} /> You're set up.</div>
            <h2>Keep going</h2>
            <p className="ob-card__lead">Add another repo, bind more agents, or give this team its next task from Projects.</p>
            <div className="ob-acts">
              <button className="ok" onClick={() => nav(`/s/${slug}/project`)}>Go to Projects <ArrowRight size={16} /></button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
