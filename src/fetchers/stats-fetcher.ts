// ============================================================
// Stats fetcher — GitHub GraphQL API
// ============================================================

import { graphql } from '@octokit/graphql';
import { z } from 'zod';

import { retryWithBackoff } from '../common/retryer.js';
import { cacheManager } from '../common/cache.js';
import { STATS_QUERY } from '../graphql/github-queries.js';

import type { UserStats, RankInfo, RankLevel } from '../types/index.js';

// --- Zod validation for GraphQL response ---

const RepoNodeSchema = z.object({
  stargazerCount: z.number(),
  isArchived: z.boolean(),
  isFork: z.boolean(),
  isPrivate: z.boolean(),
});

const GraphQLResponseSchema = z.object({
  user: z
    .object({
      name: z.string().nullable(),
      login: z.string(),
      repositories: z.object({
        totalCount: z.number(),
        nodes: z.array(RepoNodeSchema),
        pageInfo: z.object({
          hasNextPage: z.boolean(),
          endCursor: z.string().nullable(),
        }),
      }),
      pullRequests: z.object({ totalCount: z.number() }),
      issues: z.object({ totalCount: z.number() }),
      contributionsCollection: z.object({
        totalCommitContributions: z.number(),
        restrictedContributionsCount: z.number(),
        totalRepositoriesWithContributedCommits: z.number(),
      }),
      repositoriesContributedTo: z.object({ totalCount: z.number() }),
      followers: z.object({ totalCount: z.number() }),
    })
    .nullable(),
});

// --- Rank calculation ---

function calculateRank(
  totalStars: number,
  totalCommits: number,
  totalPRs: number,
  totalIssues: number,
  totalContributions: number,
): RankInfo {
  // Weighted score based on contribution metrics (Adjusted for student/individual reality)
  const STAR_WEIGHT = 2;
  const COMMIT_WEIGHT = 2; // Valorizando o esforço diário de estudos
  const PR_WEIGHT = 3;
  const ISSUE_WEIGHT = 2; // Valorizando uso de issues para organização
  const CONTRIB_WEIGHT = 1;

  const score =
    totalStars * STAR_WEIGHT +
    totalCommits * COMMIT_WEIGHT +
    totalPRs * PR_WEIGHT +
    totalIssues * ISSUE_WEIGHT +
    totalContributions * CONTRIB_WEIGHT;

  // Percentile-based rank levels (Scaled down for solo/student developers)
  let level: RankLevel;
  let percentile: number;

  if (score >= 10_000) {
    level = 'S+';
    percentile = 1;
  } else if (score >= 5_000) {
    level = 'S';
    percentile = 5;
  } else if (score >= 2_500) {
    level = 'A++';
    percentile = 10;
  } else if (score >= 1_000) {
    level = 'A+';
    percentile = 15;
  } else if (score >= 500) {
    level = 'A';
    percentile = 25;
  } else if (score >= 250) {
    level = 'B+';
    percentile = 40;
  } else if (score >= 100) {
    level = 'B';
    percentile = 60;
  } else {
    level = 'C';
    percentile = 80;
  }

  return { level, percentile, score };
}

// --- Fetcher ---

interface FetchStatsOptions {
  readonly includePrivate: boolean;
  readonly includeArchived: boolean;
  readonly includeForks: boolean;
}

const DEFAULT_OPTIONS: FetchStatsOptions = {
  includePrivate: false,
  includeArchived: true,
  includeForks: false,
};

/**
 * Fetch user stats from GitHub GraphQL API.
 * Validates response with Zod, calculates rank, applies filters.
 */
export async function fetchStats(
  username: string,
  options: Partial<FetchStatsOptions> = {},
): Promise<UserStats> {
  const opts: FetchStatsOptions = { ...DEFAULT_OPTIONS, ...options };

  // Check cache first
  const cacheKey = cacheManager.buildKey('stats', username, { ...opts });
  const cached = cacheManager.get<UserStats>(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const data = await retryWithBackoff(async (token: string) => {
    const response: unknown = await graphql(STATS_QUERY, {
      login: username,
      headers: { authorization: `Bearer ${token}` },
    });

    return GraphQLResponseSchema.parse(response);
  });

  if (data.user === null) {
    throw new Error(`User "${username}" not found.`);
  }

  const { user } = data;

  // Calculate total stars with filters
  const totalStars = user.repositories.nodes
    .filter((repo) => {
      if (!opts.includeArchived && repo.isArchived) return false;
      if (!opts.includeForks && repo.isFork) return false;
      if (!opts.includePrivate && repo.isPrivate) return false;
      return true;
    })
    .reduce((sum, repo) => sum + repo.stargazerCount, 0);

  const totalCommits =
    user.contributionsCollection.totalCommitContributions +
    (opts.includePrivate ? user.contributionsCollection.restrictedContributionsCount : 0);

  const totalPRs = user.pullRequests.totalCount;
  const totalIssues = user.issues.totalCount;
  const totalContributions = user.repositoriesContributedTo.totalCount;

  const totalRepos = user.repositories.totalCount;
  const activeRepos = user.contributionsCollection.totalRepositoriesWithContributedCommits;
  const followers = user.followers.totalCount;

  const rank = calculateRank(totalStars, totalCommits, totalPRs, totalIssues, totalContributions);

  const stats: UserStats = {
    username: user.login,
    totalStars,
    totalCommits,
    totalPRs,
    totalIssues,
    totalContributions,
    totalRepos,
    activeRepos,
    followers,
    rank,
  };

  // Cache successful result
  cacheManager.set(cacheKey, stats, 'stats');

  return stats;
}
