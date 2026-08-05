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
    // pathHint may be absolute (server-computed) or a bare name; either way the result must
    // resolve inside the roots. Absolute hints are used as-is; names join onto the projects root.
    const dest = pathHint && path.isAbsolute(pathHint)
      ? path.resolve(pathHint)
      : path.join(root, pathHint || repoNameFromUrl(repoUrl));
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
 * Diff a working tree or branch against a base ref (genoffice "patch-not-rewrite" borrow:
 * show the minimal set of changes an agent made, so reviews see exactly what changed).
 *
 *   base default: diff the current branch against its merge-base with the default branch
 *   (or against the default branch if no merge-base). `--stat` returns per-file change
 *   counts; the caller can pass `patch: true` to get the full unified diff text.
 *   Uncommitted work (dirty working tree) is included via `git diff` on the worktree.
 */
export async function diffBranch(clonePath: string, base?: string, opts?: { patch?: boolean; stat?: boolean }): Promise<GitOpResult> {
  try {
    assertInsideRoots(clonePath);
    const branch = await git(clonePath, ["rev-parse", "--abbrev-ref", "HEAD"]).then((b) => b.trim());
    const baseRef = base && base.trim() ? base.trim() : "origin/main";
    // Merge-base with the base ref; fall back to the base ref itself.
    const mergeBase = await git(clonePath, ["merge-base", branch, baseRef]).then((b) => b.trim()).catch(() => "");
    const range = mergeBase ? `${mergeBase}..${branch}` : `${baseRef}...${branch}`;
    const args = ["diff", ...(opts?.patch ? [] : ["--stat"]), range, "--"];
    const out = await git(clonePath, args).catch(() => "");
    // Include uncommitted worktree changes (staged + unstaged).
    const dirty = await git(clonePath, ["diff", "HEAD", ...(opts?.patch ? [] : ["--stat"])]).catch(() => "");
    const combined = [out, dirty].filter(Boolean).join("\n");
    return { ok: true, branch, base: mergeBase || baseRef, diff: combined, patch: opts?.patch === true };
  } catch (e) {
    return { ok: false, error: errMsg(e), code: "git_diff_failed" };
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
    const msg = errMsg(e);
    // "nothing to commit" means the agent made no changes on this branch — a normal no-op, not an error.
    if (/nothing to commit|no changes added|nothing added to commit/i.test(msg)) {
      return { ok: false, error: "no changes to commit on this branch", code: "git_nothing_to_commit" };
    }
    return { ok: false, error: msg, code: "git_push_failed" };
  }
}

