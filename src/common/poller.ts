// ============================================================
// Background cache pre-warmer
// Refreshes data for configured usernames before TTL expires,
// eliminating cold-miss latency on the first request after expiry.
// ============================================================

import type { FastifyBaseLogger } from 'fastify';
import { fetchStats } from '../fetchers/stats-fetcher.js';
import { fetchTopLanguages } from '../fetchers/top-langs-fetcher.js';
import { fetchStreakStats } from '../fetchers/streak-fetcher.js';
import { fetchActivity } from '../fetchers/activity-fetcher.js';
import { fetchDevOps } from '../fetchers/devops-fetcher.js';
import { fetchInternalCodingStats } from '../fetchers/coding-stats-fetcher.js';
import { getRateLimitStatus } from './retryer.js';

const DEFAULT_INTERVAL_MS = 60_000; // 1 minute
const MIN_INTERVAL_MS = 30_000; // 30 seconds floor
const MIN_RATE_LIMIT_REMAINING = 100;

function loadWarmUsernames(): string[] {
  const raw = process.env['WARM_USERNAMES'] ?? '';
  return raw
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean);
}

function loadIntervalMs(): number {
  const raw = process.env['WARM_INTERVAL_MS'];
  const parsed = raw !== undefined ? parseInt(raw, 10) : NaN;
  return isNaN(parsed) ? DEFAULT_INTERVAL_MS : Math.max(parsed, MIN_INTERVAL_MS);
}

async function hasEnoughRateLimit(): Promise<boolean> {
  try {
    const statuses = await getRateLimitStatus();
    return statuses.some((s) => s.remaining >= MIN_RATE_LIMIT_REMAINING);
  } catch {
    return false;
  }
}

async function warmUsername(username: string, log: FastifyBaseLogger): Promise<void> {
  const jobs: ReadonlyArray<[string, () => Promise<unknown>]> = [
    ['stats', () => fetchStats(username)],
    ['top-langs', () => fetchTopLanguages(username)],
    ['streak', () => fetchStreakStats(username)],
    ['activity', () => fetchActivity(username)],
    ['devops', () => fetchDevOps(username)],
    ['coding-stats', () => fetchInternalCodingStats(username)],
  ];

  for (const [endpoint, fetch] of jobs) {
    try {
      await fetch();
    } catch (err) {
      log.warn({ err, username, endpoint }, 'poller: pre-warm failed');
    }
  }
}

/**
 * Start the background cache pre-warmer.
 * Reads WARM_USERNAMES (comma-separated) and WARM_INTERVAL_MS from env.
 * Does nothing if WARM_USERNAMES is empty.
 */
export function startBackgroundPoller(log: FastifyBaseLogger): void {
  const usernames = loadWarmUsernames();
  if (usernames.length === 0) return;

  const intervalMs = loadIntervalMs();
  log.info({ usernames, intervalMs }, 'background poller started');

  const runCycle = async (): Promise<void> => {
    const ok = await hasEnoughRateLimit();
    if (!ok) {
      log.warn('poller: skipping cycle — GitHub rate limit too low');
      return;
    }
    for (const username of usernames) {
      await warmUsername(username, log);
    }
  };

  // Fire immediately on startup, then on interval
  void runCycle();
  setInterval(() => {
    void runCycle();
  }, intervalMs);
}
