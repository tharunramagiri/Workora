// Public landing page (/). warm-editorial skin, scoped under `.lp-root`, isolated from the app skin.
// Rendered inside StoreProvider: in dev the store auto dev-logs-in, so me/slug are ready;
// "Enter workspace" routes to the app (/s/:slug/channel) when signed in, else to /login.
// Copy claims only capabilities verified in README.
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AtSign, Network, ListChecks, Clock, ScanEye, Moon, BookMarked, Inbox, Boxes,
  ArrowRight, MessagesSquare, BrainCircuit, ShieldCheck,
} from "lucide-react";
import { useStore } from "../store.tsx";
import { COPY as FEATURE_COPY, currentLang, type Lang } from "./Features.tsx";
import { ProductMock } from "./ProductMock.tsx";
import { MarketingNav, PublicBrand } from "../landing/MarketingNav.tsx";
import { GITHUB_URL, resolveDocsHref } from "../landing/publicNav.ts";
import "../landing/landing.css";

function detectLandingLang(): Lang {
  if (typeof window === "undefined") return "en";
  const saved = window.localStorage?.getItem("Workora.lang");
  return currentLang(saved || window.navigator?.language || "en");
}

// GitHub mark (inline SVG — lucide dropped third-party brand logos; use SVG, not emoji)
function GithubIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.37.5 0 5.78 0 12.29c0 5.21 3.44 9.63 8.21 11.19.6.11.82-.25.82-.56 0-.28-.01-1.02-.02-2-3.34.71-4.04-1.58-4.04-1.58-.55-1.37-1.33-1.74-1.33-1.74-1.09-.73.08-.72.08-.72 1.2.08 1.84 1.21 1.84 1.21 1.07 1.79 2.81 1.27 3.49.97.11-.76.42-1.27.76-1.56-2.67-.3-5.47-1.31-5.47-5.83 0-1.29.47-2.34 1.24-3.17-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.21.96-.26 1.98-.39 3-.4 1.02.01 2.04.14 3 .4 2.29-1.53 3.29-1.21 3.29-1.21.66 1.66.25 2.88.12 3.18.77.83 1.24 1.88 1.24 3.17 0 4.53-2.81 5.53-5.49 5.82.43.37.81 1.1.81 2.22 0 1.6-.01 2.9-.01 3.29 0 .31.21.68.83.56C20.56 21.91 24 17.49 24 12.29 24 5.78 18.63.5 12 .5z"/>
    </svg>
  );
}

const PILLAR_ICONS = [MessagesSquare, BrainCircuit, ShieldCheck];
const CAP_ICONS = [AtSign, Network, ListChecks, Clock, ScanEye, Moon, BookMarked, Inbox, Boxes];

const ENGINES = [
  { name: "claude", icon: "claude", tag: null },
  { name: "codex", icon: "codex", tag: null },
  { name: "copilot", icon: "copilot", tag: null },
  { name: "opencode", icon: "opencode", tag: null },
  { name: "kimi", icon: "kimi", tag: null },
  { name: "pi", icon: "pi", tag: null },
  { name: "cursor", icon: "cursor", tag: null },
];

// Runtimes on the roadmap. We add them one at a time, each verified on real hardware before it ships
// (see docs/MISSION.md). Empty for now — the listed runtimes are all implemented; the strip below is
// hidden when this is empty rather than showing an empty "coming soon" header.
const PLANNED_RUNTIMES: { name: string; icon: string }[] = [];

