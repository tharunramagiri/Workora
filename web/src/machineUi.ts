export interface MachineVersionState {
  status?: string;
  daemonVersion?: string;
}

export function isDaemonUpdateAvailable(machine: MachineVersionState | null | undefined, latestDaemonVersion: string): boolean {
  return !!machine
    && machine.status === "online"
    && !!machine.daemonVersion
    && !!latestDaemonVersion
    && machine.daemonVersion !== latestDaemonVersion;
}

export function daemonUpdateCommandTemplate(origin: string): string {
  return `curl -fsSL https://raw.githubusercontent.com/tharunramagiri/Workora/main/scripts/install-daemon.sh | bash -s -- --server-url ${origin} --api-key <your sk_machine_... key>`;
}

// The runnable connect command with a real machine key filled in (the connect-computer wizard has the
// freshly-minted key; daemonUpdateCommandTemplate keeps a placeholder for the key-not-shown update flow).
export function daemonConnectCommand(origin: string, key: string): string {
  return `curl -fsSL https://raw.githubusercontent.com/tharunramagiri/Workora/main/scripts/install-daemon.sh | bash -s -- --server-url ${origin} --api-key ${key}`;
}
