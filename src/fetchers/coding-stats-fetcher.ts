// ============================================================
// Internal Coding Stats Fetcher (GitHub Native)
// ============================================================

import { z } from 'zod';
import { retryWithBackoff } from '../common/retryer.js';
import { cacheManager } from '../common/cache.js';
import { getLanguageColor } from '../common/linguist-colors.js';
import type { CodingStatsData, CodingStatsLanguage, CodingStatsProject } from '../types/index.js';

const GITHUB_REST_API = 'https://api.github.com';
const SESSION_GAP_MIN = 15 * 60; // 15 min minimum
const SESSION_GAP_MAX = 12 * 3600; // 12 hours max (user request)
const BASE_EVENT_TIME = 5 * 60; // 5 minutes base per event
const MAX_EVENT_TIME = 30 * 60; // 30 minutes cap per single event
const MAX_SESSION_SECONDS = 12 * 3600; // 12 hours cap for a total session
const TIMEZONE_OFFSET = -3; // UTC-3

// --- Weights ---
const WEIGHTS = {
  PushEvent: 1.0,
  PullRequestEvent: 1.2, // Own PR activity is high signal
  PullRequestReviewEvent: 0.8, // Reading code
  IssueCommentEvent: 0.4, // Discussion
  CreateEvent: 0.6, // Branch/Tag creation
};

// --- Schemas ---

const GithubEventSchema = z.object({
  type: z.string(),
  created_at: z.string(),
  repo: z.object({
    name: z.string(),
    url: z.string(),
  }),
  payload: z.object({
    size: z.number().optional(), // commit count in PushEvent
    action: z.string().optional(),
    pull_request: z.object({
      additions: z.number().optional(),
      deletions: z.number().optional(),
    }).optional(),
  }).optional(),
});

const RepoLanguagesSchema = z.record(z.string(), z.number());

/**
 * Fetch and calculate internal coding stats based on GitHub activity.
 */