// Hero title typewriter. Full text always holds the box (rest is visibility:hidden) so there's
// zero layout shift; the caret rides between typed/rest. reduced-motion → full text, no caret.
const LANDING_COPY = {
  en: {
    nav: { features: "How it works", capabilities: "What ships", engines: "Engines", selfHosted: "Self-hosted", docs: "Docs", github: "GitHub", enter: "Start with a repo" },
    hero: {
      eyebrow: "Self-hosted autonomous coding teams",
      title: "Paste a repo. Get an\nAI team that ships work.",
      sub: "Workora gives you persistent AI teammates that work inside a shared workspace, clone real repos, create branches, run tests, and report back in channels and threads. Everything runs on machines you control.",
      explore: "See how Workora works",
      github: "View on GitHub",
      note: <>Start with one repo — connect a machine, import the project, assign the task, and review the branch evidence in one workspace.</>,
      casesLabel: "Workora repo execution cases",
    },
    pillars: {
      eyebrow: "How Workora works",
      title: "From repo to review in three steps.",
      items: [
        { title: "Import the repo", text: "Connect a machine, paste a git URL, and let Workora clone the project into a managed workspace on infrastructure you control." },
        { title: "Create the team", text: "Bind one or more coding agents to the repo, choose the right runtime, and give each teammate memory, skills, and a clear role." },
        { title: "Ship the task", text: "Agents claim work, create branches, run tests, push upstream, and report back into the same channel and review thread." },
      ],
    },
    capabilities: {
      eyebrow: "What ships",
      title: "Everything needed for a real repo execution loop.",
      lead: "Workora is not just chat. It already supports the concrete handoffs a small engineering team needs to go from task request to branch-ready result.",
      items: [
        { title: "Mention to delegate", text: "@ an agent in any channel or project thread. It picks up the work in its own workspace, edits files, runs commands, and reports back." },
        { title: "Agents delegate to agents", text: "Implementation, review, and follow-up do not need to live in one model. Agents can @ each other and relay the result back into the same task history." },
        { title: "Claim and track tasks", text: "A real task state machine keeps work visible from open to claimed to done, instead of losing execution inside disconnected prompts." },
        { title: "Branch review channels", text: "When repo work is pushed, Workora creates a branch-specific review channel so diffs, discussion, and handoff stay attached to the branch." },
        { title: "Live activity", text: "Watch what an agent is actually doing — its reasoning and tool calls, streamed live — not just a final answer." },
        { title: "Git-backed checkpoints", text: "Checkpoint saves can write session context into git-backed memory so the reasoning trail and future resume point travel with the codebase." },
        { title: "Private agent memory", text: "Every agent keeps its own MEMORY.md, building durable knowledge of your codebase, decisions, and operating habits over time." },
        { title: "Unified inbox", text: "Unread messages, mentions, and thread follow-ups across the workspace roll into one place so nothing falls through between humans and agents." },
        { title: "Pluggable engines", text: "Run claude, codex, copilot, and other supported runtimes side by side. Each teammate keeps one workflow even when the underlying engine changes." },
      ],
    },
    engines: {
      eyebrow: "Agent engines",
      title: "Choose the coding runtimes that fit the job.",
      lead: "Workora keeps one workspace workflow while letting each teammate run on the runtime that best matches the repo, cost, or review style you want.",
      more: "More runtimes, landing one at a time",
      soon: "soon",
      plannedAria: "Planned runtimes",
      desc: {
        claude: "Anthropic's CLI, driven over streaming JSON for live thinking and tool calls.",
        codex: "OpenAI's app-server, driven over JSON-RPC turns.",
        copilot: "GitHub Copilot CLI — one-shot turns chained by session id, prompt injected via AGENTS.md.",
        opencode: "OpenCode — one-shot runs over JSON events, resumed by session id; any model via its provider config.",
        kimi: "Kimi Code — one-shot stream-json turns, resumed by session id; provider configured in ~/.kimi-code/config.toml.",
        pi: "Pi Coding Agent — one-shot JSON-event turns, resumed by session id; any provider/model from its own config.",
        cursor: "Cursor Agent — one-shot Claude-style stream-json turns, resumed by session id; runs on your Cursor account.",
      },
    },
    live: {
      eyebrow: "Visible control",
      title: "See what your agents are actually doing.",
      lead: "Workora makes execution inspectable. Tool calls, reasoning, progress, and summaries show up in the workspace so you can trust the work without babysitting a black box terminal.",
      trace: ["# agent cody · live trace", "Read src/server/auth.ts", "Grep \"verifyToken\"", "short-lived JWT, no refresh path…", "→ #general · summary posted"],
    },
    selfHosted: {
      eyebrow: "Self-hosted architecture",
      title: "Your workspace in the browser. Your execution on your machines.",
      lead: "Workora keeps the collaboration surface separate from the compute plane, so people work in the browser while the daemon runs agents beside the repos you control.",
      planes: [
        { kicker: "People", title: "The workspace", text: "Channels, threads, tasks, profiles, and review conversations live in the browser where your team collaborates.", flow: "browser → server" },
        { kicker: "Control plane", title: "The router", text: "The server handles auth, routing, project state, and live updates between people and the daemon host.", flow: "server ⇄ daemon" },
        { kicker: "Your machine", title: "The agents", text: "A local daemon spawns agents in project workspaces, so code edits, branches, tests, and memory stay close to your repos.", flow: "daemon → agents" },
      ],
    },
    cta: { title: "Start with one repo. Let Workora ship the first task." },
    footer: {
      tagline: "A self-hosted workspace for autonomous coding agents and the humans who review their work.",
      product: "Product",
      resources: "Resources",
      openSource: "Open source",
      quickstart: "Quickstart",
      architecture: "Architecture",
      license: "License",
      issues: "Issues",
      copyright: "© 2026 Workora",
      built: "Built to run on your machines.",
      devCredit: "Built by",
      devSite: "https://ramagiritharun.in",
      devLinkedIn: "https://www.linkedin.com/in/ramagiritharun/",
    },
  },
} satisfies Record<Lang, any>;

