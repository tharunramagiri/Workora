// Pure helpers for the agent workspace MEMORY.md.
// Kept side-effect free so the section-surgery logic is unit-testable without touching disk.

/** The initial MEMORY.md seeded on an agent's first start. Title = displayName, `## Role` = description. */
export function seedMemory(displayName: string, description?: string | null): string {
  return `# ${displayName}\n\n## Role\n${ROLE_START}\n${roleBody(description)}\n${ROLE_END}\n\n## Key Knowledge\n- None yet\n\n## Active Context\n- First startup\n`;
}

/**
 * The default "soul" (personality.md) seeded on first start when the operator hasn't
 * uploaded one (memmy/qm-inspired: agents start with an identity, not a blank file).
 * The prompt wires personality.md as the effective role; this template gives the agent
 * voice + values + boundaries so the human edits rather than invents from scratch.
 */
export function seedPersonality(displayName: string, role?: string | null): string {
  return `# ${displayName} — soul\n\n## Who I am\n${role?.trim() || "A Workora teammate: persistent, self-hosted, and accountable for results. I collaborate with humans and other agents in channels, threads, and DMs."}\n\n## Voice\n- Direct and concise. Report outcomes, not intentions.\n- Ask for clarification when a task is ambiguous instead of guessing.\n- Explain the reasoning behind non-obvious decisions.\n\n## Values\n- Ship real, verifiable work over plausible-sounding answers.\n- Keep the human in control: prepare actions, never silently execute privileged ones.\n- Preserve durable knowledge for the team (write to the knowledge base + MEMORY.md).\n\n## Boundaries\n- I never commit secrets, credentials, or personal data.\n- I never overwrite project instruction files (AGENTS.md etc.) with Workora identity.\n- I ask before destructive or irreversible operations.\n\n## Work style\n- Read memory + knowledge base before starting a task.\n- Keep MEMORY.md current as a self-sufficient index; put details in notes/.\n- Before stopping, persist anything durable I learned.\n`;
}

/** Normalize a profile description into the body written under `## Role` (mirrors the seed's `|| "Undefined"`). */
function roleBody(description?: string | null): string {
  return (description ?? "").trim() || "Undefined";
}

// Invisible HTML-comment markers that bookend the `## Role` section body so
// re-sync can precisely locate the block without relying on heading scanning
// (personality.md may contain its own `##` sub-headings).
const ROLE_START = "<!-- role:start -->";
const ROLE_END = "<!-- role:end -->";

/**
 * Surgically sync an existing MEMORY.md to a changed profile (admin-wins): rewrite the first H1
 * title to `displayName` and replace the `## Role` section body with `description`, while preserving
 * every other section (## Key Knowledge / ## Active Context / anything the agent wrote).
 * Returns the original string unchanged when nothing needs to change.
 */
export function applyProfileToMemory(content: string, displayName: string, description?: string | null): string {
  const role = roleBody(description);
  const lines = content.split("\n");

  // 1) Title: replace the first H1 (`# ...`) with the current display name.
  const h1 = lines.findIndex((l) => /^#\s+/.test(l));
  if (h1 === -1) {
    // Malformed (no H1) — prepend a fresh header, keep the rest of the doc as-is.
    return `# ${displayName}\n\n## Role\n${ROLE_START}\n${role}\n${ROLE_END}\n\n${content}`;
  }
  lines[h1] = `# ${displayName}`;

  // 2) Role: replace the `## Role` section body, from the heading up to the next `## ` heading (or EOF).
  const roleIdx = lines.findIndex((l, i) => i > h1 && /^##\s+Role\s*$/i.test(l));
  if (roleIdx === -1) {
    // Agent removed/renamed the Role heading — reinstate it right under the title.
    const head = lines.slice(0, h1 + 1);                  // up to & including the (rewritten) H1
    const restStart = lines[h1 + 1] === "" ? h1 + 2 : h1 + 1; // drop one existing blank to avoid doubling
    return [...head, "", "## Role", ROLE_START, role, ROLE_END, "", ...lines.slice(restStart)].join("\n");
  }

  // Try marker-based replacement first (precise, immune to embedded ## headings).
  const startMarker = lines.indexOf(ROLE_START, roleIdx + 1);
  const endMarker = lines.indexOf(ROLE_END, startMarker + 1);
  if (startMarker !== -1 && endMarker !== -1) {
    const head = lines.slice(0, startMarker);
    const tail = lines.slice(endMarker + 1);
    const joined = [...head, ROLE_START, role, ROLE_END, ...tail].join("\n");
    return joined === content ? content : joined;
  }

  // Fallback: heading-based scan (legacy MEMORY.md without markers).
  let next = lines.length;
  for (let i = roleIdx + 1; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i]!)) { next = i; break; }
  }
  const head = lines.slice(0, roleIdx + 1);          // up to and including `## Role`
  const tail = lines.slice(next);                     // the next `## ` section onward (or nothing)
  const body = tail.length ? [ROLE_START, role, ROLE_END, ""] : [ROLE_START, role, ROLE_END];
  return [...head, ...body, ...tail].join("\n");
}
