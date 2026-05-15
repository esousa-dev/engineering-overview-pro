// ============================================================
// In-memory cache manager with TTL
// ============================================================

import NodeCache from 'node-cache';

import { hashParams } from './utils.js';

import type { CacheConfig } from '../types/index.js';

// Default TTLs per endpoint (in seconds)
const CACHE_TTLS: Record<string, number> = {
  stats: 14_400, // 4h
  'top-langs': 14_400, // 4h
  'top-langs-deep': 86_400, // 24h
  streak: 14_400, // 4h
  activity: 21_600, // 6h
  pin: 14_400, // 4h
  devops: 43_200, // 12h
  'coding-stats': 14_400, // 4h
  wakatime: 14_400, // 4h (kept for legacy /api/wakatime route compatibility)
};

const MIN_CACHE_SECONDS = 300;

const DEFAULT_CONFIG: CacheConfig = {
  stdTTL: 14_400,
  checkperiod: 600,
  maxKeys: 5_000,
};

class CacheManager {
  private readonly cache: NodeCache;
  private readonly inflight = new Map<string, Promise<unknown>>();

  constructor(config: CacheConfig = DEFAULT_CONFIG) {
    this.cache = new NodeCache({
      stdTTL: config.stdTTL,
      checkperiod: config.checkperiod,
      maxKeys: config.maxKeys,
      // useClones: true (default) — segurança contra mutação acidental
    });
  }

  /**
   * Build cache key from endpoint, username, and query params.
   * Format: {endpoint}:{username}:{hash(sorted_params)}
   */
  buildKey(endpoint: string, username: string, params: Record<string, unknown> = {}): string {
    const hash = hashParams(params);
    return `${endpoint}:${username}:${hash}`;
  }

  /**
   * Get cached value. Returns undefined if not found or expired.
   */
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  /**
   * Get cached value or fetch it, coalescing concurrent requests for the same key
   * into a single in-flight fetch so GitHub API is called exactly once per miss.
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    endpoint?: string,
    customTTL?: number,
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) return cached;

    const inflight = this.inflight.get(key) as Promise<T> | undefined;
    if (inflight !== undefined) return inflight;

    const promise = fetchFn()
      .then((value) => {
        this.set(key, value, endpoint, customTTL);
        this.inflight.delete(key);
        return value;
      })
      .catch((err: unknown) => {
        this.inflight.delete(key);
        throw err;
      });

    this.inflight.set(key, promise as Promise<unknown>);
    return promise;
  }

  /**
   * Set cached value with endpoint-specific or custom TTL.
   * NEVER caches error responses (caller responsibility).
   */
  set(key: string, value: unknown, endpoint?: string, customTTL?: number): void {
    const ttl = this.resolveTTL(endpoint, customTTL);
    try {
      this.cache.set(key, value, ttl);
    } catch {
      // Cache cheio (ECACHEFULL): renderização continua, só não cacheamos.
    }
  }

  /**
   * Get the number of cached keys.
   */
  getSize(): number {
    return this.cache.keys().length;
  }

  /**
   * Flush all cached data.
   */
  flush(): void {
    this.cache.flushAll();
  }

  /**
   * Resolve TTL: custom override (clamped to minimum) > endpoint default > global default.
   */
  private resolveTTL(endpoint?: string, customTTL?: number): number {
    if (customTTL !== undefined) {
      return Math.max(customTTL, MIN_CACHE_SECONDS);
    }
    if (endpoint !== undefined) {
      return CACHE_TTLS[endpoint] ?? DEFAULT_CONFIG.stdTTL;
    }
    return DEFAULT_CONFIG.stdTTL;
  }
}

// Singleton instance
export const cacheManager = new CacheManager();

export { CacheManager, CACHE_TTLS, MIN_CACHE_SECONDS };
