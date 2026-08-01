// Shared project-roots resolution for gitOps. Reads OPEN_WORKORA_PROJECT_ROOTS the same way
// projectDirectory.ts does (JSON array or PATH-delimited list of absolute dirs). The daemon
// wrapper sets this; git clones land in the first root. Empty → default to $HOME/projects.
import path from "node:path";

function parseRoots(raw = process.env.OPEN_WORKORA_PROJECT_ROOTS): string[] {
  const value = raw?.trim();
  if (!value) return [];
  let inputs: unknown;
  if (value.startsWith("[")) {
    try { inputs = JSON.parse(value); } catch { return []; }
    if (!Array.isArray(inputs)) return [];
    inputs = inputs.filter((item): item is string => typeof item === "string");
  } else {
    inputs = value.split(path.delimiter);
  }
  return [...new Set((inputs as string[]).map((item) => item.trim()).filter(Boolean))];
}

export const PROJECT_ROOTS: string[] = parseRoots();
