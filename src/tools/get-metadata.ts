/**
 * Tool: get-metadata
 *
 * Returns reference metadata from the DCS dataset: unique lists of debtor
 * countries, creditors, swap types, financial instruments, and donors.
 * Useful for understanding the available filter values before calling query_swaps.
 */

import type { Tool, CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { getCachedSwaps } from "../data/cache.js";

export const getMetadataDefinition: Tool = {
  name: "get_metadata",
  description:
    "Return unique reference values from the DCS dataset (debtor countries, " +
    "creditors, swap types, financial instruments, donors). " +
    "Use this to discover valid filter values before calling query_swaps.",
  inputSchema: {
    type: "object",
    properties: {
      field: {
        type: "string",
        enum: [
          "countries",
          "creditors",
          "swap_types",
          "financial_instruments",
          "donors",
          "actors",
          "purchasers",
        ],
        description: "Which unique-value list to retrieve.",
      },
    },
    required: ["field"],
  },
};

export async function handleGetMetadata(
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const field = args["field"] as string | undefined;

  if (!field) {
    return {
      content: [{ type: "text", text: '"field" is required.' }],
      isError: true,
    };
  }

  try {
    const swaps = await getCachedSwaps();

    let values: string[];

    switch (field) {
      case "countries":
        values = [...new Set(swaps.map((s) => s.country))].sort();
        break;
      case "creditors":
        values = [
          ...new Set(
            swaps
              .map((s) => s.creditor)
              .filter((v): v is string => v !== null)
          ),
        ].sort();
        break;
      case "swap_types":
        values = [
          ...new Set(
            swaps
              .map((s) => s.type)
              .filter((v): v is string => v !== null)
          ),
        ].sort();
        break;
      case "financial_instruments":
        values = [
          ...new Set(
            swaps
              .map((s) => s.financial_instrument)
              .filter((v): v is string => v !== null)
          ),
        ].sort();
        break;
      case "donors":
        values = [
          ...new Set(
            swaps
              .map((s) => s.donor)
              .filter((v): v is string => v !== null)
          ),
        ].sort();
        break;
      case "actors":
        values = [
          ...new Set(
            swaps
              .flatMap((s) =>
                s.actors_involved
                  ? s.actors_involved.split(",").map((a) => a.trim()).filter(Boolean)
                  : []
              )
          ),
        ].sort();
        break;
      case "purchasers":
        values = [
          ...new Set(
            swaps
              .map((s) => s.purchaser)
              .filter((v): v is string => v !== null)
          ),
        ].sort();
        break;
      default:
        return {
          content: [
            {
              type: "text",
              text: `Unknown field "${field}". Valid values: countries, creditors, swap_types, financial_instruments, donors, actors, purchasers.`,
            },
          ],
          isError: true,
        };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ field, count: values.length, values }, null, 2),
        },
      ],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: "text", text: `Error fetching metadata: ${message}` }],
      isError: true,
    };
  }
}
