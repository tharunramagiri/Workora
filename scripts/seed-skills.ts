// Seed curated process skill packs into the marketplace (mattpocock/agent-rules-books-inspired).
// Run: npm run seed:skills
// Safe to re-run: skips skills that already exist by name. Idempotent per workspace.
import "../src/env.js"; // loads .env / ENV_FILE → DATABASE_URL before the db connection
import { db, schema, sql } from "../src/db/index.js";
import { and, eq } from "drizzle-orm";

// MIT-licensed process skills distilled from the referenced repos' public skill files
// (mattpocock/skills chain: spec → tickets → implement → review; plus handoff and triage).
const PACK: { name: string; description: string; content: string }[] = [
  {
    name: "spec",
    description: "Turn a request into a concrete spec: goal, non-goals, edge cases, verification. Feeds /tickets and /implement.",
    content: `# spec

Turn a request into a short, verifiable spec before implementation.

1. Restate the goal in one sentence. Push back if it is vague.
2. List non-goals (what you are deliberately NOT doing).
3. Enumerate edge cases and failure modes.
4. Define how this will be verified (tests, manual check, output shape).
5. Write the spec into the thread/notes so the next step consumes it.

Do not start implementing until the spec has a stated verification method.`,
  },
  {
    name: "tickets",
    description: "Break a spec into small, tracer-bullet implementation issues with acceptance criteria.",
    content: `# tickets

Break a spec into small implementation units.

1. Split work so each ticket is independently shippable where possible.
2. Each ticket: title, context, acceptance criteria (verifiable), and a suggested file/area.
3. Order tickets so each builds on the previous.
4. Post tickets as tasks in the channel/thread.

Keep tickets small enough that one can be finished in a single focused turn.`,
  },
  {
    name: "implement",
    description: "Implement a ticket end to end: read context, make the change, run the verification, report evidence.",
    content: `# implement

Implement one ticket end to end.

1. Read memory + knowledge base + the ticket.
2. Read the relevant code/context before editing.
3. Make the smallest change that satisfies the acceptance criteria.
4. Run the stated verification (tests / lint / build) and capture output.
5. Report: what changed, verification output, anything deferred.

Never claim done without running the verification.`,
  },
  {
    name: "tdd",
    description: "Implement one behavior at a time: failing test first, then the change, then the passing test.",
    content: `# tdd

Implement one behavior at a time.

1. Write a failing test for the next behavior.
2. Run it to confirm it fails for the right reason.
3. Implement the minimal change to make it pass.
4. Run the test again to confirm green.
5. Refactor while keeping green.

Never batch multiple behaviors into one red-green cycle.`,
  },
  {
    name: "review",
    description: "Adversarial review of a diff: correctness, security, edge cases, and test coverage — before merge.",
    content: `# review

Review a diff adversarially before it ships.

1. Read the diff in full, not just the summary.
2. Check: correctness, edge cases, security (untrusted input, secrets, privilege), test coverage.
3. For each issue: severity (blocker / should-fix / nit) + concrete suggestion.
4. Confirm the verification evidence exists (tests passed, output shown).

Block merge on correctness or security issues, not on style.`,
  },
  {
    name: "handoff",
    description: "Compress your context so another agent or session can continue cleanly: state, decisions, next step.",
    content: `# handoff

Compress context so another agent or session can continue without re-deriving it.

1. Current state: what exists, what is done, what is mid-flight.
2. Decisions made and why (link evidence).
3. Open questions / blockers.
4. Next concrete step for the receiver.
5. Where the durable record lives (files, notes, knowledge base).

Write the handoff into the thread and update MEMORY.md so the next agent picks up from the record, not from chat history.`,
  },
  {
    name: "triage",
    description: "Sort incoming work by impact and effort; separate signal from noise; recommend next action.",
    content: `# triage

Sort incoming work before acting.

1. Group items by theme (bug / request / question / noise).
2. For bugs: severity + repro confidence.
3. Recommend an order: highest impact / lowest effort first, blockers above all.
4. Post the triage result with a clear recommended next action.

Do not silently ignore anything addressed to you.`,
  },
];

async function main() {
  const servers = await db.select().from(schema.servers);
  if (!servers.length) { console.log("[seed:skills] no workspace found, nothing to do"); await sql.end(); return; }
  let added = 0, skipped = 0;
  for (const server of servers) {
    for (const skill of PACK) {
      const existing = (await db.select().from(schema.skills).where(and(eq(schema.skills.serverId, server.id), eq(schema.skills.name, skill.name))))[0];
      if (existing) { skipped++; continue; }
      const [owner] = await db.select().from(schema.users).where(eq(schema.users.id, server.ownerId));
      await db.insert(schema.skills).values({
        serverId, createdByUserId: owner?.id ?? server.ownerId, name: skill.name,
        description: skill.description, content: skill.content, vendor: "workora-curated",
      });
      added++;
    }
  }
  console.log(`[seed:skills] added ${added}, skipped ${skipped} existing`);
  await sql.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
