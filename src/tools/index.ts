/**
 * Tools barrel — registers definitions and routes dispatch.
 */

import type { Tool, CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { querySwapsDefinition, handleQuerySwaps } from "./query-swaps.js";
import { getStatisticsDefinition, handleGetStatistics } from "./get-statistics.js";
import { getMetadataDefinition, handleGetMetadata } from "./get-metadata.js";

// ── Registry ──────────────────────────────────────────────────────────────────

export const toolDefinitions: Tool[] = [
  querySwapsDefinition,
  getStatisticsDefinition,
  getMetadataDefinition,
];

type ToolHandler = (args: Record<string, unknown>) => Promise<CallToolResult>;

const handlers: Record<string, ToolHandler> = {
  query_swaps: handleQuerySwaps,
  get_statistics: handleGetStatistics,
  get_metadata: handleGetMetadata,
};

// ── Dispatcher ────────────────────────────────────────────────────────────────

export async function callTool(
  name: string,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const handler = handlers[name];
  if (!handler) {
    return {
      content: [{ type: "text", text: `Unknown tool: "${name}"` }],
      isError: true,
    };
  }
  return handler(args);
}
