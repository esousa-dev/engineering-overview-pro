import { graphql } from '@octokit/graphql';
import { z } from 'zod';
import { retryWithBackoff } from '../common/retryer.js';
import { cacheManager } from '../common/cache.js';
import { ACTIVITY_MAIN_QUERY, ACTIVITY_PAGINATION_QUERY } from '../graphql/github-queries.js';
import type { ActivityData, ContributionLevel } from '../types/index.js';

/**
 * Zod schemas — repos only need stars/forks (no language edges)
 */
const RepoNodeSchema = z.object({
  isFork: z.boolean(),
  isArchived: z.boolean(),
  stargazerCount: z.number(),
  forkCount: z.number(),
});

const ActivityResponseSchema = z.object({
  user: z
    .object({
      contributionsCollection: z.object({
        contributionCalendar: z.object({
          totalContributions: z.number(),
          weeks: z.array(
            z.object({
              contributionDays: z.array(
                z.object({
                  contributionCount: z.number(),
                  contributionLevel: z.string() as z.ZodType<ContributionLevel>,
                  date: z.string(),
                }),
              ),
            }),
          ),
        }),
        totalCommitContributions: z.number(),
        totalIssueContributions: z.number(),
        totalPullRequestContributions: z.number(),
        totalPullRequestReviewContributions: z.number(),
        totalRepositoriesWithContributedCommits: z.number(),
      }),
      repositories: z.object({
        pageInfo: z.object({
          hasNextPage: z.boolean(),
          endCursor: z.string().nullable(),
        }),
        nodes: z.array(RepoNodeSchema),
      }),
    })
    .nullable(),
});

const PaginationResponseSchema = z.object({
  user: z.object({
    repositories: z.object({
      pageInfo: z.object({
        hasNextPage: z.boolean(),
        endCursor: z.string().nullable(),
      }),
      nodes: z.array(RepoNodeSchema),
    }),
  }),
});

/**
 * Fetches contribution calendar, radar stats, and stars/forks.
 * Results are cached by username — theme/locale-specific SVG rendering
 * is handled by the route handler, which has its own SVG-level cache.
 *
 * Language data is NOT fetched here — the route handler composes it
 * by calling `fetchTopLanguages` separately, reusing the same pipeline
 * that powers the Top Languages card.
 */
export async function fetchActivity(username: string): Promise<Omit<ActivityData, 'languages'>> {
  const cacheKey = cacheManager.buildKey('activity', username);

  return cacheManager.getOrFetch<Omit<ActivityData, 'languages'>>(
    cacheKey,
    async () => {
      let calendar: ActivityData['weeks'] = [];
      let totalContribs = 0;
      let stats = { commits: 0, issues: 0, pullRequests: 0, reviews: 0, repos: 0 };

      const allRepoNodes: z.infer<typeof RepoNodeSchema>[] = [];
      let hasNextPage = true;
      let cursor: string | null = null;
      let pageCount = 0;
      const MAX_PAGES = 10;

      while (hasNextPage && pageCount < MAX_PAGES) {
        const isFirstPage = pageCount === 0;

        const data = await retryWithBackoff(async (token: string) => {
          const response: unknown = await graphql(
            isFirstPage ? ACTIVITY_MAIN_QUERY : ACTIVITY_PAGINATION_QUERY,
            {
              login: username,
              after: cursor,
              headers: { authorization: `Bearer ${token}` },
            },
          );

          return isFirstPage
            ? ActivityResponseSchema.parse(response)
            : PaginationResponseSchema.parse(response);
        });

        if (!data.user) {
          if (isFirstPage) throw new Error(`User "${username}" not found`);
          break;
        }

        if (isFirstPage) {
          const fullData = data as z.infer<typeof ActivityResponseSchema>;
          if (!fullData.user) throw new Error(`User "${username}" not found`);
          const collection = fullData.user.contributionsCollection;
          calendar = collection.contributionCalendar.weeks;
          totalContribs = collection.contributionCalendar.totalContributions;
          stats = {
            commits: collection.totalCommitContributions,
            issues: collection.totalIssueContributions,
            pullRequests: collection.totalPullRequestContributions,
            reviews: collection.totalPullRequestReviewContributions,
            repos: collection.totalRepositoriesWithContributedCommits,
          };
        }

        allRepoNodes.push(...data.user.repositories.nodes);
        hasNextPage = data.user.repositories.pageInfo.hasNextPage;
        cursor = data.user.repositories.pageInfo.endCursor;
        pageCount++;
      }

      let totalStars = 0;
      let totalForks = 0;

      for (const repo of allRepoNodes) {
        if (repo.isArchived) continue;
        totalStars += repo.stargazerCount;
        totalForks += repo.forkCount;
      }

      return {
        totalContributions: totalContribs,
        weeks: calendar,
        stats,
        summary: { totalStars, totalForks },
      };
    },
    'activity',
  );
}
