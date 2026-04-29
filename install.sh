#!/usr/bin/env bash
# install.sh — Auto-installs the Tabadlab DCS MCP server into Claude Desktop
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/shezis/tabadlab-mcp-server/main/install.sh | bash
#
# What it does:
#   1. Detects your OS (macOS / Linux / Windows via WSL)
#   2. Locates your Claude Desktop config file
#   3. Adds "tabadlab-dcs" to mcpServers (skips if already present)
#   4. Tells you to restart Claude Desktop

set -euo pipefail

PACKAGE="tabadlab-mcp-server"
SERVER_KEY="tabadlab-dcs"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "  Tabadlab DCS MCP Server — Installer"
echo "  ====================================="
echo ""

# ── 1. Detect OS and locate config ───────────────────────────────────────────

if [[ "$OSTYPE" == "darwin"* ]]; then
  CONFIG_DIR="$HOME/Library/Application Support/Claude"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # WSL or native Linux
  if grep -qi microsoft /proc/version 2>/dev/null; then
    WIN_USER=$(cmd.exe /c "echo %USERNAME%" 2>/dev/null | tr -d '\r' || echo "")
    CONFIG_DIR="/mnt/c/Users/$WIN_USER/AppData/Roaming/Claude"
  else
    CONFIG_DIR="$HOME/.config/Claude"
  fi
else
  echo -e "${RED}Unsupported OS: $OSTYPE${NC}"
  echo "Please add the config manually. See README.md."
  exit 1
fi

CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"

# ── 2. Check Node.js / npx is available ──────────────────────────────────────

if ! command -v node &>/dev/null; then
  echo -e "${RED}Node.js is not installed.${NC}"
  echo "Install it from https://nodejs.org (LTS recommended), then re-run this script."
  exit 1
fi

NODE_VERSION=$(node -e "process.stdout.write(process.versions.node)")
echo -e "  ${GREEN}✓${NC} Node.js found: v$NODE_VERSION"

# ── 3. Ensure config dir exists ───────────────────────────────────────────────

mkdir -p "$CONFIG_DIR"

# ── 4. Create or update the config file ──────────────────────────────────────

# Seed an empty config if the file doesn't exist
if [[ ! -f "$CONFIG_FILE" ]]; then
  echo '{"mcpServers":{}}' > "$CONFIG_FILE"
  echo -e "  ${GREEN}✓${NC} Created new config at: $CONFIG_FILE"
fi

# Check if server is already registered
if grep -q "\"$SERVER_KEY\"" "$CONFIG_FILE" 2>/dev/null; then
  echo -e "  ${YELLOW}⚠${NC}  '$SERVER_KEY' is already in your Claude Desktop config."
  echo "     Nothing to do. Restart Claude Desktop if tools are not appearing."
  exit 0
fi

# Use python3 (available on macOS/most Linux) to safely merge the JSON
python3 - "$CONFIG_FILE" "$SERVER_KEY" "$PACKAGE" <<'PYEOF'
import json, sys

config_path = sys.argv[1]
server_key  = sys.argv[2]
package     = sys.argv[3]

with open(config_path, "r") as f:
    config = json.load(f)

config.setdefault("mcpServers", {})[server_key] = {
    "command": "npx",
    "args": ["-y", package]
}

with open(config_path, "w") as f:
    json.dump(config, f, indent=2)
PYEOF

echo -e "  ${GREEN}✓${NC} Added '$SERVER_KEY' to: $CONFIG_FILE"
echo ""
echo "  Next step:"
echo -e "  ${YELLOW}Restart Claude Desktop${NC} and the DCS tools will be available."
echo ""
echo "  Tools added:"
echo "    • query_swaps       — search 162 debt-for-climate swap records"
echo "    • get_statistics    — totals and breakdowns by year, type, country"
echo "    • get_metadata      — list all countries, creditors, swap types, etc."
echo ""
