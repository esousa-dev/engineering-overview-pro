import { z } from 'zod';
import { graphql } from '@octokit/graphql';
import { retryWithBackoff } from '../common/retryer.js';
import { sanitizeSvgColor } from '../common/utils.js';
import { PINNED_REPOS_QUERY, REPO_INFO_QUERY } from '../graphql/github-queries.js';
import type { PinData } from '../types/index.js';

/**
 * Zod schema for single repository data
 */
const RepoResponseSchema = z.object({
  repository: z
    .object(
      {
        name: z.string(),
        owner: z.object({
          login: z.string(),
        }),
        description: z.string().nullable(),
        primaryLanguage: z
          .object({
            name: z.string(),
            color: z.string().nullable(),
          })
          .nullable(),
        stargazerCount: z.number({ required_error: 'stargazerCount is required' }),
        forkCount: z.number({ required_error: 'forkCount is required' }),
        isArchived: z.boolean({ required_error: 'isArchived is required' }),
        isFork: z.boolean({ required_error: 'isFork is required' }),
        isPrivate: z.boolean({ required_error: 'isPrivate is required' }),
      },
      { required_error: 'repository object is required' },
    )
    .nullable(),
});

/**
 * Zod schema for pinned repositories response
 */
const PinnedReposSchema = z.object({
  user: z
    .object({
      pinnedItems: z.object({
        nodes: z.array(
          z.object({
            name: z.string(),
            owner: z.object({
              login: z.string(),
            }),
            description: z.string().nullable(),
            primaryLanguage: z
              .object({
                name: z.string(),
                color: z.string().nullable(),
              })
              .nullable(),
            stargazerCount: z.number(),
            forkCount: z.number(),
            isArchived: z.boolean(),
            isFork: z.boolean(),
            isPrivate: z.boolean(),
          }),
        ),
      }),
    })
    .nullable(),
});

/**
 * Fetches all pinned repositories from a GitHub profile.
 */
export async function fetchPinnedRepos(username: string): Promise<PinData[]> {
  const login = username;

  const data = await retryWithBackoff(async (token: string) => {
    const response: unknown = await graphql(PINNED_REPOS_QUERY, {
      login,
      headers: { authorization: `Bearer ${token}` },
    });
    return PinnedReposSchema.parse(response);
  });

  if (!data.user) {
    throw new Error(`User "${login}" not found.`);
  }

  const nodes = data.user.pinnedItems.nodes;

  if (nodes.length === 0) {
    throw new Error(`User "${login}" has no pinned repositories.`);
  }

  return nodes.map((repo) => ({
    name: repo.name,
    owner: repo.owner.login,
    description: repo.description || '',
    primaryLanguage: repo.primaryLanguage
      ? {
          name: repo.primaryLanguage.name,
          color: sanitizeSvgColor(repo.primaryLanguage.color, '#858585'),
        }
      : null,
    stargazerCount: repo.stargazerCount,
    forkCount: repo.forkCount,
    isArchived: repo.isArchived,
    isFork: repo.isFork,
    isPrivate: repo.isPrivate,
  }));
}

/**
 * Fetches data for a single repository to be used in the Pin Card.
 */
export async function fetchRepo(username: string, repo: string): Promise<PinData> {
  const data = await retryWithBackoff(async (token: string) => {
    const response: unknown = await graphql(REPO_INFO_QUERY, {
      login: username,
      repo,
      headers: { authorization: `Bearer ${token}` },
    });
    return RepoResponseSchema.parse(response);
  });

  if (!data.repository) {
    throw new Error(`Repository "${username}/${repo}" not found or is private.`);
  }

  const { repository } = data;

  return {
    name: repository.name,
    owner: repository.owner.login,
    description: repository.description || '',
    primaryLanguage: repository.primaryLanguage
      ? {
          name: repository.primaryLanguage.name,
          color: sanitizeSvgColor(repository.primaryLanguage.color, '#858585'),
        }
      : null,
    stargazerCount: repository.stargazerCount,
    forkCount: repository.forkCount,
    isArchived: repository.isArchived,
    isFork: repository.isFork,
    isPrivate: repository.isPrivate,
  };
}
