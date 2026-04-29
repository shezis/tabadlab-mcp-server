/**
 * Tool: get-statistics
 *
 * Computes aggregate statistics over the full Debt-for-Climate Swaps dataset:
 * total swap count, total face value, total climate finance, unique countries,
 * and an optional breakdown by year or swap type.
 */

import type { Tool, CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { getCachedSwaps } from "../data/cache.js";

export const getStatisticsDefinition: Tool = {
  name: "get_statistics",
  description:
    "Return aggregate statistics over the Tabadlab DCS dataset: total swap " +
    "count, total face value (USD M), total climate finance (USD M), unique " +
    "debtor countries, and optional breakdowns by year or swap type.",
  inputSchema: {
    type: "object",
    properties: {
      group_by: {
        type: "string",
        enum: ["year", "swap_type", "country"],
        description:
          "Optional dimension to group statistics by. Omit for global totals.",
      },
    },
    required: [],
  },
};

export async function handleGetStatistics(
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const groupBy = args["group_by"] as "year" | "swap_type" | "country" | undefined;

  try {
    const swaps = await getCachedSwaps();

    if (!groupBy) {
      // Global aggregate
      const totalFaceValue = swaps.reduce(
        (sum, s) => sum + (s.face_value_usd_m ?? 0),
        0
      );
      const totalClimateFinance = swaps.reduce((sum, s) => {
        const v = typeof s.climate_finance_usd_m === "number"
          ? s.climate_finance_usd_m
          : 0;
        return sum + v;
      }, 0);
      const uniqueCountries = new Set(swaps.map((s) => s.country)).size;
      const yearRange = swaps.length > 0
        ? { min: Math.min(...swaps.map((s) => s.year)), max: Math.max(...swaps.map((s) => s.year)) }
        : null;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                total_swaps: swaps.length,
                unique_debtor_countries: uniqueCountries,
                total_face_value_usd_m: Math.round(totalFaceValue * 100) / 100,
                total_climate_finance_usd_m: Math.round(totalClimateFinance * 100) / 100,
                year_range: yearRange,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // Grouped breakdown
    const groups = new Map<
      string,
      { count: number; face_value_usd_m: number; climate_finance_usd_m: number }
    >();

    for (const s of swaps) {
      const key =
        groupBy === "year"
          ? String(s.year)
          : groupBy === "swap_type"
          ? (s.type ?? "Unknown")
          : s.country;

      const existing = groups.get(key) ?? {
        count: 0,
        face_value_usd_m: 0,
        climate_finance_usd_m: 0,
      };

      existing.count += 1;
      existing.face_value_usd_m += s.face_value_usd_m ?? 0;
      existing.climate_finance_usd_m +=
        typeof s.climate_finance_usd_m === "number" ? s.climate_finance_usd_m : 0;

      groups.set(key, existing);
    }

    const breakdown = Object.fromEntries(
      [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [
        k,
        {
          count: v.count,
          face_value_usd_m: Math.round(v.face_value_usd_m * 100) / 100,
          climate_finance_usd_m: Math.round(v.climate_finance_usd_m * 100) / 100,
        },
      ])
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ group_by: groupBy, breakdown }, null, 2),
        },
      ],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: "text", text: `Error computing statistics: ${message}` }],
      isError: true,
    };
  }
}
