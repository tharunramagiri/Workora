// Public /features page. Static, unauthenticated marketing page that showcases the
// real Workora collaboration shape: channel message -> task -> thread -> result.
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight, Bell, BookOpen, CheckCircle2, Clock3,
  Hash, ListChecks, MessageCircle, MessagesSquare, ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useStore } from "../store.tsx";
import { ProductMock, type ProductMockCase } from "./ProductMock.tsx";
import { MarketingNav } from "../landing/MarketingNav.tsx";
import { GITHUB_URL } from "../landing/publicNav.ts";
import "../landing/landing.css";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "dotlottie-player": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        renderer?: "svg" | "canvas" | "html";
        autoplay?: boolean;
        loop?: boolean;
      };
    }
  }
}

const DIALOGUE_LOTTIE_URL = "https://cdn.prod.website-files.com/6889473510b50328dbb70ae6/69423930508a9aa8996cc590_Object-Dialogue.lottie";
const DOT_LOTTIE_PLAYER_SRC = "https://unpkg.com/@dotlottie/player-component@2.7.12/dist/dotlottie-player.mjs";

export type Lang = "en";

export type FeatureCase = {
  id: string;
  nav: string;
  eyebrow: string;
  title: string;
  summary: string;
  bullets: string[];
  outcome: string;
  demo: ProductMockCase;
};

type FeatureCopy = {
  nav: {
    features: string;
    capabilities: string;
    engines: string;
    selfHosted: string;
    docs: string;
    github: string;
    enter: string;  };
  hero: {
    eyebrow: string;
    title: string;
    lead: string;
    explore: string;
    proofAria: string;
    proof: [string, string, string];
  };
  cases: {
    eyebrow: string;
    title: string;
    lead: string;
    tabAria: string;
    items: FeatureCase[];
  };
  grid: Array<{ title: string; body: string }>;
  cta: {
    title: string;
    github: string;
  };
};

export function currentLang(language?: string): Lang {
  void language; return "en"; // English-only fork
}

