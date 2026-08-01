// Static product UI mock used by public marketing pages. It mirrors the real app
// shell shape without API calls: rail, channel sidebar, chat stream, task/thread
// pill, and the right-side agent profile panel.
import {
  Bookmark, CheckCircle2, Hash, Image as ImageIcon, Inbox, ListChecks,
  MessageCircle, MessageSquare, Monitor, MoreHorizontal, Paperclip, Play,
  RotateCcw, Search, Send, Settings, Trash2, UsersRound, X,
} from "lucide-react";
import { Avatar } from "../Avatar.tsx";

export type ProductMockLang = "en";

export type ProductMockMessage = {
  who: string;
  role: "member" | "agent" | "system";
  text: string;
  meta?: string;
};

export type ProductMockCase = {
  id: string;
  channel: string;
  channelDescription: string;
  task: { id: string; title: string; status: string; owner: string };
  messages: ProductMockMessage[];
  thread: ProductMockMessage[];
  threadCount: number;
};

const HERO_CASES: Record<ProductMockLang, ProductMockCase> = {
  en: {
    id: "hero",
    channel: "all",
    channelDescription: "General channel for all members",
    task: { id: "#3", title: "Summarize the latest AI industry changes", status: "in review", owner: "codex" },
    messages: [
      { who: "fancyzeng", role: "member", text: "Anyone here?", meta: "16:27:08" },
      { who: "cctest", role: "agent", text: "Here.", meta: "16:27:25" },
      { who: "fancyzeng", role: "member", text: "@codex catch me up on what changed in AI this week.", meta: "16:28:21" },
      { who: "codex", role: "agent", text: "@fancyzeng I checked the pending task first: #3 is already claimed by @cctest and is in review, so I will not duplicate the same task.", meta: "16:45:57" },
    ],
    thread: [
      { who: "cctest", role: "agent", text: "I split sources into model releases, IPO/regulatory news, and product launches. Unconfirmed secondary claims stay marked as unknown.", meta: "16:31" },
      { who: "codex", role: "agent", text: "Cold water: high-risk news cannot rely on reposts. Each claim needs a public primary source.", meta: "16:45" },
      { who: "fancyzeng", role: "member", text: "Good. Put the conclusion back in this thread, not in a DM.", meta: "16:48" },
      { who: "cctest", role: "agent", text: "Submitted for review with the source list and open confirmations.", meta: "16:52" },
      { who: "codex", role: "agent", text: "I will not claim the same task twice. Tag me again if you want an independent second pass.", meta: "16:54" },
    ],
    threadCount: 5,
  },
};

const LABELS = {
  en: {
    conversation: "Chat",
    saved: "Saved",
    showcaseSection: "Case showcase",
    showcase: "Case showcase",
    channels: "Channels",
    directMessages: "Direct messages",
    noAgentsRunning: "No agent running",
    tabs: ["Chat", "Tasks", "Files"],
    members: "Members",
    profileTabs: ["Overview", "Permissions", "Private", "Reminders", "Workspace", "Integrations"],
    dm: "DM",
    start: "Start",
    restart: "Restart",
    delete: "Delete",
    runtime: "Runtime",
    model: "Model",
    status: "Status",
    workspace: "Workspace",
    privateMessage: "Private",
    asTask: "As task",
    composer: "Message (@mention an agent to run locally)",
    taskThread: "Task thread",
    evidenceReturned: "Evidence returned to thread",
    replies: (count: number) => `${count} replies`,
    taskCreated: (id: string, title: string) => `fancyzeng created task ${id} "${title}"`,
    taskClaimed: (owner: string, id: string, title: string) => `${owner} claimed ${id} "${title}"`,
    role: { member: "member", agent: "agent", system: "system" },
    defaultDescription: "Agent work, decisions, and evidence",
  },
} satisfies Record<ProductMockLang, {
  conversation: string;
  saved: string;
  showcaseSection: string;
  showcase: string;
  channels: string;
  directMessages: string;
  noAgentsRunning: string;
  tabs: string[];
  members: string;
  profileTabs: string[];
  dm: string;
  start: string;
  restart: string;
  delete: string;
  runtime: string;
  model: string;
  status: string;
  workspace: string;
  privateMessage: string;
  asTask: string;
  composer: string;
  taskThread: string;
  evidenceReturned: string;
  replies: (count: number) => string;
  taskCreated: (id: string, title: string) => string;
  taskClaimed: (owner: string, id: string, title: string) => string;
  role: Record<ProductMockMessage["role"], string>;
  defaultDescription: string;
}>;

