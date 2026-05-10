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
  payload: z
    .object({
      size: z.number().optional(), // commit count in PushEvent
      action: z.string().optional(),
      pull_request: z
        .object({
          additions: z.number().optional(),
          deletions: z.number().optional(),
        })
        .optional(),
    })
    .optional(),
});

const RepoLanguagesSchema = z.record(z.string(), z.number());

type GithubEvent = z.infer<typeof GithubEventSchema>;

// --- Helpers ---

function calculateAdaptiveGap(events: GithubEvent[]): number {
  if (events.length <= 5) return SESSION_GAP_MIN;
  const intervals: number[] = [];
  for (let i = 1; i < events.length; i++) {
    const current = events[i];
    const prev = events[i - 1];
    if (current && prev) {
      const diff =
        (new Date(current.created_at).getTime() - new Date(prev.created_at).getTime()) / 1000;
      if (diff > 0 && diff < 3600) intervals.push(diff);
    }
  }
  if (intervals.length === 0) return SESSION_GAP_MIN;
  intervals.sort((a, b) => a - b);
  const median = intervals[Math.floor(intervals.length / 2)] ?? SESSION_GAP_MIN;
  return Math.min(Math.max(median * 1.5, SESSION_GAP_MIN), SESSION_GAP_MAX);
}

function calculateEventDuration(event: GithubEvent): number {
  const type = event.type as keyof typeof WEIGHTS;
  const weight = WEIGHTS[type] ?? 0.5;
  let duration = BASE_EVENT_TIME;

  if (type === 'PushEvent') {
    const commitCount = event.payload?.size ?? 1;
    duration += commitCount * 120; // +2m per commit
  } else if (type === 'PullRequestEvent') {
    const additions = event.payload?.pull_request?.additions ?? 0;
    const deletions = event.payload?.pull_request?.deletions ?? 0;
    duration += (additions + deletions) * 0.5; // +0.5s per line
  }

  // Night mode heuristic: 2am-6am (local time) gets 0.5x
  const localTime = new Date(new Date(event.created_at).getTime() + TIMEZONE_OFFSET * 3600 * 1000);
  const hour = localTime.getUTCHours();
  if (hour >= 2 && hour <= 6) duration *= 0.5;

  return Math.min(duration * weight, MAX_EVENT_TIME);
}

interface ProjectAccumulator {
  pushCount: number;
  seconds: number;
  lastActivity: string;
}

interface SessionResult {
  totalSeconds: number;
  sessionsCount: number;
  activeDaysSet: Set<string>;
  projectStats: Map<string, ProjectAccumulator>;
}

function processEventSessions(events: GithubEvent[], adaptiveGap: number): SessionResult {
  let totalSeconds = 0;
  let sessionsCount = 0;
  let currentSessionStart: Date | null = null;
  let lastEventTime: Date | null = null;
  const projectStats = new Map<string, ProjectAccumulator>();
  const activeDaysSet = new Set<string>();

  for (const event of events) {
    const eventTime = new Date(event.created_at);
    const localTime = new Date(eventTime.getTime() + TIMEZONE_OFFSET * 3600 * 1000);
    const dateString = localTime.toISOString().split('T')[0];
    if (dateString) activeDaysSet.add(dateString);

    const type = event.type as keyof typeof WEIGHTS;
    const weightedEventTime = calculateEventDuration(event);

    const repoName = event.repo.name;
    const stats = projectStats.get(repoName) ?? { pushCount: 0, seconds: 0, lastActivity: event.created_at };
    stats.pushCount += type === 'PushEvent' ? 1 : 0.2;
    stats.seconds += weightedEventTime;
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
      const sessionDuration = (eventTime.getTime() - currentSessionStart.getTime()) / 1000;
      if (sessionDuration > MAX_SESSION_SECONDS) {
        totalSeconds += MAX_SESSION_SECONDS;
        currentSessionStart = eventTime;
        sessionsCount += 1;
      }
    } else {
      const finalDuration =
        (lastEventTime.getTime() - currentSessionStart.getTime()) / 1000 + weightedEventTime;
      totalSeconds += Math.min(finalDuration, MAX_SESSION_SECONDS);
      currentSessionStart = eventTime;
      sessionsCount += 1;
    }
    lastEventTime = eventTime;
  }

  if (currentSessionStart && lastEventTime) {
    const finalDuration =
      (lastEventTime.getTime() - currentSessionStart.getTime()) / 1000 + BASE_EVENT_TIME;
    totalSeconds += Math.min(finalDuration, MAX_SESSION_SECONDS);
  }

  return { totalSeconds, sessionsCount, activeDaysSet, projectStats };
}