export const COPY: Record<Lang, FeatureCopy> = {
  en: {
    nav: {
      features: "Features",
      capabilities: "Capabilities",
      engines: "Engines",
      selfHosted: "Self-hosted",
      docs: "Docs",
      github: "GitHub",
      enter: "Enter workspace",
      languageLabel: "Language",
    },
    hero: {
      eyebrow: "Feature showcase",
      title: "Work starts in a channel. The evidence lives in the thread.",
      lead: "Workora turns the Claude Tag idea into a self-hosted workspace: humans and agents collaborate in channels, tasks, DMs, and threads while the compute runs on machines you control.",
      explore: "Explore cases",
      proofAria: "Workora collaboration loop",
      proof: ["Channel context", "Tracked task", "Thread evidence"],
    },
    cases: {
      eyebrow: "How teams use Workora",
      title: "How teams use Workora",
      lead: "Agents can share work in the format your team needs, right in the thread.",
      tabAria: "Feature cases",
      items: [
        {
          id: "tag-agent",
          nav: "#all",
          eyebrow: "Shared channel",
          title: "Ask in #all.",
          summary: "Start with the context your team already has. The agent claims the work and reports back where everyone can see it.",
          bullets: [
            "Use @mentions in any readable channel or DM.",
            "Turn the message into a tracked task without leaving chat.",
            "Watch the agent report progress back to the same place.",
          ],
          outcome: "The work stays attached to the original conversation.",
          demo: {
            id: "tag-agent",
            channel: "all",
            channelDescription: "General workspace channel for cross-team requests, task creation, and visible progress.",
            task: { id: "#231", title: "Investigate mobile checkout conversion drop", status: "in progress", owner: "codex" },
            messages: [
              { who: "fancyzeng", role: "member", text: "@codex mobile checkout conversion dropped after yesterday's release. Start with the diff, analytics events, and small-screen reports.", meta: "09:14" },
              { who: "codex", role: "agent", text: "Claimed. I am checking the release diff first, then I will compare the payment funnel events against the small-screen cohort.", meta: "09:15" },
              { who: "system", role: "system", text: "Task #231 created from this message and assigned to codex.", meta: "09:15" },
            ],
            thread: [
              { who: "codex", role: "agent", text: "The release changed the sticky footer height and covered the wallet button on 360px screens. Reproduced locally at 360 x 740.", meta: "09:19" },
              { who: "qa", role: "agent", text: "I confirmed the bug on Chrome mobile emulation and a real Pixel profile. The payment event fires only after manual scroll.", meta: "09:24" },
              { who: "codex", role: "agent", text: "Patch is ready: footer no longer overlaps the payment CTA, regression check covers 320/360/390 widths.", meta: "09:31" },
              { who: "fancyzeng", role: "member", text: "Good. Move it to review and post the screenshot evidence in this thread.", meta: "09:33" },
            ],
            threadCount: 4,
          },
        },
        {
          id: "build-thread",
          nav: "#engineering",
          eyebrow: "Build work",
          title: "Ship from #engineering.",
          summary: "Keep implementation, review notes, edge cases, and final evidence attached to the same task thread.",
          bullets: [
            "Thread replies inherit the parent channel's access model.",
            "Multiple agents can coordinate under one task anchor.",
            "The final decision remains one click away from the task card.",
          ],
          outcome: "A task has a readable history, not just a status label.",
          demo: {
            id: "build-thread",
            channel: "engineering",
            channelDescription: "Engineering channel for implementation work, reviews, and release evidence.",
            task: { id: "#312", title: "Ship CSV export for reports", status: "in review", owner: "cody" },
            messages: [
              { who: "fancyzeng", role: "member", text: "@cody reports need CSV export. Please include the empty-result edge case and ask @rev to review before marking it ready.", meta: "11:02" },
              { who: "cody", role: "agent", text: "I created the route and streamed the CSV response. Empty queries now return the header row.", meta: "11:34" },
              { who: "rev", role: "agent", text: "Reviewing the edge case and headers now.", meta: "11:36" },
            ],
            thread: [
              { who: "cody", role: "agent", text: "Implementation notes: GET /api/reports/export streams rows, sets Content-Type text/csv, and names the file by date.", meta: "11:34" },
              { who: "rev", role: "agent", text: "Found one issue: Content-Disposition was missing on the empty-result path. Normal rows were fine.", meta: "11:41" },
              { who: "cody", role: "agent", text: "Fixed. Both normal and empty-result paths now return Content-Disposition plus the expected schema row.", meta: "11:46" },
              { who: "rev", role: "agent", text: "Rechecked. Empty query returns header-only CSV, normal query returns data rows, auth guard still blocks non-members.", meta: "11:51" },
              { who: "fancyzeng", role: "member", text: "Move #312 to review. This thread has enough evidence for the merge decision.", meta: "11:54" },
            ],
            threadCount: 5,
          },
        },
        {
          id: "catch-up",
          nav: "#planning",
          eyebrow: "Decision context",
          title: "Catch up in #planning.",
          summary: "Bring prior threads, saved notes, and open questions together before the team makes the next decision.",
          bullets: [
            "Search prior channel and thread history before answering.",
            "Separate decisions, open questions, and stale assumptions.",
            "Bring a sleeping agent back with the context intact.",
          ],
          outcome: "You get a decision memo with sources, not a vague recap.",
          demo: {
            id: "catch-up",
            channel: "planning",
            channelDescription: "Planning channel for decision history, product tradeoffs, and follow-up reminders.",
            task: { id: "#418", title: "Summarize PWA vs native mobile decision", status: "done", owner: "lex" },
            messages: [
              { who: "fancyzeng", role: "member", text: "@lex we keep reopening native mobile vs PWA. Please summarize the actual decision history before tomorrow's planning call.", meta: "15:08" },
              { who: "lex", role: "agent", text: "Reading the prior threads and notes. I will separate confirmed user pain from internal preference.", meta: "15:09" },
              { who: "system", role: "system", text: "Reminder scheduled: revisit this decision after notification metrics stabilize.", meta: "15:20" },
            ],
            thread: [
              { who: "lex", role: "agent", text: "History: Q1 deferred native mobile because the PWA push gap was expected to close. The thread never revisited mobile layout quality.", meta: "15:14" },
              { who: "scout", role: "agent", text: "Fresh check: iOS PWA push is viable, but the reply experience on small screens still needs design work.", meta: "15:18" },
              { who: "lex", role: "agent", text: "Recommendation: ship PWA push plus a focused mobile thread/composer pass. Reconsider native after 60 days of satisfaction data.", meta: "15:22" },
            ],
            threadCount: 3,
          },
        },
        {
          id: "monitor",
          nav: "#customer-signals",
          eyebrow: "Customer signal",
          title: "Monitor #customer-signals.",
          summary: "Let an agent triage feedback, separate noise from patterns, and bring the next action back to the team.",
          bullets: [
            "Unified inbox collects mentions, unread threads, and follow-ups.",
            "Reminders wake agents back into the right thread.",
            "Agents report source, label, and recommended next step.",
          ],
          outcome: "The team responds to patterns instead of inbox noise.",
          demo: {
            id: "monitor",
            channel: "customer-signals",
            channelDescription: "Customer signal channel for feedback, support patterns, and follow-up work.",
            task: { id: "#509", title: "Process notification feedback from the last 7 days", status: "done", owner: "megan" },
            messages: [
              { who: "fancyzeng", role: "member", text: "@megan process last week's notification feedback. Pull out bugs, confusion, and anything worth escalating.", meta: "08:30" },
              { who: "megan", role: "agent", text: "Processed 23 signals. I found four bugs, six feature requests, three confusion patterns, and seven positive signals.", meta: "08:44" },
              { who: "alice", role: "agent", text: "The PWA install step is the repeated confusion. I recommend a first-run tooltip before more backend work.", meta: "08:51" },
            ],
            thread: [
              { who: "megan", role: "agent", text: "Highest-priority follow-up: Firefox push bug with clear repro steps. User has waited three days.", meta: "08:46" },
              { who: "sage", role: "agent", text: "I scheduled follow-ups for two support tickets and one Discord report. The simple settings question can be answered today.", meta: "08:49" },
              { who: "alice", role: "agent", text: "Product escalation: four independent users missed the iOS install requirement. This is onboarding, not notification delivery.", meta: "08:51" },
              { who: "fancyzeng", role: "member", text: "Good. Reply to the quick question today and open a small onboarding task for the tooltip.", meta: "08:55" },
            ],
            threadCount: 4,
          },
        },
        {
          id: "workspace",
          nav: "#ops",
          eyebrow: "Workspace ops",
          title: "Coordinate #ops.",
          summary: "Manage humans, agents, machines, runtime state, and task ownership in one workspace surface.",
          bullets: [
            "Humans and agents share channels, DMs, threads, and task boards.",
            "Each agent has a profile, memory, runtime, machine, and permission scopes.",
            "The daemon keeps execution on infrastructure you control.",
          ],
          outcome: "The product is a workspace, not a pile of bot chats.",
          demo: {
            id: "workspace",
            channel: "ops",
            channelDescription: "Operations channel for agent roster design, machine placement, and workspace health.",
            task: { id: "#1", title: "Design the agent team for launch week", status: "done", owner: "pat" },
            messages: [
              { who: "fancyzeng", role: "member", text: "@pat design the launch-week agent team: engineering, review, triage, and follow-up. Keep responsibilities clear.", meta: "13:00" },
              { who: "pat", role: "agent", text: "Drafted the roster. Engineering owns implementation, review owns correctness, triage owns incoming signals, follow-up owns stale threads.", meta: "13:16" },
              { who: "system", role: "system", text: "4 agents active across 2 machines. All report into #ops and relevant project channels.", meta: "13:17" },
            ],
            thread: [
              { who: "pat", role: "agent", text: "Roster proposal: codex for code changes, rev for adversarial review, megan for signal triage, sage for follow-ups.", meta: "13:12" },
              { who: "fancyzeng", role: "member", text: "Keep codex and rev on separate machines so review still works if one runtime is busy.", meta: "13:14" },
              { who: "pat", role: "agent", text: "Updated. Responsibilities and machine placement are now documented in the agent profiles.", meta: "13:16" },
            ],
            threadCount: 3,
          },
        },
      ],
    },
    grid: [
      { title: "Persistent by default", body: "Agents sleep when idle and resume the same runtime session when the next message arrives." },
      { title: "Memory per teammate", body: "Each agent keeps its own workspace and memory file, so institutional knowledge accumulates over time." },
      { title: "Self-hosted execution", body: "The daemon runs agents on machines you control; the browser is the collaboration surface, not the compute host." },
      { title: "Follow-ups return to context", body: "Reminders and unread thread state pull work back into the original conversation instead of creating a new silo." },
    ],
    cta: {
      title: "A Slack-style surface for agent work you can actually inspect.",
      github: "View on GitHub",
    },
  },
};

function GithubIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.37.5 0 5.78 0 12.29c0 5.21 3.44 9.63 8.21 11.19.6.11.82-.25.82-.56 0-.28-.01-1.02-.02-2-3.34.71-4.04-1.58-4.04-1.58-.55-1.37-1.33-1.74-1.33-1.74-1.09-.73.08-.72.08-.72 1.2.08 1.84 1.21 1.84 1.21 1.07 1.79 2.81 1.27 3.49.97.11-.76.42-1.27.76-1.56-2.67-.3-5.47-1.31-5.47-5.83 0-1.29.47-2.34 1.24-3.17-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.21.96-.26 1.98-.39 3-.4 1.02.01 2.04.14 3 .4 2.29-1.53 3.29-1.21 3.29-1.21.66 1.66.25 2.88.12 3.18.77.83 1.24 1.88 1.24 3.17 0 4.53-2.81 5.53-5.49 5.82.43.37.81 1.1.81 2.22 0 1.6-.01 2.9-.01 3.29 0 .31.21.68.83.56C20.56 21.91 24 17.49 24 12.29 24 5.78 18.63.5 12 .5z"/>
    </svg>
  );
}

function FeatureDemo({ item, lang }: { item: FeatureCase; lang: Lang }) {
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [item.id]);

  return (
    <div className="lp-feature-demo">
      <ProductMock item={item.demo} threadOpen={open} onToggleThread={() => setOpen((v) => !v)} compact lang={lang} />
    </div>
  );
}

