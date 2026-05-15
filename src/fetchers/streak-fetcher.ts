// ============================================================
// Streak fetcher
// ============================================================

import { graphql } from '@octokit/graphql';
import { z } from 'zod';

import { retryWithBackoff } from '../common/retryer.js';
import { cacheManager } from '../common/cache.js';
import { STREAK_QUERY } from '../graphql/github-queries.js';
import { formatISO, startOfDay, parseISO } from 'date-fns';

export interface StreakStats {
  totalContributions: number;
  firstContribution: string;
  currentStreak: {
    start: string;
    end: string;
    length: number;
  };
  longestStreak: {
    start: string;
    end: string;
    length: number;
  };
}

// --- GraphQL Schemas ---

const ContributionDaySchema = z.object({
  date: z.string(),
  contributionCount: z.number(),
});

const ContributionWeekSchema = z.object({
  contributionDays: z.array(ContributionDaySchema),
});

const ContributionsCollectionSchema = z.object({
  contributionCalendar: z.object({
    totalContributions: z.number(),
    weeks: z.array(ContributionWeekSchema),
  }),
});

const UserContributionSchema = z.object({
  user: z.object({
    createdAt: z.string(),
    contributionsCollection: ContributionsCollectionSchema,
  }),
});

// --- Fetcher Options ---

interface FetchStreakOptions {
  readonly hideCurrentStreak?: boolean;
  readonly hideLongestStreak?: boolean;
}

// --- Helper Functions ---

interface StreakSegment {
  start: string;
  end: string;
  length: number;
}

function findLongestStreak(
  days: { date: string; count: number }[],
): StreakSegment & { totalContributions: number; firstContribution: string } {
  let totalContributions = 0;
  let firstContribution = '';
  let longestStart = '';
  let longestEnd = '';
  let longestLength = 0;
  let tempStart = '';
  let tempLength = 0;

  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    if (!day) break;
    if (day.count > 0) {
      totalContributions += day.count;
      if (!firstContribution) firstContribution = day.date;
      if (tempLength === 0) tempStart = day.date;
      tempLength++;
    } else {
      if (tempLength > longestLength) {
        longestLength = tempLength;
        longestStart = tempStart;
        longestEnd = days[i - 1]?.date ?? '';
      }
      tempLength = 0;
    }
  }

  if (tempLength > longestLength) {
    longestLength = tempLength;
    longestStart = tempStart;
    longestEnd = days[days.length - 1]?.date ?? '';
  }

  return {
    start: longestStart,
    end: longestEnd,
    length: longestLength,
    totalContributions,
    firstContribution,
  };
}

function findCurrentStreak(days: { date: string; count: number }[]): StreakSegment {
  const today = startOfDay(new Date());
  let start = '';
  let end = '';
  let length = 0;

  for (let i = days.length - 1; i >= 0; i--) {
    const day = days[i];
    if (!day) break;
    const date = startOfDay(parseISO(day.date));

    // Allow today to be zero (user hasn't contributed yet today)
    if (day.count === 0 && date.getTime() !== today.getTime()) break;

    if (day.count > 0) {
      if (length === 0) end = day.date;
      start = day.date;
      length++;
    }
  }

  return { start, end, length };
}

/**
 * Calculates streak metrics given an array of contribution days sorted chronologically.
 */
function calculateStreaks(contributionDays: { date: string; count: number }[]): StreakStats {
  const fallbackDate = new Date().toISOString().split('T')[0] ?? '';
  const longest = findLongestStreak(contributionDays);
  const current = findCurrentStreak(contributionDays);

  return {
    totalContributions: longest.totalContributions,
    firstContribution: longest.firstContribution || fallbackDate,
    currentStreak: {
      start: current.start || fallbackDate,
      end: current.end || fallbackDate,
      length: current.length,
    },
    longestStreak: {
      start: longest.start || fallbackDate,
      end: longest.end || fallbackDate,
      length: longest.length,
    },
  };
}

// --- Fetcher ---

/**
 * Fetch stats for the Streak card.
 * Reads contributions from today back to the user's creation year.
 * The current year is fetched first (to get createdAt), then previous
 * years are fetched concurrently — avoiding a redundant duplicate fetch.
 */
export async function fetchStreakStats(
  username: string,
  _options: FetchStreakOptions = {},
): Promise<StreakStats> {
  const cacheKey = cacheManager.buildKey('streak', username);

  return cacheManager.getOrFetch<StreakStats>(
    cacheKey,
    async () => {
      const now = new Date();
      const currentYear = now.getFullYear();

      // Fetch Jan 1 → today to get createdAt AND current-year contribution data.
      // This avoids re-fetching the current year in the concurrent batch below.
      const initialData = await retryWithBackoff(async (token: string) => {
        const rawData = await graphql(STREAK_QUERY, {
          login: username,
          from: formatISO(new Date(currentYear, 0, 1)),
          to: formatISO(now),
          headers: { authorization: `Bearer ${token}` },
        });
        return UserContributionSchema.parse(rawData);
      });

      const createdAt = parseISO(initialData.user.createdAt);
      const startYear = createdAt.getFullYear();

      const allContributionDays: { date: string; count: number }[] = [];

      // Collect current-year days from the initial fetch
      for (const week of initialData.user.contributionsCollection.contributionCalendar.weeks) {
        for (const day of week.contributionDays) {
          allContributionDays.push({ date: day.date, count: day.contributionCount });
        }
      }

      // Fetch previous years concurrently (current year already covered above)
      const fetchPromises: Promise<z.infer<typeof UserContributionSchema>>[] = [];

      for (let year = currentYear - 1; year >= startYear; year--) {
        const fromDate = year === startYear ? createdAt : new Date(year, 0, 1);
        const toDate = new Date(year, 11, 31, 23, 59, 59);

        fetchPromises.push(
          retryWithBackoff(async (token: string) => {
            const rawData = await graphql(STREAK_QUERY, {
              login: username,
              from: formatISO(fromDate),
              to: formatISO(toDate),
              headers: { authorization: `Bearer ${token}` },
            });
            return UserContributionSchema.parse(rawData);
          }),
        );
      }

      const results = await Promise.all(fetchPromises);

      for (const yearData of results) {
        for (const week of yearData.user.contributionsCollection.contributionCalendar.weeks) {
          for (const day of week.contributionDays) {
            allContributionDays.push({ date: day.date, count: day.contributionCount });
          }
        }
      }

      const uniqueDaysMap = new Map<string, number>();
      for (const day of allContributionDays) {
        uniqueDaysMap.set(day.date, day.count);
      }

      const sortedDays = Array.from(uniqueDaysMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return calculateStreaks(sortedDays);
    },
    'streak',
  );
}