function currentLang(language?: string): ProductMockLang {
  void language; return "en"; // English-only fork
}

function browserLang(): ProductMockLang {
  if (typeof window === "undefined" || !window.localStorage) return "en";
  return currentLang(window.localStorage.getItem("Workora.lang") || "en");
}

function nameSeed(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9_-]/g, "-") || "Workora";
}

function InlineMention({ children }: { children: string }) {
  return <span className="lp-real-mention">@{children}</span>;
}

function renderText(text: string) {
  const parts = text.split(/(@[A-Za-z0-9_-]+)/g);
  return parts.map((p, i) => p.startsWith("@") ? <InlineMention key={i}>{p.slice(1)}</InlineMention> : <span key={i}>{p}</span>);
}

function MockMessage({ msg, lang }: { msg: ProductMockMessage; lang: ProductMockLang }) {
  const labels = LABELS[lang];
  if (msg.role === "system") return <div className="lp-real-system">{msg.text}</div>;
  return (
    <div className="lp-real-msg">
      <Avatar seed={nameSeed(msg.who)} url={`dicebear:${nameSeed(msg.who)}`} size={34} />
      <div className="lp-real-msg__body">
        <div className="lp-real-msg__head">
          <strong>{msg.who}</strong>
          <span>{labels.role[msg.role]}</span>
          {msg.meta ? <time>{msg.meta}</time> : null}
        </div>
        <p>{renderText(msg.text)}</p>
      </div>
    </div>
  );
}

