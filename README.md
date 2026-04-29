# tabadlab-mcp-server

A **Model Context Protocol (MCP)** server that exposes the [Tabadlab Debt-for-Climate Swaps (DCS) Database](https://dsc---01.webflow.io/?isExpanded=true) as callable tools for AI assistants (Claude, Copilot, etc.).

The DCS Database democratises data on debt-for-climate swaps — financial agreements where a country's debt is reduced or restructured in exchange for commitments to climate or conservation goals. The database covers **162 swaps across 45 debtor countries** spanning **1987–2024**.

---

## Install into Claude Desktop

### Option 1 — One-line script (easiest)

Requires [Node.js ≥ 18](https://nodejs.org) to be installed.

```bash
curl -fsSL https://raw.githubusercontent.com/shezis/tabadlab-mcp-server/main/install.sh | bash
```

Then **restart Claude Desktop**. Done.

### Option 2 — Smithery (one-click)

Browse and install from [smithery.ai/servers/tabadlab-mcp-server](https://smithery.ai/servers/tabadlab-mcp-server) — click **"Add to Claude"**.

### Option 3 — Manual config

Add the following to your `claude_desktop_config.json`:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "tabadlab-dcs": {
      "command": "npx",
      "args": ["-y", "tabadlab-mcp-server"]
    }
  }
}
```

Restart Claude Desktop. The tools will appear automatically.

---

## Tools

| Tool | Description |
|---|---|
| `query_dcs_swaps` → `query_swaps` | Search and filter swaps by debtor, creditor, year range, swap type, and actors involved — with pagination |
| `get_dcs_statistics` → `get_statistics` | Global totals (count, face value, climate finance) or grouped breakdowns by year, swap type, or country |
| `get_dcs_metadata` → `get_metadata` | Unique reference lists (countries, creditors, swap types, financial instruments, donors, actors, purchasers) — useful to discover valid filter values |

### Tool Details

#### `query_swaps`
Search the full DCS dataset with optional filters:

| Parameter | Type | Description |
|---|---|---|
| `debtor` | string | Partial, case-insensitive match on debtor country |
| `creditor` | string | Partial, case-insensitive match on creditor name |
| `year` | number | Exact year |
| `year_from` | number | Year range lower bound (inclusive) |
| `year_to` | number | Year range upper bound (inclusive) |
| `swap_type` | string | Partial match on type (e.g. "Bilateral", "Triparty") |
| `actor` | string | Partial match in actors_involved field |
| `limit` | number | Max results (default: 50, max: 200) |
| `offset` | number | Pagination offset (default: 0) |

#### `get_statistics`
Returns global totals or a grouped breakdown:

| Parameter | Type | Description |
|---|---|---|
| `group_by` | "year" \| "swap_type" \| "country" | Optional grouping dimension |

#### `get_metadata`
Returns sorted unique value lists:

| `field` value | Description |
|---|---|
| `countries` | All debtor countries |
| `creditors` | All creditor entities |
| `swap_types` | All swap type categories |
| `financial_instruments` | All financial instrument types |
| `donors` | All donor entities |
| `actors` | All individual actors (split from comma-separated lists) |
| `purchasers` | All purchaser entities |

---

## Quick Start

### Prerequisites
- **Node.js** ≥ 18
- **npm** ≥ 9

### Install & Build

```bash
npm install
npm run build
```

### Run

```bash
npm start
```

### Development (no build step)

```bash
npm run dev
```

---

## Using with VS Code / GitHub Copilot

Add to your `.vscode/mcp.json`:

```json
{
  "servers": {
    "tabadlab-dcs": {
      "type": "stdio",
      "command": "node",
      "args": ["${workspaceFolder}/dist/index.js"]
    }
  }
}
```

---

## Data Source

Data is fetched live from the public Google Sheet backing the DCS Database:
- **No API key required** — the sheet is publicly accessible
- **Cache TTL**: 5 minutes (configurable in `src/data/cache.ts`)
- **Coverage**: 162 debt-for-climate swap records, 45 debtor countries, 1987–2024

---

## Project Structure

```
tabadlab-mcp-server/
├── src/
│   ├── index.ts              # Entry point — wires server to stdio transport
│   ├── server.ts             # MCP Server factory & request handlers
│   ├── data/
│   │   ├── types.ts          # DebtSwap interface, SwapFilters interface
│   │   ├── fetcher.ts        # Google Sheets GViz API fetcher
│   │   └── cache.ts          # In-memory TTL cache (5-min default)
│   └── tools/
│       ├── index.ts          # Tool registry & dispatcher
│       ├── query-swaps.ts    # query_swaps tool
│       ├── get-statistics.ts # get_statistics tool
│       └── get-metadata.ts   # get_metadata tool
├── dist/                     # Compiled output (git-ignored)
├── package.json
├── tsconfig.json
└── README.md
```

---

## Extending for Future Interfaces

The server is structured for extensibility:

- **Add new tools**: create `src/tools/my-tool.ts`, export a `Tool` definition + handler, register in `src/tools/index.ts`
- **HTTP interface**: the `createServer()` factory in `src/server.ts` is transport-agnostic — swap `StdioServerTransport` for an HTTP/SSE transport in `src/index.ts`
- **Additional data sources**: add new fetchers in `src/data/` and expose them as tools

---

## License

MIT
