// Shared types mirroring the existing Workora API responses (src/server/routes-api/*).

export interface Agent {
  id: string;
  name: string;
  displayName: string;
  description?: string | null;
  status: string; // active | inactive | sleeping | starting | queued
  activity?: string | null; // working | thinking | online | offline | sleeping
  model?: string | null;
  runtime: string; // claude | codex | opencode | ...
  machineId?: string | null;
  avatarUrl?: string | null;
  creatorType?: string; // "system" = showcase demo agents (hidden from member rosters)
  projectBound?: boolean;
  projectPath?: string | null;
  executionMode?: string; // auto | fast | manual (→ autonomy tier L1/L2/L3)
}

export interface Machine {
  id: string;
  name?: string;
  hostname?: string;
  os?: string;
  runtimes?: string[];
  status?: string; // online | offline
  daemonVersion?: string;
  isComputer?: boolean;
  apiKeyPrefix?: string;
  lastHeartbeat?: string | null;
}

export interface Task {
  id: string;
  channelId?: string;
  content?: string;
  senderName?: string;
  taskStatus?: string | null; // todo | in_progress | in_review | done | closed
  taskNumber?: number | null;
  taskAssigneeType?: string | null;
  taskAssigneeId?: string | null;
  createdAt?: string;
}

export interface Channel {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  joined?: boolean;
  archivedAt?: string | null;
}

export interface Project {
  id: string;
  name: string;
  repoUrl: string;
  clonePath?: string | null;
  defaultBranch?: string | null;
  channelId?: string | null;
  status: string; // cloning | ready | error | removed
  lastError?: string | null;
  lastCommit?: string | null;
  lastSyncedAt?: string | null;
  createdAt?: string;
}

export interface Skill {
  id: string;
  name: string;
  description?: string;
  vendor?: string;
  assignedTo: string[]; // agent names
}

// One entry from GET /api/agents/:id/activity-log (chronological ascending).
export interface ActivityItem {
  timestamp: number;
  entry: {
    kind: string; // tool_start | thinking | working | task | ...
    activity?: string | null;
    detail?: string | null;
    text?: string | null;
    toolName?: string | null;
    toolInput?: string | null;
  };
}

// Workspace info from GET /api/servers (no x-server-id needed — token-scoped).
export interface ServerInfo {
  id: string;
  name: string;
  slug: string;
  avatarUrl?: string | null;
  role?: string;
  capabilities?: Record<string, boolean>;
}
