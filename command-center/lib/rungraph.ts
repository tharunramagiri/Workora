// Run-map: turn a flat activity log into a control-flow graph (graph-engineering).
// Groups consecutive same-kind entries into nodes; repeated kinds become retry
// loops. Pure logic, unit-tested in test/rungraph.test.ts.

import type { ActivityItem } from "./types";

export type RunNode = {
  id: string;
  kind: string;
  icon: string;
  label: string;
  retries: number; // extra occurrences of this kind folded into this node
};

export type RunMap = {
  nodes: RunNode[];
  total: number;
  retries: number;
};

export function runIcon(kind: string, toolName?: string | null): string {
  if (kind === "tool_start") return toolName === "git:diff" ? "🔀" : "🛠";
  if (kind === "thinking") return "💭";
  if (kind === "working") return "⚡";
  if (kind === "task") return "📋";
  if (kind === "deliverable") return "📦";
  return "•";
}

export function runLabel(kind: string, toolName?: string | null, activity?: string | null): string {
  if (kind === "tool_start") return toolName || "tool";
  return activity || kind || "activity";
}

export function runMap(items: ActivityItem[]): RunMap {
  const nodes: RunNode[] = [];
  for (const it of items) {
    const kind = it.entry?.kind || "activity";
    const label = runLabel(kind, it.entry?.toolName, it.entry?.activity);
    const icon = runIcon(kind, it.entry?.toolName);
    const last = nodes[nodes.length - 1];
    if (last && last.kind === kind) {
      last.retries += 1;
    } else {
      nodes.push({ id: `${kind}:${nodes.length}:${it.timestamp}`, kind, icon, label, retries: 0 });
    }
  }
  return {
    nodes,
    total: items.length,
    retries: nodes.reduce((sum, n) => sum + n.retries, 0),
  };
}
