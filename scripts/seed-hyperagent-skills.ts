// Import the public Hyperagent skill library (alexmcdonnell-airtable/hyperagent-public-skills)
// plus looper-style role packs (planner/reviewer/fixer/worker) into the Workora skill
// marketplace. Run: npm run seed:hyperagent
// Safe to re-run: skips skills that already exist by name. Idempotent per workspace.
//
// Methodology: looper (nexu-io/looper) — roles loop against their own success criteria;
// hyperagent public skills — portable skill packs (identity + instructions + workflow).

import "../src/env.js";
import { db, schema, sql } from "../src/db/index.js";
import { eq } from "drizzle-orm";

const HYPE_RAW = "https://raw.githubusercontent.com/alexmcdonnell-airtable/hyperagent-public-skills/main";
const HYPE_API = "https://api.github.com/repos/alexmcdonnell-airtable/hyperagent-public-skills/git/trees/main?recursive=1";

type SkillIn = { name: string; description: string; content: string; vendor: string };

function kebab(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

async function fetchJson<T>(url: string): Promise<T> {
  const r = await fetch(url, { headers: { "user-agent": "workora-seed", accept: "application/json" } });
  if (!r.ok) throw new Error(`fetch ${url} -> ${r.status}`);
  return r.json() as Promise<T>;
}

async function listHyperagentFiles(): Promise<string[]> {
  const tree = await fetchJson<{ tree: { path: string }[] }>(HYPE_API);
  return (tree.tree ?? []).map((t) => t.path).filter((p) => p.startsWith("skill-") && p.endsWith(".json"));
}

async function importHyperagentSkills(): Promise<SkillIn[]> {
  const files = await listHyperagentFiles();
  const out: SkillIn[] = [];
  for (const f of files) {
    try {
      const j = await fetchJson<any>(`${HYPE_RAW}/${f}`);
      const d = j?.data;
      if (!d?.name) continue;
      const content = d.skillMdBody || d.documentation || "";
      if (!content.trim()) continue;
      out.push({
        name: kebab(d.name),
        description: String(d.description || "").slice(0, 300),
        content: `# ${d.name}\n\n${String(d.description || "")}\n\n${content}`.slice(0, 48_000),
        vendor: "hyperagent",
      });
      console.log(`  [hyperagent] ${d.name}`);
    } catch (e) {
      console.warn(`  skip ${f}: ${(e as Error).message}`);
    }
  }
  return out;
}

// looper-style role packs: each role is a loop with its own exit criterion.
// Success criteria distilled from nexu-io/looper's four-loop model.
function looperRolePacks(): SkillIn[] {
  return [
    {
      name: "planner",
      description: "Loop until the spec is reviewable. Reads the brief, explores the repo, drafts a spec, critiques it, and revises until it is concrete enough to review.",
      content: `# planner (looper-style role)

Loop until the spec is reviewable — no fixed step count.

1. Read the brief/issue and restate the goal in one sentence.
2. Explore the repo/codebase; ground the plan in what actually exists.
3. Draft a spec: goal, non-goals, edge cases, verification method, file/area map.
4. Critique your own draft; revise until it is concrete enough to review.
5. Stop when the spec is reviewable (a reviewer could act on it without asking questions).

Exit condition: the spec is posted/reviewable. Do NOT start implementing.`,
      vendor: "looper",
    },
    {
      name: "reviewer",
      description: "Loop until the work meets the bar. Re-read the work on every change, post findings, and keep reviewing until no actionable threads remain.",
      content: `# reviewer (looper-style role)

Loop until the work meets the bar — the implementer must not grade its own homework.

1. Read the work (diff, task, deliverable) freshly, not from memory.
2. Check it against the spec/acceptance criteria; list actionable findings.
3. Post findings; wait for the implementer's next pass.
4. Re-review on every change. Stop when no actionable threads remain.

Exit condition: a clean review — every actionable thread resolved or explicitly deferred with reason.`,
      vendor: "looper",
    },
    {
      name: "fixer",
      description: "Loop until reviewer threads are handled. Pull open findings, address them, and wait for the reviewer's next pass. Ping-pong until the work converges.",
      content: `# fixer (looper-style role)

Loop until every reviewer thread is handled.

1. Pull the open review findings.
2. Address each in the worktree/workspace; do not fix unrelated things.
3. Re-run checks; push the updated work.
4. Wait for the reviewer's next pass. Reply when human input is needed.

Exit condition: every actionable thread resolved or replied to (with a reason when it needs a human).`,
      vendor: "looper",
    },
    {
      name: "worker",
      description: "Loop until the work is ready to ship. Implements the spec, runs checks, and iterates on its own output until it is ready for human review and merge.",
      content: `# worker (looper-style role)

Loop until the work is ready for human review/merge.

1. Take the approved spec and implement it.
2. Run the checks (tests, typecheck, build) after each meaningful change.
3. Iterate on your own output against the acceptance criteria.
4. Do not mark done until a verifier (reviewer skill, tests, or human) passes.

Exit condition: checks pass and the work is ready for review — not "looks done".`,
      vendor: "looper",
    },
  ];
}

async function main() {
  const [server] = await db.select().from(schema.servers).limit(1);
  if (!server) {
    console.error("[seed:hyperagent] no workspace — run `npm run seed` first");
    await sql.end();
    process.exit(1);
  }

  const packs: SkillIn[] = [...looperRolePacks()];
  try {
    packs.push(...(await importHyperagentSkills()));
  } catch (e) {
    console.warn(`[seed:hyperagent] could not reach GitHub (${(e as Error).message}); importing role packs only`);
  }

  const existing = await db.select({ name: schema.skills.name }).from(schema.skills).where(eq(schema.skills.serverId, server!.id));
  const have = new Set(existing.map((r) => r.name));
  const createdBy = (await db.select().from(schema.users).limit(1))[0];
  if (!createdBy) {
    console.error("[seed:hyperagent] no user found — run `npm run seed` first");
    await sql.end();
    process.exit(1);
  }

  let created = 0;
  for (const p of packs) {
    if (have.has(p.name)) continue;
    await db.insert(schema.skills).values({
      serverId: server!.id,
      createdByUserId: createdBy.id,
      name: p.name,
      description: p.description,
      content: p.content,
      vendor: p.vendor,
    }).onConflictDoNothing();
    created++;
  }

  console.log(`[seed:hyperagent] done — ${created} new skills (${packs.length - created} already present)`);
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
