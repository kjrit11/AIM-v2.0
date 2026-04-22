/**
 * React Query cache configuration — AIM v2 (Phase 3a)
 * ===================================================
 *
 * CLAUDE.md Rule #3: all staleTime / gcTime values live here. Components and
 * hooks must import from this file rather than hardcoding durations. A bug in
 * one cache TTL has always manifested as a user-visible data-staleness issue,
 * and the fix has always been "grep for the number, change it in every place
 * you find it." This file ends that pattern.
 *
 * Add a new CACHE entry when a feature needs a TTL that does not match an
 * existing entry. Do not inline a one-off staleTime in a useQuery call.
 *
 * Durations are milliseconds. The SECOND / MINUTE / HOUR / DAY helpers at
 * the top keep the call sites readable.
 */

export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

type CacheEntry = {
  staleTime: number;
  gcTime: number;
};

export const CACHE = {
  // Pricing data rarely changes; cache aggressively
  PRICING: {
    staleTime: 24 * HOUR,
    gcTime: 48 * HOUR,
  },
  // Intelligence feeds refresh daily from Databricks agents
  INTEL_FEEDS: {
    staleTime: 24 * HOUR,
    gcTime: 48 * HOUR,
  },
  // Opportunity data changes often during active deals
  OPPORTUNITIES: {
    staleTime: 5 * MINUTE,
    gcTime: 30 * MINUTE,
  },
  // User records stable within a session
  USERS: {
    staleTime: 1 * HOUR,
    gcTime: 4 * HOUR,
  },
} as const satisfies Record<string, CacheEntry>;

export type CacheKey = keyof typeof CACHE;
