// Thin API layer over the existing Workora backend.
//
// Auth model (reuses the existing web app's session): the JWT lives in
// localStorage under "Workora.token". The workspace id is NOT persisted by the
// main app (it is React state), so we bootstrap it here once: GET /api/servers
// with the token, pick the workspace, and remember it for x-server-id.
// All requests are same-origin /api/* — in dev and on Dokploy a Next rewrite
// proxies them to the real backend (see next.config.mjs).

import type { ServerInfo } from "./types";

export const TOKEN_KEY = "Workora.token";
export const SID_KEY = "Workora.ccServerId";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

let sidPromise: Promise<string> | null = null;

// Resolve the active workspace id. Memoized per session; persisted so reloads
// don't re-fetch. Throws ApiError(401) when the token is invalid/expired.
export async function ensureServerId(): Promise<string> {
  const token = getToken();
  if (!token) throw new ApiError(401, "no token");
  const existing = localStorage.getItem(SID_KEY);
  if (existing) return existing;
  if (!sidPromise) {
    sidPromise = (async () => {
      const res = await fetch("/api/servers", {
        headers: { authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new ApiError(res.status, `servers: ${res.status}`);
      const list = (await res.json()) as ServerInfo[];
      const pick = Array.isArray(list) && list.length ? list[0] : null;
      if (!pick?.id) throw new ApiError(404, "no workspace");
      localStorage.setItem(SID_KEY, pick.id);
      return pick.id;
    })().catch((e) => {
      sidPromise = null; // allow retry on transient failure
      throw e;
    });
  }
  return sidPromise;
}

export async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const sid = await ensureServerId();
  const res = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
      "x-server-id": sid,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let msg = `${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) msg = String(body.error);
    } catch {
      /* keep status-only message */
    }
    throw new ApiError(res.status, msg);
  }
  return res.json() as Promise<T>;
}

// Avatar URLs are token-signed (same convention as the main app).
export function signedAvatar(url?: string | null): string | null {
  if (!url) return null;
  const token = getToken();
  if (!token) return url;
  return `${url}${url.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`;
}

const RUNTIME_GLYPH: Record<string, string> = {
  claude: "✦",
  codex: "◈",
  opencode: "◇",
  hermes: "✧",
  copilot: "❖",
  gemini: "✳",
};
export function runtimeGlyph(runtime: string): string {
  return RUNTIME_GLYPH[runtime] || "✦";
}

// Server activity/status → dot color (🟢 working / 🟡 thinking / 🔴 offline / ⚪ sleeping)
export type Dot = "working" | "thinking" | "offline" | "sleeping";
export function dotFor(a: { status: string; activity?: string | null }): Dot {
  if (a.status === "active") {
    if (a.activity === "thinking") return "thinking";
    return "working";
  }
  if (a.status === "sleeping" || a.activity === "sleeping") return "sleeping";
  return "offline";
}

export function dotLabel(d: Dot): string {
  return d === "working" ? "Working" : d === "thinking" ? "Thinking" : d === "sleeping" ? "Sleeping" : "Offline";
}

export function relTime(ts: number): string {
  if (!ts) return "";
  const diff = Math.max(0, Date.now() - ts);
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function timeAgo(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
