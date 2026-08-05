// Pure helpers for the activity feed: diff agent/task snapshots into feed
// entries and merge them with per-agent activity logs. Kept framework-free so
// it can be unit-tested (see feed.test.ts).

import type { ActivityItem, Agent, Task } from "./types";
import { dotFor, dotLabel, type Dot } from "./api";

export type FeedEntry = {
  id: string;
  ts: number;
  kind: "activity" | "status" | "task";
  agentId?: string;
  agentName?: string;
  dot?: Dot;
  icon?: string; // overrides the kind-based icon (e.g. activity subtypes)
  title: string;
  detail?: string;
};

export function statusEntries(
  prev: Agent[],
  next: Agent[],
  now: number,
): FeedEntry[] {
  const byId = new Map(prev.map((a) => [a.id, a]));
  const out: FeedEntry[] = [];
  for (const a of next) {
    const p = byId.get(a.id);
    const nextDot = dotFor(a);
    if (!p || dotFor(p) !== nextDot || p.status !== a.status) {
      out.push({
        id: `${a.id}:status:${now}:${out.length}`,
        ts: now,
        kind: "status",
        agentId: a.id,
        agentName: a.displayName || a.name,
        dot: nextDot,
        title: `→ ${dotLabel(nextDot)}`,
        detail: a.status === "active" && a.activity ? a.activity : a.status,
      });
    }
  }
  return out;
}

export function taskEntries(
  prev: Task[],
  next: Task[],
  resolveName: (t: Task) => string,
  now: number,
): FeedEntry[] {
  const byId = new Map(prev.map((t) => [t.id, t]));
  const out: FeedEntry[] = [];
  for (const t of next) {
    const p = byId.get(t.id);
    if (!p) continue;
    const stChanged = p.taskStatus !== t.taskStatus;
    const ownerChanged = p.taskAssigneeId !== t.taskAssigneeId;
    if (!stChanged && !ownerChanged) continue;
    const who = ownerChanged && t.taskAssigneeId ? ` by ${resolveName(t)}` : "";
    const title = t.taskNumber
      ? `Task #${t.taskNumber} ${t.taskStatus ?? "updated"}${who}`
      : `Task updated${who}`;
    out.push({
      id: `${t.id}:task:${now}:${out.length}`,
      ts: now,
      kind: "task",
      title,
      detail: t.content ? t.content.slice(0, 120) : undefined,
    });
  }
  return out;
}

export function activityEntries(
  agent: { id: string; displayName: string; name: string },
  items: ActivityItem[],
): FeedEntry[] {
  const out: FeedEntry[] = [];
  for (const it of items) {
    const k = it.entry?.kind || "";
    const tool = it.entry?.toolName;
    const title =
      k === "tool_start"
        ? `ran ${tool || "a tool"}`
        : k === "thinking"
          ? "thinking"
          : k === "working"
            ? "working"
            : k === "task"
              ? "on a task"
              : (it.entry?.activity || k || "activity");
    const icon =
      k === "tool_start" ? (tool === "git:diff" ? "🔀" : "🛠")
        : k === "thinking" ? "💭"
          : k === "working" ? "⚡"
            : k === "deliverable" ? "📦"
              : "•";
    out.push({
      id: `${agent.id}:act:${it.timestamp}:${out.length}`,
      ts: it.timestamp * 1000,
      kind: "activity",
      agentId: agent.id,
      agentName: agent.displayName || agent.name,
      icon,
      title: title.replace(/^_/, ""),
      detail: it.entry?.text ?? it.entry?.detail ?? tool ?? undefined,
    });
  }
  return out;
}

export function mergeFeed(
  entries: FeedEntry[],
  cap = 50,
): FeedEntry[] {
  return [...entries].sort((a, b) => b.ts - a.ts).slice(0, cap);
}
