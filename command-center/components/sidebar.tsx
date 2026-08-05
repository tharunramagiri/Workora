"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Agent } from "../lib/types";
import { dotFor } from "../lib/api";

// Hyperagent-style left sidebar: logo, primary action, collapsible nav
// sections (Agents list + Resources), user row at the bottom.
export default function Sidebar({ agents, activeLabel }: { agents: Agent[]; activeLabel?: string }) {
  const path = usePathname();
  const isActive = (href: string) => path === href;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r" style={{ borderColor: "var(--border)", background: "var(--background)" }}>
        <div className="flex h-14 shrink-0 items-center gap-2 overflow-hidden pl-[22px] pr-3">
          <Link href="/" className="flex items-center gap-2 text-logo" style={{ color: "var(--foreground)" }}>
            <Logo />
            <span>Workora</span>
          </Link>
        </div>

        <div className="mb-2 px-2">
          <Link href="/" className={`nav-item ${isActive("/") ? "active" : ""}`}>
            <Icon path="M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10" />
            Command Center
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-2">
          <div className="mb-1 flex items-center gap-1 pr-1">
            <span className="nav-section">Agents</span>
          </div>
          <div className="space-y-0.5">
            {agents.length === 0 && (
              <div className="nav-item" style={{ cursor: "default" }}>No agents yet</div>
            )}
            {agents.map((a) => (
              <Link
                key={a.id}
                href={`/agent/${a.id}`}
                className={`nav-item ${isActive(`/agent/${a.id}`) ? "active" : ""}`}
                title={a.activity || a.status}
              >
                <span className={`dot ${dotFor(a)}`} />
                <span className="truncate">{a.displayName || a.name}</span>
              </Link>
            ))}
          </div>

          <div className="mt-3 mb-1 flex items-center gap-1 pr-1">
            <span className="nav-section">Resources</span>
          </div>
          <div className="space-y-0.5">
            <a href="https://office.ramagiritharun.in" target="_blank" rel="noreferrer" className="nav-item">
              <Icon path="M12 3v18M3 12h18" />
              Open Workora ↗
            </a>
          </div>
        </nav>

        <div className="shrink-0 border-t px-3 py-3" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2.5">
            <div className="avatar" style={{ width: 28, height: 28, fontSize: 13, borderRadius: 8 }}>
              ⌘
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm" style={{ color: "var(--foreground)" }}>{activeLabel || "Command Center"}</div>
              <div className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>office.ramagiritharun.in</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden flex h-12 shrink-0 items-center justify-between gap-2 border-b px-4" style={{ borderColor: "var(--border)" }}>
        <Link href="/" className="flex items-center gap-2 text-logo" style={{ color: "var(--foreground)" }}>
          <Logo /> Workora
        </Link>
        <a href="https://office.ramagiritharun.in" target="_blank" rel="noreferrer" className="nav-item" style={{ width: "auto" }}>
          Open ↗
        </a>
      </div>
    </>
  );
}

function Logo() {
  return (
    <span className="flex items-center justify-center" style={{ width: 22, height: 22, color: "var(--tertiary)" }}>
      <svg width="20" height="20" viewBox="0 0 22 22" fill="currentColor" aria-hidden="true">
        <path d="M11 1c1.5 3 3 4.5 6 6-3 1.5-4.5 3-6 6-1.5-3-3-4.5-6-6 3-1.5 4.5-3 6-6Z" opacity="0.9" />
        <circle cx="17" cy="17" r="4" opacity="0.55" />
      </svg>
    </span>
  );
}

function Icon({ path }: { path: string }) {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center" style={{ color: "inherit" }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={path} />
      </svg>
    </span>
  );
}
