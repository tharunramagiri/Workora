// Git operations for imported projects (Phase 1 of "paste a repo, get a coding agent").
// Runs on the daemon host (the machine that owns the clone) via `git` subprocesses, and is
// driven from the server over the existing WS-RPC channel (see src/server/routes-api/projects.ts).
// Bounded, fail-closed: every op validates the repo path stays inside the configured projects root
// (OPEN_WORKORA_PROJECT_ROOTS) so a caller can never point git at an arbitrary directory.
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { PROJECT_ROOTS } from "./gitRoots.js";

const exec = promisify(execFile);
const GIT = "git";

export type GitOpResult =
  | { ok: true; [k: string]: unknown }
  | { ok: false; error: string; code?: string };

function errMsg(e: unknown): string {
  if (e && typeof e === "object" && "stderr" in e) return String((e as any).stderr || (e as any).message || e);
  return String(e instanceof Error ? e.message : e);
}

/** Git URL → display name + local clone dir name. `https://github.com/a/b` or `git@github.com:a/b` → "a-b". */
export function repoNameFromUrl(url: string): string {
  const clean = url
    .replace(/^git@[^:]+:/, "")       // git@github.com:owner/repo → owner/repo
    .replace(/^https?:\/\//, "")       // https://github.com/owner/repo → github.com/owner/repo
    .replace(/\.git$/, "")
    .split("/")
    .filter(Boolean);
  const owner = clean[clean.length - 2] ?? "repo";
  const repo = clean[clean.length - 1] ?? "repo";
  return `${owner}-${repo}`.replace(/[^A-Za-z0-9_.-]/g, "-");
}

/** Resolve the projects root for a machine (first configured root, else $HOME/projects). */
export async function projectsRoot(): Promise<string> {
  if (PROJECT_ROOTS.length > 0) return PROJECT_ROOTS[0]!;
  return path.join(os.homedir(), "projects");
}

/** Validate that `clonePath` is inside one of the configured project roots. */
export function assertInsideRoots(clonePath: string): void {
  const resolved = path.resolve(clonePath);
  const roots = PROJECT_ROOTS.length > 0 ? PROJECT_ROOTS.map((r) => path.resolve(r)) : [path.resolve(path.join(os.homedir(), "projects"))];
  const ok = roots.some((root) => resolved === root || resolved.startsWith(root + path.sep));
  if (!ok) throw new Error(`clone path ${clonePath} is outside the configured project roots (${roots.join(", ")})`);
}

export interface CloneInput { repoUrl: string; branch?: string; path?: string; shallow?: boolean }

/**
 * Clone a repo into the projects root. Uses --filter=blob:none (blobless clone) for fast
 * initial clone; blobs are fetched on demand, so a deep history is cheap to start with.
 * Returns the absolute clone path + the default branch.
 */
export async function cloneRepo({ repoUrl, branch, path: pathHint, shallow }: CloneInput): Promise<GitOpResult> {
  try {
    const root = await projectsRoot();
    await fs.mkdir(root, { recursive: true });
    const name = pathHint || repoNameFromUrl(repoUrl);
    const dest = path.join(root, name);
    assertInsideRoots(dest);
    if (await fs.stat(dest).then(() => true).catch(() => false)) {
      // Already cloned: fetch latest instead of failing.
      const cur = await git(dest, ["fetch", "--all", "--prune"]);
      const short = await git(dest, ["rev-parse", "--short", "HEAD"]);
      return { ok: true, clonePath: dest, defaultBranch: branch || "main", reusing: true, fetch: cur, commit: short.trim() };
    }
    const args = ["clone"];
    if (shallow !== false) args.push("--filter=blob:none");
    args.push(repoUrl, dest);
    const out = await exec(GIT, args, { timeout: 120_000 });
    const defaultBranch = branch || (await git(dest, ["symbolic-ref", "--short", "HEAD"]).then((b) => b.trim()).catch(() => "main"));
    const short = await git(dest, ["rev-parse", "--short", "HEAD"]).then((b) => b.trim()).catch(() => "");
    return { ok: true, clonePath: dest, defaultBranch, commit: short, output: out.stdout.slice(-500) };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}

/** Status of a cloned repo: current branch, short HEAD, dirty files, ahead/behind. */
export async function repoStatus(clonePath: string): Promise<GitOpResult> {
  try {
    assertInsideRoots(clonePath);
    const branch = await git(clonePath, ["rev-parse", "--abbrev-ref", "HEAD"]).then((b) => b.trim());
    const commit = await git(clonePath, ["rev-parse", "--short", "HEAD"]).then((b) => b.trim());
    const dirty = await git(clonePath, ["status", "--porcelain"]).then((s) => s.split("\n").filter(Boolean).length).catch(() => 0);
    return { ok: true, branch, commit, dirty };
  } catch (e) {
    return { ok: false, error: errMsg(e), code: "git_status_failed" };
  }
}

/** Pull the latest from upstream (fetch + merge --ff-only). */
export async function pullRepo(clonePath: string, branch?: string): Promise<GitOpResult> {
  try {
    assertInsideRoots(clonePath);
    const out = await git(clonePath, ["pull", "--ff-only", "origin", branch || "HEAD"]);
    const commit = await git(clonePath, ["rev-parse", "--short", "HEAD"]).then((b) => b.trim());
    return { ok: true, commit, output: out.slice(-300) };
  } catch (e) {
    return { ok: false, error: errMsg(e), code: "git_pull_failed" };
  }
}

/**
 * Commit all changes on a feature branch and push it to the remote.
 * This is the "agent ships a PR" primitive: work on branch `workora/<task>/<agent>`,
 * commit + push, and report the branch name back so the UI shows a ready-to-review PR.
 */
export async function commitAndPush(clonePath: string, branch: string, message: string, author?: string): Promise<GitOpResult> {
  try {
    assertInsideRoots(clonePath);
    // Create/checkout the feature branch (idempotent).
    await git(clonePath, ["checkout", "-B", branch]);
    await git(clonePath, ["add", "-A"]);
    const authorArg = author ? ["--author", author] : [];
    await git(clonePath, ["commit", ...authorArg, "-m", message]);
    const out = await git(clonePath, ["push", "-u", "origin", branch]);
    const commit = await git(clonePath, ["rev-parse", "--short", "HEAD"]).then((b) => b.trim());
    return { ok: true, commit, branch, output: out.slice(-300) };
  } catch (e) {
    // Nothing to commit is not an error for our callers (agent did no work) — surface as ok:false with a clear message.
    return { ok: false, error: errMsg(e), code: "git_push_failed" };
  }
}

async function git(cwd: string, args: string[]): Promise<string> {
  const r = await exec(GIT, args, { cwd, timeout: 60_000, maxBuffer: 4 * 1024 * 1024 });
  return r.stdout;
}

export async function ensureProjectsRootDir(): Promise<string> {
  const root = await projectsRoot();
  await fs.mkdir(root, { recursive: true });
  return root;
}
