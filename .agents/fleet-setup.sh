#!/bin/bash
# Workora Fleet — Agent Creation Script
# Run this AFTER logging into https://office.ramagiritharun.in/
# Usage: bash .agents/fleet-setup.sh <JWT_TOKEN>

if [ -z "$1" ]; then
  echo "ERROR: JWT token required"
  echo "Usage: bash .agents/fleet-setup.sh <token>"
  exit 1
fi

TOKEN="$1"
BASE="https://office.ramagiritharun.in"
HEADER="Authorization: Bearer $TOKEN"

# Step 1: Get machines to find this VPS
echo "Fetching machines..."
MACHINES=$(curl -s -H "$HEADER" "$BASE/api/machines")
echo "$MACHINES" | python3 -m json.tool 2>/dev/null || echo "$MACHINES"

# Extract machine ID (assumes first machine is this VPS)
MACHINE_ID=$(echo "$MACHINES" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['id'] if isinstance(d,list) and d else '')" 2>/dev/null)

if [ -z "$MACHINE_ID" ]; then
  echo "ERROR: No machine found. Make sure the daemon is connected."
  exit 1
fi

echo "Using machine ID: $MACHINE_ID"

# Step 2: Create agents
AGENTS=(
  '{"name":"BookoraaEng","displayName":"BookoraaEng","description":"Engineering lead for Bookoraa booking platform. Owns Laravel/React stack, bug fixes, QA.","runtime":"claude","machineId":"'$MACHINE_ID'","projectPath":"/opt/bookoraa"}'
  '{"name":"WaoraEng","displayName":"WaoraEng","description":"Engineering lead for Waora WhatsApp engine. Owns NestJS/OpenWA bridge, session management, LiveKit.","runtime":"claude","machineId":"'$MACHINE_ID'","projectPath":"/opt/waora"}'
  '{"name":"WorkoraEng","displayName":"WorkoraEng","description":"Engineering lead for Workora platform. Owns daemon, runtimes, agent lifecycle, security.","runtime":"hermes","machineId":"'$MACHINE_ID'","projectPath":"/home/tarun/workora"}'
  '{"name":"ResearchEng","displayName":"ResearchEng","description":"24/7 research agent. Competitor tracking, market trends, security advisories, opportunity scanning.","runtime":"opencode","machineId":"'$MACHINE_ID'","projectPath":"/home/tarun/workora"}'
  '{"name":"AuditEng","displayName":"AuditEng","description":"Security and quality auditor. Dependency scanning, bug bounty triage, compliance checks.","runtime":"claude","machineId":"'$MACHINE_ID'","projectPath":"/home/tarun/workora"}'
)

for agent in "${AGENTS[@]}"; do
  NAME=$(echo "$agent" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['name'])")
  echo "Creating agent: $NAME..."
  RESULT=$(curl -s -X POST -H "$HEADER" -H "Content-Type: application/json" -d "$agent" "$BASE/api/agents")
  echo "$RESULT" | python3 -m json.tool 2>/dev/null || echo "$RESULT"
  echo "---"
done

echo "Fleet setup complete. Agents will auto-start if daemon is connected."
