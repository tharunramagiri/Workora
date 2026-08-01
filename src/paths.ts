// Single source of truth for on-disk locations. OPEN_WORKORA_HOME (default ~/.Workora) lets each
// worktree/dev environment use its own data dir so parallel daemons/agents never collide.
// Read on each call so env loaded by env.ts (before first use) is honored, and tests can toggle it.
import os from "node:os";
import path from "node:path";

export const workoraHome = (): string => process.env.OPEN_WORKORA_HOME ?? path.join(os.homedir(), ".Workora");
export const agentsDir = (): string => path.join(workoraHome(), "agents");
export const binDir = (): string => path.join(workoraHome(), "bin");
export const machineIdFile = (): string => path.join(workoraHome(), "machine-id");
// Legacy specific overrides keep precedence over the HOME-derived default (back-compat).
export const logsDir = (): string => process.env.OPEN_WORKORA_LOG_DIR ?? path.join(workoraHome(), "logs");
export const uploadsDir = (): string => process.env.OPEN_WORKORA_UPLOAD_DIR ?? path.join(workoraHome(), "uploads");
