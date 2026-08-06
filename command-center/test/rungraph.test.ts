// Unit tests for the run-map (graph-engineering) logic.
import { strict as assert } from "node:assert";
import test from "node:test";
import { runMap } from "../lib/rungraph";

const item = (kind: string, toolName?: string, activity?: string) => ({
  timestamp: 1000,
  entry: { kind, toolName, activity, text: "x" },
});

test("runMap groups consecutive same-kind entries with retries", () => {
  const m = runMap([
    item("working", undefined, "working"),
    item("thinking", undefined, "thinking"),
    item("thinking", undefined, "thinking"),
    item("tool_start", "git:diff"),
    item("deliverable", undefined, "deliverable"),
  ]);
  assert.equal(m.nodes.length, 4);
  assert.equal(m.nodes[1]!.retries, 1); // second "thinking" folded in
  assert.equal(m.total, 5);
  assert.equal(m.retries, 1);
});

test("runMap separates non-consecutive same kinds", () => {
  const m = runMap([
    item("working"),
    item("thinking"),
    item("working"),
  ]);
  assert.equal(m.nodes.length, 3);
  assert.equal(m.retries, 0);
});

test("runMap icons distinguish git:diff", () => {
  const m = runMap([item("tool_start", "git:diff"), item("thinking"), item("tool_start", "Bash")]);
  assert.equal(m.nodes[0]!.icon, "🔀");
  assert.equal(m.nodes[2]!.icon, "🛠");
});

test("runMap empty input", () => {
  const m = runMap([]);
  assert.equal(m.nodes.length, 0);
  assert.equal(m.total, 0);
  assert.equal(m.retries, 0);
});
