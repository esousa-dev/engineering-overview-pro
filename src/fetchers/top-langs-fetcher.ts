// ============================================================
// Top Languages fetcher — GitHub GraphQL API
// ============================================================

import { graphql } from '@octokit/graphql';
import { z } from 'zod';

import { retryWithBackoff } from '../common/retryer.js';
import { cacheManager } from '../common/cache.js';
import { sanitizeSvgColor } from '../common/utils.js';
import { TOP_LANGS_QUERY } from '../graphql/github-queries.js';

import type { LanguageData } from '../types/index.js';

// --- Zod validation for GraphQL response ---

const LanguageEdgeSchema = z.object({
  size: z.number(),
  node: z.object({
    color: z.string().nullable(),
    name: z.string(),
  }),
});

const RepoNodeSchema = z.object({
  isArchived: z.boolean(),
  isFork: z.boolean(),
  isPrivate: z.boolean(),
  languages: z
    .object({
      edges: z.array(LanguageEdgeSchema),
    })
    .nullable(),
});

const GraphQLResponseSchema = z.object({
  user: z
    .object({
      repositories: z.object({
        nodes: z.array(RepoNodeSchema),
        pageInfo: z.object({
          hasNextPage: z.boolean(),
          endCursor: z.string().nullable(),
        }),
      }),
    })
    .nullable(),
});

// --- Fetcher Options ---

interface FetchTopLangsOptions {
  readonly includePrivate: boolean;
  readonly includeArchived: boolean;
  readonly hideLanguages: ReadonlyArray<string>;
  readonly limit: number;
}

const DEFAULT_OPTIONS: FetchTopLangsOptions = {
  includePrivate: false,
  includeArchived: true,
  hideLanguages: [],
  limit: 5,
};

// --- Fetcher ---

/**
 * Fetch top languages from GitHub GraphQL API.
 * Validates response with Zod, aggregates languages sizes, and calculates percentages.
 */
export async function fetchTopLanguages(
  username: string,
  options: Partial<FetchTopLangsOptions> = {},
): Promise<ReadonlyArray<LanguageData>> {
  const opts: FetchTopLangsOptions = { ...DEFAULT_OPTIONS, ...options };
  const cacheKey = cacheManager.buildKey('top-langs', username, { ...opts });

  return cacheManager.getOrFetch<ReadonlyArray<LanguageData>>(
    cacheKey,
    async () => {
      const allRepoNodes: z.infer<typeof RepoNodeSchema>[] = [];
      let hasNextPage = true;
      let cursor: string | null = null;

      // Pagination loop (up to a reasonable limit to prevent endless fetching on massive accounts)
      let pageCount = 0;
      const MAX_PAGES = 10;

      while (hasNextPage && pageCount < MAX_PAGES) {
        const data = await retryWithBackoff(async (token: string) => {
          const response: unknown = await graphql(TOP_LANGS_QUERY, {
            login: username,
            after: cursor,
            headers: { authorization: `Bearer ${token}` },
          });
          return GraphQLResponseSchema.parse(response);
        });

        if (data.user === null) {
          throw new Error(`User "${username}" not found.`);
        }

        allRepoNodes.push(...data.user.repositories.nodes);
        hasNextPage = data.user.repositories.pageInfo.hasNextPage;
        cursor = data.user.repositories.pageInfo.endCursor;
        pageCount++;
      }

      const langMap = new Map<string, { size: number; count: number; color: string }>();
      const hideSet = new Set(opts.hideLanguages.map((l) => l.toLowerCase()));

      for (const repo of allRepoNodes) {
        if (!opts.includeArchived && repo.isArchived) continue;
        if (!opts.includePrivate && repo.isPrivate) continue;
        if (repo.languages === null) continue;

        for (const edge of repo.languages.edges) {
          const langName = edge.node.name;
          if (hideSet.has(langName.toLowerCase())) continue;

          const langColor = sanitizeSvgColor(edge.node.color, '#858585');
          const existing = langMap.get(langName) ?? { size: 0, count: 0, color: langColor };

          langMap.set(langName, {
            size: existing.size + edge.size,
            count: existing.count + 1,
            color: langColor,
          });
        }
      }

      // Percentages based on total size of ALL non-hidden languages for accuracy
      const totalSizeAll = Array.from(langMap.values()).reduce((sum, lang) => sum + lang.size, 0);

      return Array.from(langMap.entries())
        .map(([name, lang]) => ({
          name,
          color: lang.color,
          size: lang.size,
          count: lang.count,
          percentage: totalSizeAll > 0 ? Number(((lang.size / totalSizeAll) * 100).toFixed(2)) : 0,
        }))
        .filter((lang) => lang.percentage >= 1.0)
        .sort((a, b) => b.size - a.size)
        .slice(0, opts.limit);
    },
    'top-langs',
  );
}
