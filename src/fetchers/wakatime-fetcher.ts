// ============================================================
// WakaTime Fetcher
// ============================================================

import { z } from 'zod';
import { cacheManager } from '../common/cache.js';
import { getLanguageColor } from '../common/linguist-colors.js';
import type { WakaTimeData } from '../types/index.js';

const WAKATIME_API_URL = 'https://wakatime.com/api/v1/users';

const WakatimeLanguageSchema = z.object({
  name: z.string(),
  total_seconds: z.number(),
  percent: z.number(),
});

const WakatimeEditorSchema = z.object({
  name: z.string(),
  total_seconds: z.number(),
  percent: z.number(),
});

const WakatimeStatsSchema = z.object({
  data: z.object({
    languages: z.array(WakatimeLanguageSchema).optional(),
    editors: z.array(WakatimeEditorSchema).optional(),
    total_seconds: z.number(),
    daily_average: z.number(),
    best_day: z.object({
      date: z.string(),
      total_seconds: z.number(),
    }).nullable().optional(),
  }),
});

/**
 * Fetch WakaTime stats for a specific user.
 */
export async function fetchWakatimeStats(username: string): Promise<WakaTimeData> {
  const cacheKey = cacheManager.buildKey('wakatime', username, {});
  const cached = cacheManager.get<WakaTimeData>(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const apiKey = process.env['WAKATIME_API_KEY'];
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (apiKey) {
    // Basic Auth with API Key as username and empty password (requires colon)
    const auth = Buffer.from(`${apiKey}:`).toString('base64');
    headers['Authorization'] = `Basic ${auth}`;
  }

  // If apiKey is provided, we should use 'current' to fetch the stats of the authenticated user
  const effectiveUsername = apiKey ? 'current' : username;
  const url = `${WAKATIME_API_URL}/${encodeURIComponent(effectiveUsername)}/stats/last_7_days`;

  const controller = new AbortController();
  const timeout = setTimeout(() => { controller.abort(); }, 10_000);
  let response: Response;
  try {
    response = await fetch(url, { headers, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('User not found or stats are private.');
    }
    if (response.status === 401) {
      throw new Error('Upstream authentication failed.');
    }
    if (response.status === 422) {
      throw new Error('WakaTime is calculating stats. Try again later.');
    }
    throw new Error(`Upstream error (${String(response.status)})`);
  }

  const rawData: unknown = await response.json();
  const parsed = WakatimeStatsSchema.parse(rawData);
  const { data } = parsed;

  const wakatimeData: WakaTimeData = {
    totalSeconds: data.total_seconds,
    dailyAverage: data.daily_average,
    languages: (data.languages ?? []).map((lang) => ({
      name: lang.name,
      totalSeconds: lang.total_seconds,
      percent: lang.percent,
      color: getLanguageColor(lang.name),
    })),
    editors: (data.editors ?? []).map((editor) => ({
      name: editor.name,
      totalSeconds: editor.total_seconds,
      percent: editor.percent,
    })),
    bestDay: data.best_day
      ? {
          date: data.best_day.date,
          totalSeconds: data.best_day.total_seconds,
        }
      : null,
  };

  cacheManager.set(cacheKey, wakatimeData, 'wakatime');

  return wakatimeData;
}