export async function fetchInternalCodingStats(username: string): Promise<CodingStatsData> {
  const cacheKey = cacheManager.buildKey('coding-stats', username, {});
  const cached = cacheManager.get<CodingStatsData>(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  // 1. Fetch User Events
  const events = await retryWithBackoff(async (token: string) => {
    const response = await fetch(`${GITHUB_REST_API}/users/${username}/events/public?per_page=100`, {
      headers: {
        Authorization: `token ${token}`,
        'User-Agent': 'Antigravity-GitHub-Stats',
      },
    });

    if (!response.ok) {
      if (response.status === 404) throw new Error(`User "${username}" not found.`);
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const data: unknown = await response.json();
    return z.array(GithubEventSchema).parse(data);
  });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const filteredEvents = events
    .filter((e) => {
      const isRecent = new Date(e.created_at) >= sevenDaysAgo;
      const isValidType = Object.keys(WEIGHTS).includes(e.type);
      return isRecent && isValidType;
    })
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  if (filteredEvents.length === 0) {
    return {
      totalSeconds: 0,
      dailyAverageSeconds: 0,
      sessions: 0,
      activeDays: 0,
      languages: [],
      projects: [],
    };
  }

  // --- Step 1.5: Calculate Adaptive Gap ---
  let adaptiveGap = SESSION_GAP_MIN;
  if (filteredEvents.length > 5) {
    const intervals: number[] = [];
    for (let i = 1; i < filteredEvents.length; i++) {
        const current = filteredEvents[i];
        const prev = filteredEvents[i - 1];
        if (current && prev) {
          const diff = (new Date(current.created_at).getTime() - new Date(prev.created_at).getTime()) / 1000;
          if (diff > 0 && diff < 3600) intervals.push(diff);
        }
    }
    if (intervals.length > 0) {
      intervals.sort((a, b) => a - b);
      const median = intervals[Math.floor(intervals.length / 2)] || SESSION_GAP_MIN;
      adaptiveGap = Math.min(Math.max(median * 1.5, SESSION_GAP_MIN), SESSION_GAP_MAX);
    }
  }

  // 2. Cluster into Sessions
  let totalSeconds = 0;
  let sessionsCount = 0;
  let currentSessionStart: Date | null = null;
  let lastEventTime: Date | null = null;
  const projectStats = new Map<string, { pushCount: number; seconds: number; lastActivity: string }>();
  const activeDaysSet = new Set<string>();

  for (const event of filteredEvents) {
    const eventTime = new Date(event.created_at);
    // Adjust to local time before extracting the date string
    const localTime = new Date(eventTime.getTime() + TIMEZONE_OFFSET * 3600 * 1000);
    const dateString = localTime.toISOString().split('T')[0];
    if (dateString) activeDaysSet.add(dateString);
    
    // Calculate Event Estimated Time
    const type = event.type as keyof typeof WEIGHTS;
    const weight = WEIGHTS[type] || 0.5;
    
    // Scaled padding
    let eventDuration = BASE_EVENT_TIME;
    if (type === 'PushEvent') {
      const commitCount = event.payload?.size || 1;
      eventDuration += commitCount * 120; // +2m per commit
    } else if (type === 'PullRequestEvent') {
      const additions = event.payload?.pull_request?.additions || 0;
      const deletions = event.payload?.pull_request?.deletions || 0;
      eventDuration += (additions + deletions) * 0.5; // +0.5s per line
    }
    
    // Time-of-day Heuristic (Night mode 2am-6am gets 0.5x)
    // Apply timezone offset for correct hour detection
    const localEventTime = new Date(eventTime.getTime() + TIMEZONE_OFFSET * 3600 * 1000);
    const hour = localEventTime.getUTCHours();
    if (hour >= 2 && hour <= 6) {
        eventDuration *= 0.5;
    }
    
    const weightedEventTime = Math.min(eventDuration * weight, MAX_EVENT_TIME);

    const repoName = event.repo.name;
    const stats = projectStats.get(repoName) || { pushCount: 0, seconds: 0, lastActivity: event.created_at };
    stats.pushCount += (type === 'PushEvent' ? 1 : 0.2); // Weighted project activity
    stats.seconds += weightedEventTime;
    
    // Update last activity if this event is more recent
    if (new Date(event.created_at) > new Date(stats.lastActivity)) {
      stats.lastActivity = event.created_at;
    }
    
    projectStats.set(repoName, stats);

    if (!currentSessionStart || !lastEventTime) {
      currentSessionStart = eventTime;
      lastEventTime = eventTime;
      sessionsCount += 1;
      continue;
    }

    const gap = (eventTime.getTime() - lastEventTime.getTime()) / 1000;

    if (gap <= adaptiveGap) {
      // Continue session
      const sessionDuration = (eventTime.getTime() - currentSessionStart.getTime()) / 1000;
      if (sessionDuration > MAX_SESSION_SECONDS) {
        totalSeconds += MAX_SESSION_SECONDS;
        currentSessionStart = eventTime;
        sessionsCount += 1;
      }
    } else {
      // New session
      const finalSessionDuration = (lastEventTime.getTime() - currentSessionStart.getTime()) / 1000 + weightedEventTime;
      totalSeconds += Math.min(finalSessionDuration, MAX_SESSION_SECONDS);
      
      currentSessionStart = eventTime;
      sessionsCount += 1;
    }
    lastEventTime = eventTime;
  }

  // Add the last session
  if (currentSessionStart && lastEventTime) {
    const finalSessionDuration = (lastEventTime.getTime() - currentSessionStart.getTime()) / 1000 + BASE_EVENT_TIME;
    totalSeconds += Math.min(finalSessionDuration, MAX_SESSION_SECONDS);
  }

  // 3. Aggregate Languages for involved Repos
  const repoLanguages = new Map<string, Record<string, number>>();
  // Sort repos by activity to ensure we get colors for the ones we actually display
  const sortedRepos = Array.from(projectStats.entries())
    .sort(([, a], [, b]) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
    .map(([name]) => name);
    
  const repoList = sortedRepos.slice(0, 15); // Increased limit to 15

  await Promise.all(
    repoList.map(async (repoFull) => {
      try {
        const langs = await retryWithBackoff(async (token: string) => {
          const res = await fetch(`${GITHUB_REST_API}/repos/${repoFull}/languages`, {
            headers: { Authorization: `token ${token}`, 'User-Agent': 'Antigravity-GitHub-Stats' },
          });
          if (!res.ok) return {};
          return RepoLanguagesSchema.parse(await res.json());
        });
        repoLanguages.set(repoFull, langs);
      } catch {
        // Skip failed repos
      }
    }),
  );

  // 3. Identify Top 5 Projects (intermediate type to hold fullName)
  interface IntermediateProject extends CodingStatsProject {
    fullName: string;
  }

  const projects: IntermediateProject[] = Array.from(projectStats.entries())
    .map(([name, stats]) => {
      const langs = repoLanguages.get(name) || {};
      const sortedLangs = Object.entries(langs).sort(([, a], [, b]) => b - a);
      const primaryLang = sortedLangs[0]?.[0] || 'Unknown';
      
      return {
        fullName: name,
        name: name.split('/')[1] || name,
        pushCount: Math.round(stats.pushCount),
        estimatedSeconds: (stats.pushCount / filteredEvents.length) * totalSeconds,
        lastActivity: stats.lastActivity,
        color: getLanguageColor(primaryLang),
      };
    })
    .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
    .slice(0, 5);

  // 4. Aggregate Languages ONLY for these Top 5 Projects
  const globalLangs = new Map<string, number>();
  for (const project of projects) {
    const langs = repoLanguages.get(project.fullName) || {};
    const weight = project.pushCount || 1;
    for (const [lang, bytes] of Object.entries(langs)) {
      const current = globalLangs.get(lang) || 0;
      globalLangs.set(lang, current + bytes * weight);
    }
  }

  const totalBytes = Array.from(globalLangs.values()).reduce((a, b) => a + b, 0);
  const languages: CodingStatsLanguage[] = Array.from(globalLangs.entries())
    .map(([name, bytes]) => ({
      name,
      percent: totalBytes > 0 ? (bytes / totalBytes) * 100 : 0,
      seconds: totalBytes > 0 ? (bytes / totalBytes) * totalSeconds : 0,
      color: getLanguageColor(name),
    }))
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 5);

  const data: CodingStatsData = {
    totalSeconds: Math.round(totalSeconds),
    dailyAverageSeconds: Math.round(totalSeconds / (activeDaysSet.size || 1)),
    sessions: sessionsCount,
    activeDays: activeDaysSet.size,
    languages,
    projects: projects.map(({ fullName: _, ...p }) => p as CodingStatsProject),
  };

  cacheManager.set(cacheKey, data, 'wakatime'); // Use wakatime TTL
  return data;
}