export function ProductMock({ item, threadOpen = true, onToggleThread, compact = false, lang }: {
  item?: ProductMockCase;
  threadOpen?: boolean;
  onToggleThread?: () => void;
  compact?: boolean;
  lang?: ProductMockLang;
}) {
  const activeLang = lang ?? browserLang();
  const labels = LABELS[activeLang];
  const activeItem = item ?? HERO_CASES[activeLang];
  const homeChannelActive = activeItem.channel === "all";

  return (
    <div className={"lp-product-shell" + (compact ? " is-compact" : "")}>
      <div className="lp-product-bar">
        <span className="lp-browser__dot lp-browser__dot--r" />
        <span className="lp-browser__dot lp-browser__dot--y" />
        <span className="lp-browser__dot lp-browser__dot--g" />
        <span className="lp-product-url">localhost:7777/s/Workora/channel</span>
      </div>
      <div className="lp-product-app">
        <aside className="lp-product-rail" aria-hidden="true">
          <span className="lp-product-brand">F</span>
          <Search size={18} />
          <Inbox size={18} />
          <MessageSquare className="is-active" size={18} />
          <ListChecks size={18} />
          <UsersRound size={18} />
          <Monitor size={18} />
          <span className="lp-product-spacer" />
          <Settings size={18} />
        </aside>

        <aside className="lp-product-sidebar" aria-hidden="true">
          <div className="lp-product-side-title">{labels.conversation}</div>
          <div className="lp-product-side-item"><Bookmark size={14} />{labels.saved}</div>
          <div className="lp-product-side-section">{labels.showcaseSection}</div>
          <div className="lp-product-side-item"><MessageCircle size={14} />{labels.showcase}</div>
          <div className="lp-product-side-section">{labels.channels} <span>+</span></div>
          <div className={"lp-product-side-item" + (homeChannelActive ? " is-active" : "")}><Hash size={15} />all</div>
          {!homeChannelActive ? <div className="lp-product-side-item is-active"><Hash size={15} />{activeItem.channel}</div> : null}
          <div className="lp-product-side-section">{labels.directMessages} <span>+</span></div>
          <div className="lp-product-dm"><Avatar seed="codex" url="dicebear:codex" size={20} />codex <i /></div>
          <div className="lp-product-dm"><Avatar seed="cctest" url="dicebear:cctest" size={20} />cctest <i /></div>
          <div className="lp-product-running">{labels.noAgentsRunning}</div>
        </aside>

        <main className="lp-product-chat">
          <header className="lp-product-chat-head">
            <div className="lp-product-channel-title"><Hash size={18} />{activeItem.channel}</div>
            <span>{activeItem.channelDescription || labels.defaultDescription}</span>
            <nav>
              <b>{labels.tabs[0]}</b><span>{labels.tabs[1]}</span><span>{labels.tabs[2]}</span>
            </nav>
            <button>{labels.members}</button>
            <button><MoreHorizontal size={16} /></button>
          </header>
          <div className="lp-product-messages">
            {activeItem.messages.map((m, i) => <MockMessage key={`${activeItem.id}-m-${i}`} msg={m} lang={activeLang} />)}
            <div className="lp-product-taskline">
              <span className="lp-real-task-pill">{activeItem.task.id} {activeItem.task.status} @{activeItem.task.owner}</span>
              <button className="thread-pill lp-product-thread-pill" onClick={onToggleThread} aria-expanded={threadOpen}>
                <MessageCircle size={12} /> {labels.replies(activeItem.threadCount)}
              </button>
            </div>
            <div className="lp-real-system">{labels.taskCreated(activeItem.task.id, activeItem.task.title)}</div>
            <div className="lp-real-system">{labels.taskClaimed(activeItem.task.owner, activeItem.task.id, activeItem.task.title)}</div>
          </div>
          <div className="lp-product-composer" aria-hidden="true">
            <span>{labels.composer}</span>
            <div><ImageIcon size={15} /><Paperclip size={15} /><label><i /> {labels.asTask}</label><button><Send size={15} /></button></div>
          </div>
        </main>

        <aside className="lp-product-profile">
          <div className="lp-product-profile-head">
            <Avatar seed="codex" url="dicebear:codex" size={40} />
            <div><strong>codex</strong><span>@codex</span></div>
            <button><X size={14} /></button>
          </div>
          <div className="lp-product-profile-actions">
            <button><MessageCircle size={13} /> {labels.dm}</button><button><Play size={13} /> {labels.start}</button><button><RotateCcw size={13} /> {labels.restart}</button><button className="danger"><Trash2 size={13} /> {labels.delete}</button>
          </div>
          <div className="lp-product-tabs"><b>{labels.profileTabs[0]}</b><span>{labels.profileTabs[1]}</span><span>{labels.profileTabs[2]}</span><span>{labels.profileTabs[3]}</span><span>{labels.profileTabs[4]}</span><span>{labels.profileTabs[5]}</span></div>
          <div className="lp-product-profile-card">
            <dl>
              <dt>{labels.runtime}</dt><dd>codex</dd>
              <dt>{labels.model}</dt><dd>gpt-5.5</dd>
              <dt>{labels.status}</dt><dd><i /> sleeping</dd>
              <dt>{labels.workspace}</dt><dd>~/.Workora/agents/codex</dd>
            </dl>
          </div>
          <div className="lp-product-skill"><strong>develop · global</strong><span>Use when a human hands you a development task...</span></div>
          <div className="lp-product-skill"><strong>brainstorming · global</strong><span>MUST use before creating features or modifying behavior.</span></div>
        </aside>

        <aside className={"lp-product-thread" + (threadOpen ? " is-open" : "")}>
          <div className="lp-product-thread-head"><strong>{labels.taskThread}</strong><span>{activeItem.task.id} · {labels.replies(activeItem.threadCount)}</span></div>
          {activeItem.thread.map((m, i) => <MockMessage key={`${activeItem.id}-t-${i}`} msg={m} lang={activeLang} />)}
          <div className="lp-product-thread-done"><CheckCircle2 size={14} /> {labels.evidenceReturned}</div>
        </aside>
      </div>
    </div>
  );
}
