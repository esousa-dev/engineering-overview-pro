// ============================================================
// Exponential backoff retryer + PAT token rotation
// ============================================================

import type { TokenState } from '../types/index.js';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1_000;
const RATE_LIMIT_THRESHOLD = 10;

// --- Token rotation ---

let tokenCounter = 0;

function loadTokens(): ReadonlyArray<string> {
  const tokens: Array<string> = [];
  const env = process.env;

  for (const key of Object.keys(env)) {
    if (/^PAT_\d+$/.test(key)) {
      const value = env[key];
      if (value !== undefined) {
        const cleanValue = value.replace(/['"]/g, '').trim();
        if (cleanValue.length > 0) {
          tokens.push(cleanValue);
        }
      }
    }
  }

  return tokens;
}

/**
 * Get next available PAT token via round-robin rotation.
 * Throws if no tokens are configured.
 */
export function getNextToken(): string {
  const tokens = loadTokens();

  if (tokens.length === 0) {
    throw new Error('No PAT tokens configured. Set PAT_1, PAT_2, ... environment variables.');
  }

  const index = tokenCounter % tokens.length;
  tokenCounter += 1;

  const token = tokens[index];

  if (token === undefined) {
    throw new Error('Token rotation failed: unexpected undefined token.');
  }

  return token;
}

/**
 * Check remaining rate limit from response headers.
 * Returns token state with remaining calls and reset timestamp.
 */
export function parseRateLimitHeaders(
  headers: Record<string, string | undefined>,
  token: string,
): TokenState {
  const remaining = parseInt(headers['x-ratelimit-remaining'] ?? '0', 10);
  const resetAt = parseInt(headers['x-ratelimit-reset'] ?? '0', 10) * 1_000;

  return { token, remaining, resetAt };
}

/**
 * Check if token should be rotated based on remaining rate limit.
 */
export function shouldRotateToken(state: TokenState): boolean {
  return state.remaining < RATE_LIMIT_THRESHOLD;
}

// --- Exponential backoff ---

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Retry an async function with exponential backoff.
 * Delays: 1s → 2s → 4s (max 3 retries).
 * On rate limit (403/429), rotates token and retries.
 */
export async function retryWithBackoff<T>(
  fn: (token: string) => Promise<T>,
  maxRetries: number = MAX_RETRIES,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const token = getNextToken();
      return await fn(token);
    } catch (error: unknown) {
      lastError = error;

      if (attempt < maxRetries) {
        const delayMs = BASE_DELAY_MS * Math.pow(2, attempt);
        await delay(delayMs);
      }
    }
  }

  throw lastError;
}

/**
 * Fetch rate limit status for all configured PATs using GitHub REST API.
 * This endpoint (/rate_limit) does not consume rate limit.
 */
export async function getRateLimitStatus(): Promise<ReadonlyArray<TokenState>> {
  const tokens = loadTokens();
  const results: Array<TokenState> = [];

  for (const token of tokens) {
    try {
      const response = await fetch('https://api.github.com/rate_limit', {
        headers: {
          authorization: `Bearer ${token}`,
          'user-agent': 'Antigravity-GitHub-Stats',
        },
      });

      if (response.ok) {
        const data = (await response.json()) as {
          resources: { core: { remaining: number; reset: number } };
        };
        results.push({
          token: token.substring(0, 4) + '***' + token.substring(token.length - 4),
          remaining: data.resources.core.remaining,
          resetAt: data.resources.core.reset * 1_000,
        });
      }
    } catch {
      // Ignore errors for individual tokens during health check
    }
  }

  return results;
}

export { MAX_RETRIES, BASE_DELAY_MS, RATE_LIMIT_THRESHOLD };
