/**
 * Tool: query-swaps
 *
 * Searches the Tabadlab Debt-for-Climate Swaps (DCS) dataset with optional
 * filters for debtor country, creditor, year range, swap type, and involved actors.
 */

import type { Tool, CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { SwapFilters } from "../data/types.js";
import { getCachedSwaps } from "../data/cache.js";

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;

export const querySwapsDefinition: Tool = {
  name: "query_swaps",
  description:
    "Search and filter the Tabadlab Debt-for-Climate Swaps (DCS) dataset. " +
    "Supports partial-match filtering by debtor country, creditor, swap type, " +
    "involved actors, and year range with pagination.",
  inputSchema: {
    type: "object",
    properties: {
      debtor: {
        type: "string",
        description: "Partial, case-insensitive match on the debtor country name.",
      },
      creditor: {
        type: "string",
        description: "Partial, case-insensitive match on the creditor name.",
      },
      year: {
        type: "number",
        description: "Exact year the swap was executed.",
      },
      year_from: {
        type: "number",
        description: "Inclusive lower bound on the year.",
      },
      year_to: {
        type: "number",
        description: "Inclusive upper bound on the year.",
      },
      swap_type: {
        type: "string",
        description: "Partial, case-insensitive match on the swap type.",
      },
      actor: {
        type: "string",
        description: "Partial, case-insensitive match inside the actors_involved field.",
      },
      limit: {
        type: "number",
        description: `Maximum number of results to return (default: ${DEFAULT_LIMIT}, max: ${MAX_LIMIT}).`,
        minimum: 1,
        maximum: MAX_LIMIT,
      },
      offset: {
        type: "number",
        description: "Number of records to skip for pagination (default: 0).",
        minimum: 0,
      },
    },
    required: [],
  },
};

export async function handleQuerySwaps(
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const filters: SwapFilters = {
    debtor: args["debtor"] as string | undefined,
    creditor: args["creditor"] as string | undefined,
    year: args["year"] as number | undefined,
    year_from: args["year_from"] as number | undefined,
    year_to: args["year_to"] as number | undefined,
    swap_type: args["swap_type"] as string | undefined,
    actor: args["actor"] as string | undefined,
    limit: Math.min((args["limit"] as number | undefined) ?? DEFAULT_LIMIT, MAX_LIMIT),
    offset: (args["offset"] as number | undefined) ?? 0,
  };

  try {
    const allSwaps = await getCachedSwaps();

    // Apply filters
    let results = allSwaps;

    if (filters.debtor) {
      const term = filters.debtor.toLowerCase();
      results = results.filter((s) => s.country.toLowerCase().includes(term));
    }
    if (filters.creditor) {
      const term = filters.creditor.toLowerCase();
      results = results.filter(
        (s) => s.creditor !== null && s.creditor.toLowerCase().includes(term)
      );
    }
    if (filters.year !== undefined) {
      results = results.filter((s) => s.year === filters.year);
    }
    if (filters.year_from !== undefined) {
      results = results.filter((s) => s.year >= filters.year_from!);
    }
    if (filters.year_to !== undefined) {
      results = results.filter((s) => s.year <= filters.year_to!);
    }
    if (filters.swap_type) {
      const term = filters.swap_type.toLowerCase();
      results = results.filter(
        (s) => s.type !== null && s.type.toLowerCase().includes(term)
      );
    }
    if (filters.actor) {
      const term = filters.actor.toLowerCase();
      results = results.filter(
        (s) =>
          s.actors_involved !== null &&
          s.actors_involved.toLowerCase().includes(term)
      );
    }

    const total = results.length;
    const page = results.slice(filters.offset, filters.offset! + filters.limit!);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            { total, offset: filters.offset, limit: filters.limit, results: page },
            null,
            2
          ),
        },
      ],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: "text", text: `Error querying DCS swaps: ${message}` }],
      isError: true,
    };
  }
}
