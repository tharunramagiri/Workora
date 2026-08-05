// Unit tests for the feed diff/merge logic. Run with: npm test
import { strict as assert } from "node:assert";
import test from "node:test";
import { statusEntries, taskEntries, activityEntries, mergeFeed } from "../lib/feed";
import type { Agent, Task } from "../lib/types";

const A = (id: string, status = "active", activity = "working"): Agent => ({
  id, name: `a${id}`, displayName: `Agent ${id}`, status, activity, runtime: "claude",
});

test("statusEntries emits only real changes", () => {
  const prev = [A("1"), A("2")];
  const next = [A("1"), { ...A("2"), activity: "thinking" }];
  const out = statusEntries(prev, next, 1000);
  assert.equal(out.length, 1);
  assert.equal(out[0]!.agentId, "2");
  assert.equal(out[0]!.dot, "thinking");
  assert.match(out[0]!.title, /Thinking/);
});

test("statusEntries ignores unchanged snapshots", () => {
  assert.equal(statusEntries([A("1")], [A("1")], 1000).length, 0);
});

const T = (id: string, status: string, assignee?: string): Task => ({
  id, taskStatus: status, taskNumber: 7, taskAssigneeId: assignee ?? null, content: "ship it",
});

test("taskEntries emits status and assignee moves", () => {
  const prev = [T("t1", "todo")];
  const next = [T("t1", "in_progress", "a1")];
  const out = taskEntries(prev, next, (t) => (t.taskAssigneeId === "a1" ? "Alice" : "someone"), 2000);
  assert.equal(out.length, 1);
  assert.match(out[0]!.title, /#7/);
  assert.match(out[0]!.title, /by Alice/);
});

test("activityEntries maps kinds to titles", () => {
  const out = activityEntries({ id: "x", name: "a", displayName: "Alice" }, [
    { timestamp: 100, entry: { kind: "tool_start", toolName: "git:diff", text: "changed 3 files" } },
    { timestamp: 200, entry: { kind: "thinking", activity: "thinking", text: "considering" } },
  ]);
  assert.equal(out.length, 2);
  assert.match(out[1]!.title, /thinking/);
  assert.equal(out[0]!.detail, "changed 3 files");
});

test("mergeFeed sorts newest first and caps", () => {
  const e = (ts: number) => ({ id: String(ts), ts, kind: "activity" as const, title: String(ts) });
  const out = mergeFeed([e(1), e(5), e(3), e(4), e(2)], 3);
  assert.deepEqual(out.map((x) => x.ts), [5, 4, 3]);
});