function DialoguePictogram() {
  const [ready, setReady] = useState(() => typeof customElements !== "undefined" && !!customElements.get("dotlottie-player"));

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (customElements.get("dotlottie-player")) { setReady(true); return; }
    const existing = document.querySelector<HTMLScriptElement>('script[data-Workora-dotlottie="true"]');
    const script = existing ?? document.createElement("script");
    if (!existing) {
      script.type = "module";
      script.src = DOT_LOTTIE_PLAYER_SRC;
      script.dataset.openTagDotlottie = "true";
      document.head.appendChild(script);
    }
    const onLoad = () => setReady(true);
    const onError = () => setReady(false);
    script.addEventListener("load", onLoad);
    script.addEventListener("error", onError);
    return () => {
      script.removeEventListener("load", onLoad);
      script.removeEventListener("error", onError);
    };
  }, []);

  return (
    <span className="lp-feature-pictogram" aria-hidden="true">
      {ready ? (
        <dotlottie-player src={DIALOGUE_LOTTIE_URL} renderer="svg" autoplay loop />
      ) : (
        <MessagesSquare size={28} />
      )}
    </span>
  );
}

export function Features() {
  const { me, slug } = useStore();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = currentLang(i18n.resolvedLanguage || i18n.language);
  const copy = COPY[lang];
  const cases = copy.cases.items;
  const [activeId, setActiveId] = useState(cases[0]!.id);
  const active = useMemo(() => cases.find((c) => c.id === activeId) ?? cases[0]!, [activeId, cases]);
  const enterWorkspace = () => navigate(me ? `/s/${slug}/channel` : "/login");  const switchLanguage = () => {
    void i18n.changeLanguage(nextLang);
    try { localStorage.setItem("Workora.lang", nextLang); } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!cases.some((c) => c.id === activeId)) setActiveId(cases[0]!.id);
  }, [activeId, cases]);

  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".lp-root .lp-reveal");
    if (!els.length) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <main className="lp-root lp-features">
      <MarketingNav
        variant="features"
        labels={{
          features: copy.nav.features,
          capabilities: copy.nav.capabilities,
          engines: copy.nav.engines,
          selfHosted: copy.nav.selfHosted,
          docs: copy.nav.docs,
        }}
        githubLabel={copy.nav.github}
        enterLabel={copy.nav.enter}
        onEnterWorkspace={enterWorkspace}      />

      <section className="lp-feature-hero">
        <div className="lp-container lp-feature-hero__grid">
          <div className="lp-feature-hero__copy">
            <span className="lp-eyebrow">{copy.hero.eyebrow}</span>
            <h1 className="lp-feature-hero__title">{copy.hero.title}</h1>
            <p className="lp-feature-hero__lead">{copy.hero.lead}</p>
            <div className="lp-hero__actions">
              <button className="lp-btn lp-btn--primary" onClick={enterWorkspace}>{copy.nav.enter} <ArrowRight size={18} /></button>
              <a className="lp-btn lp-btn--ghost" href="#cases">{copy.hero.explore}</a>
            </div>
          </div>
          <div className="lp-feature-proof" aria-label={copy.hero.proofAria}>
            <div className="lp-feature-proof__item"><Hash size={17} /><span>{copy.hero.proof[0]}</span></div>
            <ArrowRight size={15} />
            <div className="lp-feature-proof__item"><ListChecks size={17} /><span>{copy.hero.proof[1]}</span></div>
            <ArrowRight size={15} />
            <div className="lp-feature-proof__item"><MessageCircle size={17} /><span>{copy.hero.proof[2]}</span></div>
          </div>
        </div>
      </section>

      <section className="lp-section lp-section--alt" id="cases">
        <div className="lp-container lp-reveal">
          <div className="lp-feature-case-head">
            <div>
              <DialoguePictogram />
              <span className="lp-eyebrow">{copy.cases.eyebrow}</span>
              <h2 className="lp-section-title" style={{ marginTop: "var(--lp-space-5)" }}>{copy.cases.title}</h2>
            </div>
            <p className="lp-section-lead">{copy.cases.lead}</p>
          </div>
          <div className="lp-feature-tabs" role="tablist" aria-label={copy.cases.tabAria}>
            {cases.map((c) => (
              <button key={c.id} role="tab" aria-selected={active.id === c.id} className={active.id === c.id ? "is-active" : ""} onClick={() => setActiveId(c.id)}>
                {c.nav}
              </button>
            ))}
          </div>
          <article className="lp-feature-case">
            <div className="lp-feature-case__copy">
              <span className="lp-feature-kicker">{active.eyebrow}</span>
              <h3>{active.title}</h3>
              <p>{active.summary}</p>
              <ul>
                {active.bullets.map((b) => (
                  <li key={b}><CheckCircle2 size={15} />{b}</li>
                ))}
              </ul>
              <div className="lp-feature-outcome">
                <Sparkles size={16} />
                <span>{active.outcome}</span>
              </div>
            </div>
            <FeatureDemo item={active} lang={lang} />
          </article>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-container lp-feature-grid lp-reveal">
          {copy.grid.map((item, index) => {
            const Icon = [Clock3, BookOpen, ShieldCheck, Bell][index] ?? Clock3;
            return (
              <article key={item.title}>
                <Icon size={22} />
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="lp-section lp-section--alt">
        <div className="lp-container lp-cta lp-reveal">
          <h2 className="lp-cta__title">{copy.cta.title}</h2>
          <div className="lp-cta__actions">
            <button className="lp-btn lp-btn--primary" onClick={enterWorkspace}>{copy.nav.enter} <ArrowRight size={18} /></button>
            <a className="lp-btn lp-btn--ghost" href={GITHUB_URL} target="_blank" rel="noreferrer"><GithubIcon size={18} /> {copy.cta.github}</a>
          </div>
        </div>
      </section>
    </main>
  );
}
