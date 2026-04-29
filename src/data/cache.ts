/**
 * In-memory TTL cache and pre-wired helpers for the DCS dataset.
 *
 * `DataCache` is a generic, key-based store where each entry has its own TTL.
 * `dataCache` is the shared module-level singleton.
 * `getCachedSwaps()` is the primary entry point used by MCP tool handlers.
 */

import type { DebtSwap } from "./types.js";
import { fetchAllSwaps } from "./fetcher.js";

// ── Generic TTL cache ─────────────────────────────────────────────────────────

interface CacheEntry<T> {
  value: T;
  expiresAt: number; // epoch ms
}

export class DataCache {
  private readonly store = new Map<string, CacheEntry<unknown>>();

  /**
   * Returns the cached value for `key`, or `undefined` if missing / expired.
   * Expired entries are evicted on access.
   */
  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  /**
   * Stores `value` under `key` with an expiry of `ttlMs` milliseconds from now.
   */
  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  /**
   * Returns `true` if `key` exists and has not yet expired.
   * Expired entries are evicted on access.
   */
  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }

    return true;
  }

  /** Removes `key` from the cache regardless of expiry. */
  invalidate(key: string): void {
    this.store.delete(key);
  }

  /** Clears all entries. */
  clear(): void {
    this.store.clear();
  }

  /** Number of entries currently held (including expired-but-not-yet-evicted). */
  get size(): number {
    return this.store.size;
  }
}

// ── Shared singleton ──────────────────────────────────────────────────────────

/** Module-level cache instance shared across all tool handlers. */
export const dataCache = new DataCache();

// ── DCS dataset helper ────────────────────────────────────────────────────────

const SWAPS_CACHE_KEY = "dcs:all_swaps";
const SWAPS_TTL_MS = 5 * 60 * 1_000; // 5 minutes

/**
 * Returns the full DCS dataset, serving from the in-memory cache when
 * available.  On a cache miss (or after TTL expiry) the data is re-fetched
 * from the Google Sheet and stored with a fresh 5-minute TTL.
 */
export async function getCachedSwaps(): Promise<DebtSwap[]> {
  const cached = dataCache.get<DebtSwap[]>(SWAPS_CACHE_KEY);
  if (cached !== undefined) {
    return cached;
  }

  const fresh = await fetchAllSwaps();
  dataCache.set(SWAPS_CACHE_KEY, fresh, SWAPS_TTL_MS);
  return fresh;
}