async function fetchRepoLanguages(
  repoList: string[],
): Promise<Map<string, Record<string, number>>> {
  const repoLanguages = new Map<string, Record<string, number>>();
  await Promise.all(
    repoList.map(async (repoFull) => {
      try {
        const langs = await retryWithBackoff(async (token: string) => {
          const res = await fetch(`${GITHUB_REST_API}/repos/${repoFull}/languages`, {
            headers: { Authorization: `token ${token}`, 'User-Agent': 'engineering-overview-pro' },
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
  return repoLanguages;
}

interface IntermediateProject extends CodingStatsProject {
  fullName: string;
}

function buildTopProjects(
  projectStats: Map<string, ProjectAccumulator>,
  repoLanguages: Map<string, Record<string, number>>,
  totalSeconds: number,
  filteredEventsLength: number,
): IntermediateProject[] {
  return Array.from(projectStats.entries())
    .map(([name, stats]) => {
      const langs = repoLanguages.get(name) ?? {};
      const sortedLangs = Object.entries(langs).sort(([, a], [, b]) => b - a);
      const primaryLang = sortedLangs[0]?.[0] ?? 'Unknown';
      return {
        fullName: name,
        name: name.split('/')[1] ?? name,
        pushCount: Math.round(stats.pushCount),
        estimatedSeconds: (stats.pushCount / filteredEventsLength) * totalSeconds,
        lastActivity: stats.lastActivity,
        color: getLanguageColor(primaryLang),
      };
    })
    .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
    .slice(0, 5);
}

function aggregateLanguages(
  projects: IntermediateProject[],
  repoLanguages: Map<string, Record<string, number>>,
  totalSeconds: number,
): CodingStatsLanguage[] {
  const globalLangs = new Map<string, number>();
  for (const project of projects) {
    const langs = repoLanguages.get(project.fullName) ?? {};
    const weight = project.pushCount || 1;
    for (const [lang, bytes] of Object.entries(langs)) {
      globalLangs.set(lang, (globalLangs.get(lang) ?? 0) + bytes * weight);
    }
  }
  const totalBytes = Array.from(globalLangs.values()).reduce((a, b) => a + b, 0);
  return Array.from(globalLangs.entries())
    .map(([name, bytes]) => ({
      name,
      percent: totalBytes > 0 ? (bytes / totalBytes) * 100 : 0,
      seconds: totalBytes > 0 ? (bytes / totalBytes) * totalSeconds : 0,
      color: getLanguageColor(name),
    }))
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 5);
}

/**
 * Fetch and calculate internal coding stats based on GitHub activity.
 */
export async function fetchInternalCodingStats(username: string): Promise<CodingStatsData> {
  const cacheKey = cacheManager.buildKey('coding-stats', username, {});
  const cached = cacheManager.get<CodingStatsData>(cacheKey);
  if (cached !== undefined) return cached;

  const events = await retryWithBackoff(async (token: string) => {
    const response = await fetch(
      `${GITHUB_REST_API}/users/${username}/events/public?per_page=100`,
      {
        headers: {
          Authorization: `token ${token}`,
          'User-Agent': 'engineering-overview-pro',
        },
      },
    );
    if (!response.ok) {
      if (response.status === 404) throw new Error(`User "${username}" not found.`);
      throw new Error(`GitHub API error: ${response.statusText}`);
    }
    return z.array(GithubEventSchema).parse(await response.json());
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
    return { totalSeconds: 0, dailyAverageSeconds: 0, sessions: 0, activeDays: 0, languages: [], projects: [] };
  }

  const adaptiveGap = calculateAdaptiveGap(filteredEvents);
  const { totalSeconds, sessionsCount, activeDaysSet, projectStats } = processEventSessions(
    filteredEvents,
    adaptiveGap,
  );

  const sortedRepos = Array.from(projectStats.entries())
    .sort(([, a], [, b]) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
    .map(([name]) => name)
    .slice(0, 15);

  const repoLanguages = await fetchRepoLanguages(sortedRepos);

  const projects = buildTopProjects(projectStats, repoLanguages, totalSeconds, filteredEvents.length);
  const languages = aggregateLanguages(projects, repoLanguages, totalSeconds);

  const data: CodingStatsData = {
    totalSeconds: Math.round(totalSeconds),
    dailyAverageSeconds: Math.round(totalSeconds / (activeDaysSet.size || 1)),
    sessions: sessionsCount,
    activeDays: activeDaysSet.size,
    languages,
    projects: projects.map(({ fullName: _, ...p }) => p as CodingStatsProject),
  };

  cacheManager.set(cacheKey, data, 'wakatime');
  return data;
}
