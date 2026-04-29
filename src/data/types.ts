/**
 * Shared TypeScript types for the Tabadlab Debt-for-Climate Swaps (DCS) dataset.
 *
 * Actual column mapping from the Google Visualization API response (row.c[N].v):
 *   c[0]  → debtor_coordinates
 *   c[1]  → debtor_flag_link
 *   c[2]  → swap_id
 *   c[3]  → country (Debtor)
 *   c[4]  → year
 *   c[5]  → type (Type_of_Swap)
 *   c[6]  → financial_instrument
 *   c[7]  → creditor_coordinates
 *   c[8]  → creditor_flag_link
 *   c[9]  → creditor
 *   c[10] → purchaser
 *   c[11] → donor
 *   c[12] → face_value_usd_m
 *   c[13] → interest_rate
 *   c[14] → purchase_price_usd_m
 *   c[15] → climate_finance_usd_m
 *   c[16] → actors_involved (Other_Actors)
 *   c[17] → duration_years
 *   c[18] → additional_info
 *   c[19] → source
 */

// ── Core domain model ─────────────────────────────────────────────────────────

export interface DebtSwap {
  /** Unique swap identifier (e.g. "0001-BO-01-87") */
  swap_id: string | null;

  /** Debtor country coordinates (lat, lng string). */
  debtor_coordinates: string | null;

  /** URL to the debtor country flag image. */
  debtor_flag_link: string | null;

  /** Debtor country name. Required — rows without this are discarded. */
  country: string;

  /** Year the swap was executed. Required — rows without this are discarded. */
  year: number;

  /** Type / category of debt-for-climate swap (e.g. "Triparty", "Bilateral"). */
  type: string | null;

  /** Financial instrument used (e.g. "Direct Debt Conversion", "Bond"). */
  financial_instrument: string | null;

  /** Creditor coordinates (lat, lng string). */
  creditor_coordinates: string | null;

  /** URL to the creditor flag image. */
  creditor_flag_link: string | null;

  /**
   * Creditor name(s). May contain multiple parties separated by commas or
   * joined with " and " (e.g. "France and Germany").
   */
  creditor: string | null;

  /** Entity that purchased the debt on the secondary market. */
  purchaser: string | null;

  /** Donor/grant provider, if any. */
  donor: string | null;

  /** Face value of the debt in USD millions. */
  face_value_usd_m: number | null;

  /** Original interest rate on the debt instrument (percentage). */
  interest_rate: number | null;

  /** Price paid to acquire the debt in USD millions. */
  purchase_price_usd_m: number | null;

  /**
   * Conservation / environmental fund created or funded (USD millions).
   * Kept as `string | number` because source data can be either.
   */
  climate_finance_usd_m: string | number | null;

  /** Comma-separated list of other actors / organisations involved. */
  actors_involved: string | null;

  /** Duration of the swap agreement (years). Stored as string to preserve ranges like "10-15". */
  duration_years: string | null;

  /** Free-text additional information or notes. */
  additional_info: string | null;

  /** Source citations for this swap record. */
  source: string | null;
}

// ── Filter / query parameters ─────────────────────────────────────────────────

export interface SwapFilters {
  /** Partial match on `country` (debtor), case-insensitive. */
  debtor?: string;

  /** Partial match on `creditor`, case-insensitive. */
  creditor?: string;

  /** Exact match on `year`. */
  year?: number;

  /** Inclusive lower bound on `year`. */
  year_from?: number;

  /** Inclusive upper bound on `year`. */
  year_to?: number;

  /** Partial match on `type`, case-insensitive. */
  swap_type?: string;

  /** Partial match inside `actors_involved`, case-insensitive. */
  actor?: string;

  /** Maximum number of results to return. Default: 50, max: 200. */
  limit?: number;

  /** Number of records to skip for pagination. Default: 0. */
  offset?: number;
}