/** List branches (local + remote) so the UI/agent can pick a working branch. */
export async function listBranches(clonePath: string): Promise<GitOpResult> {
  try {
    assertInsideRoots(clonePath);
    await git(clonePath, ["fetch", "--all", "--prune"]).catch(() => { /* offline fetch is fine */ });
    const local = await git(clonePath, ["for-each-ref", "--format=%(refname:short)", "refs/heads"]);
    const remote = await git(clonePath, ["for-each-ref", "--format=%(refname:short)", "refs/remotes/origin"]);
    const current = await git(clonePath, ["rev-parse", "--abbrev-ref", "HEAD"]).then((b) => b.trim());
    const locals = local.split("\n").filter(Boolean);
    const remotes = [...new Set(remote.split("\n").filter(Boolean).map((r) => r.replace(/^origin\//, "")).filter((r) => !locals.includes(r)))];
    return { ok: true, current, branches: [...locals, ...remotes], local: locals, remote: remotes };
  } catch (e) {
    return { ok: false, error: errMsg(e), code: "git_branches_failed" };
  }
}

/** Switch the clone to a branch (creating it from origin/<branch> or current HEAD if missing). */
export async function checkoutBranch(clonePath: string, branch: string): Promise<GitOpResult> {
  try {
    assertInsideRoots(clonePath);
    const exists = await git(clonePath, ["rev-parse", "--verify", "--quiet", `refs/heads/${branch}`]).then(() => true).catch(() => false);
    if (!exists) {
      const remoteHas = await git(clonePath, ["rev-parse", "--verify", "--quiet", `refs/remotes/origin/${branch}`]).then(() => true).catch(() => false);
      await git(clonePath, remoteHas ? ["checkout", "-B", branch, `origin/${branch}`] : ["checkout", "-B", branch]);
    } else {
      await git(clonePath, ["checkout", branch]);
    }
    const commit = await git(clonePath, ["rev-parse", "--short", "HEAD"]).then((b) => b.trim());
    return { ok: true, branch, commit };
  } catch (e) {
    return { ok: false, error: errMsg(e), code: "git_checkout_failed" };
  }
}

/** Run a project's test/lint command (best-effort) and return trimmed output. */
export async function runProjectTests(clonePath: string, command?: string): Promise<GitOpResult> {
  try {
    assertInsideRoots(clonePath);
    // Detect default test command from common manifests; always bounded.
    const hasComposer = await fs.stat(path.join(clonePath, "composer.json")).then(() => true).catch(() => false);
    const hasPackage = await fs.stat(path.join(clonePath, "package.json")).then(() => true).catch(() => false);
    const cmd = command || (hasComposer ? "sh -c 'composer install --no-interaction --prefer-dist 2>/dev/null; php artisan test --stop-on-failure 2>&1 || true'" : hasPackage ? "npm test 2>&1 || true" : "true");
    // Command policy (qm borrow): hard-deny destructive / exfil-pattern shell text even when a
    // caller overrides the command. The route is manageAgents-gated and length-capped upstream;
    // this is the final daemon-side net so a denied pattern never reaches the shell.
    const denied = COMMAND_POLICY_DENY.some((pat) => cmd.includes(pat));
    if (denied) return { ok: false, error: "command denied by policy", code: "git_test_denied" };
    const r = await exec("/bin/sh", ["-c", cmd], { cwd: clonePath, timeout: 180_000, maxBuffer: 8 * 1024 * 1024 }).catch((e: any) => e);
    return { ok: true, output: String(r?.stdout ?? "").slice(-8000), code: r?.code ?? 0, command: cmd };
  } catch (e) {
    return { ok: false, error: errMsg(e), code: "git_test_failed" };
  }
}

// Predeclared command policy — deny-list of dangerous shell fragments (qm's "hard denials"
// concept). Matched as substrings against the resolved command string. Keep it conservative:
// a false positive blocks a test run; a false negative is a host compromise.
// NOTE: pipe-to-shell patterns intentionally omit the space before `|` (both `curl x | sh`
// and `curl x|sh` are common) — matching `| sh`/`|sh` with a leading pipe catches any
// remote-script-piped-to-shell, not just curl/wget specifically.
const COMMAND_POLICY_DENY: string[] = [
  "rm -rf /",            // recursive delete from filesystem root
  "mkfs",                // format a filesystem
  "dd if=",              // raw block device write
  "shutdown",            // host shutdown
  "reboot",              // host reboot
  "> /dev/sda",          // write to a block device
  "| sh",                // pipe output to sh (curl x | sh, echo x | sh, ...)
  "|sh",                 // same, without space
  "| bash",              // pipe output to bash
  "|bash",               // same, without space
  "| zsh",               // pipe output to zsh
  "|zsh",                // same, without space
  "| base64",            // pipe to base64 (decode-then-run / exfil patterns)
  "|base64",             // same, without space
  "chmod -R 777 /",      // world-writable root
  "chown -R 0:0 /",      // root-own everything
  "git reset --hard HEAD && git clean -fdx", // destructive repo wipe (kept even though args are fixed by the UI; defense in depth)
  "base64 -d",           // decode-then-run exfil pattern
  "nc -e",               // netcat reverse shell
  "bash -i >& /dev/tcp", // bash reverse shell
  "python3 -c 'import socket,subprocess", // python reverse shell
];

async function git(cwd: string, args: string[]): Promise<string> {
  const r = await exec(GIT, args, { cwd, timeout: 60_000, maxBuffer: 4 * 1024 * 1024 });
  return r.stdout;
}

export async function ensureProjectsRootDir(): Promise<string> {
  const root = await projectsRoot();
  await fs.mkdir(root, { recursive: true });
  return root;
}
