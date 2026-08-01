#!/usr/bin/env bash
# Workora daemon installer — installs the prebuilt daemon bundle straight from the
# repo (the daemon is not yet published to npm). Works on any machine with curl
# and Node.js >= 20; no GitHub SSH key and no npm login required.
#
# Usage (shown in the web UI under Computers -> Connect a computer):
#   curl -fsSL https://raw.githubusercontent.com/tharunramagiri/Workora/main/scripts/install-daemon.sh \
#     | bash -s -- --server-url https://your-workora-server --api-key sk_machine_xxx
set -euo pipefail

BASE="https://raw.githubusercontent.com/tharunramagiri/Workora/main/packages/daemon/dist"
DIR="${WORKORA_DAEMON_HOME:-$HOME/.workora/bin}"

echo "Workora daemon installer"
echo "  → installing to $DIR"
mkdir -p "$DIR"
curl -fsSL "$BASE/cli.mjs" -o "$DIR/cli.mjs"
curl -fsSL "$BASE/agent-cli.mjs" -o "$DIR/agent-cli.mjs"
chmod +x "$DIR/cli.mjs" "$DIR/agent-cli.mjs"

if [ ! -e "$DIR/Workora-daemon" ]; then
  ln -s cli.mjs "$DIR/Workora-daemon"
fi

echo "  → Workora-daemon installed. Launching…"
exec "$DIR/Workora-daemon" "$@"