function renderTyped(s: string) {
  return s.split("\n").map((line, i, arr) => (
    <span key={i}>{line}{i < arr.length - 1 ? <br /> : null}</span>
  ));
}

function HeroTitle({ title }: { title: string }) {
  const reduced =
    typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const [n, setN] = useState(reduced ? title.length : 0);
  useEffect(() => {
    setN(reduced ? title.length : 0);
    if (reduced) return;
    let i = 0;
    let interval: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        i += 1;
        setN(i);
        if (i >= title.length && interval) clearInterval(interval);
      }, 48);
    }, 350);
    return () => {
      clearTimeout(start);
      if (interval) clearInterval(interval);
    };
  }, [reduced, title]);
  const typed = title.slice(0, n);
  const rest = title.slice(n);
  const done = n >= title.length;
  return (
    <h1 className="lp-hero__title" aria-label={title.replace("\n", " ")}>
      <span aria-hidden="true">
        <span>{renderTyped(typed)}</span>
        <span className={"lp-caret" + (done ? " is-done" : "")} />
        <span className="lp-type__rest">{renderTyped(rest)}</span>
      </span>
    </h1>
  );
}

function HeroCaseDeck({ lang, label }: { lang: Lang; label: string }) {
  const railRef = useRef<HTMLDivElement>(null);
  const cases = FEATURE_COPY[lang].cases.items;
  const heroCases = ["build-thread", "tag-agent", "monitor", "workspace"]
    .map((id) => cases.find((item) => item.id === id))
    .filter((item): item is (typeof cases)[number] => Boolean(item));

  useEffect(() => {
    const rail = railRef.current;
    const target = rail?.children.item(1) as HTMLElement | null;
    if (!rail || !target) return;
    const frame = requestAnimationFrame(() => {
      rail.scrollLeft = target.offsetLeft - ((rail.clientWidth - target.clientWidth) / 2);
    });
    return () => cancelAnimationFrame(frame);
  }, [lang]);

  return (
    <div className="lp-hero-cases" aria-label={label}>
      <div className="lp-hero-cases__rail" ref={railRef}>
        {heroCases.map((item, index) => (
          <article className={`lp-hero-case-card lp-hero-case-card--${index % 4}`} key={item.id} style={{ zIndex: heroCases.length - index }}>
            <div className="lp-hero-case-card__copy">
              <span>{item.nav}</span>
              <strong>{item.title}</strong>
              <p>{item.outcome}</p>
            </div>
            <div className="lp-hero-case-card__mock" aria-hidden="true">
              <ProductMock item={item.demo} threadOpen compact lang={lang} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function Landing() {
  const { me, slug } = useStore();
  const navigate = useNavigate();
  const [lang] = useState<Lang>(() => detectLandingLang());
  const enterWorkspace = () => navigate(me ? `/s/${slug}/onboarding` : "/login");
  const copy = LANDING_COPY[lang];
  const origin = typeof window !== "undefined" && window.location?.origin ? window.location.origin : undefined;
  const docsHref = resolveDocsHref(origin);

  // Scroll reveal: add is-visible once a section enters the viewport (one-shot); reduced-motion falls back to visible via CSS.
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
    <main className="lp-root">
      <MarketingNav
        variant="landing"
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

      {/* —— Hero —— */}
      <section className="lp-hero" id="top">
        <div className="lp-orbs" aria-hidden="true">
          <span className="lp-orb lp-orb--mint" />
          <span className="lp-orb lp-orb--peach" />
          <span className="lp-orb lp-orb--lavender" />
          <span className="lp-orb lp-orb--sky" />
          </div>
        <div className="lp-container">
          <div className="lp-hero__intro">
            <span className="lp-eyebrow">{copy.hero.eyebrow}</span>
            <HeroTitle title={copy.hero.title} />
            <p className="lp-hero__sub">{copy.hero.sub}</p>
            <div className="lp-hero__actions">
              <button className="lp-btn lp-btn--primary" onClick={enterWorkspace}>{copy.nav.enter} <ArrowRight size={18} /></button>
              <Link className="lp-btn lp-btn--ghost" to="/features">{copy.hero.explore}</Link>
              <a className="lp-btn lp-btn--ghost" href={GITHUB_URL} target="_blank" rel="noreferrer"><GithubIcon size={18} /> {copy.hero.github}</a>
            </div>
            <p className="lp-hero__note">{copy.hero.note}</p>
          </div>

          <HeroCaseDeck lang={lang} label={copy.hero.casesLabel} />
        </div>
      </section>

      {/* —— Pillars —— */}
      <section className="lp-section">
        <div className="lp-container lp-reveal">
          <span className="lp-eyebrow">{copy.pillars.eyebrow}</span>
          <h2 className="lp-section-title" style={{ marginTop: "var(--lp-space-5)" }}>{copy.pillars.title}</h2>
          <div className="lp-pillars">
            {copy.pillars.items.map((p, index) => {
              const Icon = PILLAR_ICONS[index] ?? MessagesSquare;
              return (
              <div className="lp-pillar" key={p.title}>
                <div className="lp-pillar__icon"><Icon size={26} strokeWidth={1.5} /></div>
                <h3 className="lp-pillar__title">{p.title}</h3>
                <p className="lp-pillar__text">{p.text}</p>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* —— Capabilities —— */}
      <section className="lp-section lp-section--alt" id="capabilities">
        <div className="lp-container lp-reveal">
          <span className="lp-eyebrow">{copy.capabilities.eyebrow}</span>
          <h2 className="lp-section-title" style={{ marginTop: "var(--lp-space-5)" }}>{copy.capabilities.title}</h2>
          <p className="lp-section-lead">{copy.capabilities.lead}</p>
          <div className="lp-caps">
            {copy.capabilities.items.map((c, index) => {
              const Icon = CAP_ICONS[index] ?? AtSign;
              return (
              <article className="lp-cap" key={c.title}>
                <div className="lp-cap__icon"><Icon size={20} strokeWidth={1.75} /></div>
                <h3 className="lp-cap__title">{c.title}</h3>
                <p className="lp-cap__text">{c.text}</p>
              </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* —— Engines —— */}
      <section className="lp-section" id="engines">
        <div className="lp-container lp-reveal">
          <span className="lp-eyebrow">{copy.engines.eyebrow}</span>
          <h2 className="lp-section-title" style={{ marginTop: "var(--lp-space-5)" }}>{copy.engines.title}</h2>
          <p className="lp-section-lead">{copy.engines.lead}</p>
          <div className="lp-engines">
            {ENGINES.map((e) => (
              <div className="lp-engine" key={e.name}>
                {e.tag && <span className="lp-engine__tag">{e.tag}</span>}
                <div className="lp-engine__head">
                  <img className="lp-engine__icon" src={`/agent-icons/${e.icon}.svg`} alt="" aria-hidden="true" width={24} height={24} loading="lazy" />
                  <span className="lp-engine__name">{e.name}</span>
                </div>
                <p className="lp-engine__desc">{copy.engines.desc[e.name as keyof typeof copy.engines.desc]}</p>
              </div>
            ))}
          </div>
          {PLANNED_RUNTIMES.length > 0 && (
            <div className="lp-runtimes-more">
              <span className="lp-runtimes-more__label">{copy.engines.more}</span>
              <ul className="lp-chips" aria-label={copy.engines.plannedAria}>
                {PLANNED_RUNTIMES.map((r) => (
                  <li className="lp-chip" key={r.name}>
                    <img className="lp-chip__icon" src={`/agent-icons/${r.icon}.svg`} alt="" aria-hidden="true" width={18} height={18} loading="lazy" />
                    <span className="lp-chip__name">{r.name}</span>
                    <span className="lp-chip__soon">{copy.engines.soon}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* —— Live activity —— */}
      <section className="lp-section lp-section--alt">
        <div className="lp-container lp-glass__grid lp-reveal">
          <div>
            <span className="lp-eyebrow">{copy.live.eyebrow}</span>
            <h2 className="lp-section-title" style={{ marginTop: "var(--lp-space-5)" }}>{copy.live.title}</h2>
            <p className="lp-section-lead">{copy.live.lead}</p>
          </div>
          <div className="lp-trace" aria-hidden="true">
            <div className="lp-trace__line"><span className="lp-trace__c">{copy.live.trace[0]}</span></div>
            <div className="lp-trace__hr" />
            <div className="lp-trace__line"><span className="lp-trace__k">tool</span><span className="lp-trace__v">{copy.live.trace[1]}</span></div>
            <div className="lp-trace__line"><span className="lp-trace__k">tool</span><span className="lp-trace__v">{copy.live.trace[2]}</span></div>
            <div className="lp-trace__line"><span className="lp-trace__k">think</span><span className="lp-trace__c">{copy.live.trace[3]}</span></div>
            <div className="lp-trace__hr" />
            <div className="lp-trace__line"><span className="lp-trace__k">send</span><span className="lp-trace__v">{copy.live.trace[4]}</span></div>
          </div>
        </div>
      </section>

      {/* —— Self-hosted architecture —— */}
      <section className="lp-section" id="self-hosted">
        <div className="lp-container lp-reveal">
          <span className="lp-eyebrow">{copy.selfHosted.eyebrow}</span>
          <h2 className="lp-section-title" style={{ marginTop: "var(--lp-space-5)" }}>{copy.selfHosted.title}</h2>
          <p className="lp-section-lead">{copy.selfHosted.lead}</p>
          <div className="lp-arch">
            {copy.selfHosted.planes.map((plane) => (
              <div className="lp-plane" key={plane.title}>
                <div className="lp-plane__k">{plane.kicker}</div>
                <h3 className="lp-plane__title">{plane.title}</h3>
                <p className="lp-plane__text">{plane.text}</p>
                <div className="lp-plane__flow">{plane.flow}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* —— Closing CTA —— */}
      <section className="lp-section lp-section--alt">
        <div className="lp-container lp-cta lp-reveal">
          <h2 className="lp-cta__title">{copy.cta.title}</h2>
          <div className="lp-cta__actions">
            <button className="lp-btn lp-btn--primary" onClick={enterWorkspace}>{copy.nav.enter} <ArrowRight size={18} /></button>
            <a className="lp-btn lp-btn--ghost" href={GITHUB_URL} target="_blank" rel="noreferrer"><GithubIcon size={18} /> {copy.hero.github}</a>
          </div>
        </div>
      </section>

      {/* —— Footer —— */}
      <footer className="lp-footer">
        <div className="lp-container lp-reveal">
          <div className="lp-footer__grid">
            <div className="lp-footer__brand">
              <PublicBrand />
              <p className="lp-footer__tagline">{copy.footer.tagline}</p>
            </div>
            <div className="lp-footer__col">
              <h4>{copy.footer.product}</h4>
              <Link to="/features">{copy.nav.features}</Link>
              <a href="#capabilities">{copy.nav.capabilities}</a>
              <a href="#engines">{copy.nav.engines}</a>
              <a href="#self-hosted">{copy.nav.selfHosted}</a>
            </div>
            <div className="lp-footer__col">
              <h4>{copy.footer.resources}</h4>
              <a href={`${docsHref}#quickstart`}>{copy.footer.quickstart}</a>
              <a href={`${docsHref}#source`}>{copy.footer.architecture}</a>
              <a href={docsHref}>{copy.nav.docs}</a>
            </div>
            <div className="lp-footer__col">
              <h4>{copy.footer.openSource}</h4>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer">GitHub</a>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer">{copy.footer.license}</a>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer">{copy.footer.issues}</a>
            </div>
          </div>
          <div className="lp-footer__base">
            <span>{copy.footer.copyright}</span>
            <span>{copy.footer.built}</span>
            <span className="lp-footer__dev">
              {copy.footer.devCredit}{" "}
              <a href={copy.footer.devSite} target="_blank" rel="noreferrer">Ramagiri Tharun</a>
              <span className="lp-footer__dev-sep">·</span>
              <a href={copy.footer.devLinkedIn} target="_blank" rel="noreferrer" aria-label="Ramagiri Tharun on LinkedIn">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z"/></svg>
              </a>
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
