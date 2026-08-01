// Initial bootstrap data: one human (you) + the Workora workspace + #all channel.
// Machines and agents are created explicitly through onboarding, never as production fixtures.
import "../env.js"; // must be first: loads .env / ENV_FILE (.env.prod) → DATABASE_URL, before the db connection (required when running seed standalone)
import { db, schema, sql } from "./index.js";
import { eq } from "drizzle-orm";

async function main() {
  const { users, servers, serverMembers, channels, channelMembers } = schema;

  // Idempotent, with a one-time migration for installs created before the default slug was renamed.
  const legacy = await db.select().from(servers).where(eq(servers.slug, "demo"));
  if (legacy.length) {
    await db.update(servers).set({ slug: "Workora", name: "Workora" }).where(eq(servers.id, legacy[0]!.id));
    console.log("[seed] migrated workspace slug demo -> Workora");
    await sql.end();
    return;
  }

  // Skip whenever ANY workspace exists — not just slug "Workora" — so slug renames
  // (e.g. Workora -> Workora) can never break bootstrap idempotency.
  const existing = await db.select({ id: servers.id }).from(servers).limit(1);
  if (existing.length) {
    console.log("[seed] workspace already exists, nothing to do");
    await sql.end();
    return;
  }

  const [you] = await db.insert(users).values({
    name: "you", displayName: "You", email: "you@Workora.local",
  }).returning();

  const [server] = await db.insert(servers).values({
    name: "Workora", slug: "Workora", ownerId: you!.id, plan: "free",
  }).returning();

  await db.insert(serverMembers).values({ serverId: server!.id, userId: you!.id, role: "owner" });

  const [all] = await db.insert(channels).values({
    serverId: server!.id, name: "all", description: "Channel for all members", type: "channel",
  }).returning();

  await db.insert(channelMembers).values({
    channelId: all!.id, memberType: "user", memberId: you!.id,
  });

  console.log("[seed] done:");
  console.log("  server:", server!.id, "(slug=Workora)");
  console.log("  user  :", you!.id, "(you)");
  console.log("  channel #all:", all!.id);
  await sql.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
