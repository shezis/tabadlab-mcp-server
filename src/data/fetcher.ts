/**
 * Google Sheets data fetcher for the Tabadlab Debt-for-Climate Swaps dataset.
 *
 * Data source: public Google Sheet (no API key required).
 * Response format: JSON wrapped in the Google Visualization Query response
 * envelope — `/*O_o*\/\ngoogle.visualization.Query.setResponse({...});`
 */

import type { DebtSwap } from "./types.js";

// ── Sheet configuration ───────────────────────────────────────────────────────

const SHEET_ID = "1pHyVVVcGpjuP23ehLgOQoZzLd2Gj_NwmjmKl82g1GBs";
const SHEET_NAME = "Final_Data";
const RANGE = "A1:Z1000";

const FETCH_URL =
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq` +
  `?sheet=${encodeURIComponent(SHEET_NAME)}&range=${encodeURIComponent(RANGE)}`;

// ── Google Visualization API response types ───────────────────────────────────

interface GVizCell {
  v: string | number | boolean | null;
  f?: string; // formatted value (ignored)
}

interface GVizRow {
  c: Array<GVizCell | null>;
}

interface GVizTable {
  rows: GVizRow[];
}

interface GVizResponse {
  table: GVizTable;
}

// ── Cell value helpers ────────────────────────────────────────────────────────

function getString(cell: GVizCell | null | undefined): string | null {
  if (!cell || cell.v === null || cell.v === undefined) return null;
  const s = String(cell.v).trim();
  return s.length > 0 ? s : null;
}

function getNumber(cell: GVizCell | null | undefined): number | null {
  if (!cell || cell.v === null || cell.v === undefined) return null;
  const n = Number(cell.v);
  return Number.isFinite(n) ? n : null;
}

function getStringOrNumber(
  cell: GVizCell | null | undefined
): string | number | null {
  if (!cell || cell.v === null || cell.v === undefined) return null;
  if (typeof cell.v === "number") return cell.v;
  const s = String(cell.v).trim();
  return s.length > 0 ? s : null;
}

// ── Response parser ───────────────────────────────────────────────────────────

/**
 * Strips the Google Visualization Query envelope and returns the inner JSON string.
 *
 * Input format:
 *   `/*O_o*\/\ngoogle.visualization.Query.setResponse({...});`
 */
function stripGVizEnvelope(raw: string): string {
  const PREFIX = "/*O_o*/\ngoogle.visualization.Query.setResponse(";
  const SUFFIX = ");";

  let text = raw.trim();

  if (text.startsWith(PREFIX)) {
    text = text.slice(PREFIX.length);
  }
  if (text.endsWith(SUFFIX)) {
    text = text.slice(0, -SUFFIX.length);
  }

  return text.trim();
}

// ── Public fetcher ────────────────────────────────────────────────────────────

/**
 * Fetches the complete Debt-for-Climate Swaps dataset from Google Sheets.
 *
 * - Rows missing `country` or `year` are silently discarded.
 * - Returns a plain array of `DebtSwap` objects ready for filtering/caching.
 */
export async function fetchAllSwaps(): Promise<DebtSwap[]> {
  let responseText: string;

  try {
    const res = await fetch(FETCH_URL, {
      headers: {
        // Request plain text; the GViz endpoint always returns its own content type
        Accept: "text/plain, */*",
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    responseText = await res.text();
  } catch (cause) {
    throw new Error(
      `Failed to fetch DCS Google Sheet: ${(cause as Error).message}`,
      { cause }
    );
  }

  let parsed: GVizResponse;

  try {
    const jsonStr = stripGVizEnvelope(responseText);
    parsed = JSON.parse(jsonStr) as GVizResponse;
  } catch (cause) {
    throw new Error("Failed to parse Google Visualization API response", {
      cause,
    });
  }

  const rows: GVizRow[] = parsed?.table?.rows ?? [];

  const swaps: DebtSwap[] = [];

  for (const row of rows) {
    const cells = row.c ?? [];

    // Required fields — skip the row if either is absent
    const country = getString(cells[3]);   // c[3] = Debtor
    const year = getNumber(cells[4]);      // c[4] = Year
    if (!country || year === null) continue;

    swaps.push({
      debtor_coordinates: getString(cells[0]),       // c[0] = Debtor_Coordinates
      debtor_flag_link: getString(cells[1]),          // c[1] = Debtor_Flag_Link
      swap_id: getString(cells[2]),                   // c[2] = Swap ID
      country,                                        // c[3] = Debtor
      year,                                           // c[4] = Year
      type: getString(cells[5]),                      // c[5] = Type_of_Swap
      financial_instrument: getString(cells[6]),      // c[6] = Financial_Instrument(s)
      creditor_coordinates: getString(cells[7]),      // c[7] = Creditor_Coordinates
      creditor_flag_link: getString(cells[8]),        // c[8] = Creditor_Flag_Link
      creditor: getString(cells[9]),                  // c[9] = Creditor
      purchaser: getString(cells[10]),                // c[10] = Purchaser
      donor: getString(cells[11]),                    // c[11] = Donor
      face_value_usd_m: getNumber(cells[12]),         // c[12] = Face_Value_of_Debt_USD_Million
      interest_rate: getNumber(cells[13]),            // c[13] = Interest_Rate
      purchase_price_usd_m: getNumber(cells[14]),     // c[14] = Purchase_Price_USD_Million
      climate_finance_usd_m: getStringOrNumber(cells[15]), // c[15] = Climate_Finance
      actors_involved: getString(cells[16]),          // c[16] = Other_Actors
      duration_years: getString(cells[17]),           // c[17] = Duration_in_Years
      additional_info: getString(cells[18]),          // c[18] = Additional_information
      source: getString(cells[19]),                   // c[19] = Source
    });
  }

  return swaps;
}
