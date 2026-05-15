// ============================================================
// DevOps Fetcher — GitHub Actions + CodeFactor + Security
// ============================================================

import { graphql } from '@octokit/graphql';
import { z } from 'zod';

import { retryWithBackoff } from '../common/retryer.js';
import { cacheManager } from '../common/cache.js';
import { DEVOPS_QUERY } from '../graphql/github-queries.js';
import { fetchCodeFactorGrade } from './codefactor-fetcher.js';

import type { DevOpsData, RankLevel } from '../types/index.js';

// --- Schemas ---

const RepoDevOpsSchema = z.object({
  name: z.string(),
  isPrivate: z.boolean(),
  isArchived: z.boolean(),
  updatedAt: z.string(),
  description: z.string().nullable(),
  repositoryTopics: z.object({ totalCount: z.number() }).nullable(),
  owner: z.object({ login: z.string() }),
  workflows: z
    .object({ entries: z.array(z.object({ name: z.string() })) })
    .nullable()
    .optional(),
  dependabotYml: z.object({ byteSize: z.number() }).nullable().optional(),
  dependabotYaml: z.object({ byteSize: z.number() }).nullable().optional(),
  defaultBranchRef: z
    .object({
      target: z
        .object({
          statusCheckRollup: z
            .object({
              state: z.string(),
            })
            .nullable()
            .optional(),
        })
        .nullable(),
    })
    .nullable(),
});

const DevOpsResponseSchema = z.object({
  user: z
    .object({
      repositories: z.object({
        nodes: z.array(RepoDevOpsSchema),
      }),
    })
    .nullable(),
});

// --- Helper for grading ---

function getRankFromScore(score: number): RankLevel {
  if (score >= 95) return 'S+';
  if (score >= 90) return 'S';
  if (score >= 85) return 'A++';
  if (score >= 80) return 'A+';
  if (score >= 70) return 'A';
  if (score >= 60) return 'B+';
  if (score >= 50) return 'B';
  return 'C';
}

// --- Helpers ---

type RepoNode = z.infer<typeof RepoDevOpsSchema>;

interface RepoMetrics {
  hasActionsCount: number;
  totalRuns: number;
  successfulRuns: number;
  dependabotCount: number;
  archivedRepos: number;
  wellOrganizedCount: number;
}

function countRepoMetrics(allRepos: RepoNode[]): RepoMetrics {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  let hasActionsCount = 0;
  let totalRuns = 0;
  let successfulRuns = 0;
  let dependabotCount = 0;
  let archivedRepos = 0;
  let wellOrganizedCount = 0;

  for (const repo of allRepos) {
    if (repo.workflows?.entries && repo.workflows.entries.length > 0) hasActionsCount++;

    const rollup = repo.defaultBranchRef?.target?.statusCheckRollup;
    if (rollup) {
      totalRuns++;
      if (rollup.state === 'SUCCESS') successfulRuns++;
    }

    if (repo.dependabotYml || repo.dependabotYaml) dependabotCount++;

    if (repo.isArchived) {
      archivedRepos++;
      wellOrganizedCount++; // Archived = properly retired
    } else {
      const isUpdatedRecently = new Date(repo.updatedAt) > oneYearAgo;
      const hasDescription = (repo.description ?? '').trim().length > 0;
      const hasTopics = (repo.repositoryTopics?.totalCount ?? 0) > 0;
      if (isUpdatedRecently && hasDescription && hasTopics) wellOrganizedCount++;
      else if (isUpdatedRecently) wellOrganizedCount += 0.5;
      // inactive > 1yr: no points
    }
  }

  return {
    hasActionsCount,
    totalRuns,
    successfulRuns,
    dependabotCount,
    archivedRepos,
    wellOrganizedCount,
  };
}

async function calculateCodeFactorResult(
  publicRepos: RepoNode[],
): Promise<{ aPlusCount: number; codeFactorTotal: number }> {
  let aPlusCount = 0;
  let codeFactorTotal = 0;
  const CHUNK_SIZE = 5;

  for (let i = 0; i < publicRepos.length; i += CHUNK_SIZE) {
    const grades = await Promise.all(
      publicRepos
        .slice(i, i + CHUNK_SIZE)
        .map((repo) => fetchCodeFactorGrade(repo.owner.login, repo.name)),
    );
    for (const grade of grades) {
      if (grade) {
        codeFactorTotal++;
        if (grade.toUpperCase() === 'A+') aPlusCount++;
      }
    }
  }

  return { aPlusCount, codeFactorTotal };
}

function computeDevOpsResult(
  metrics: RepoMetrics,
  codeFactor: { aPlusCount: number; codeFactorTotal: number },
  totalRepos: number,
  publicReposLength: number,
): DevOpsData {
  const {
    hasActionsCount,
    totalRuns,
    successfulRuns,
    dependabotCount,
    archivedRepos,
    wellOrganizedCount,
  } = metrics;
  const { aPlusCount, codeFactorTotal } = codeFactor;

  const actionsImplScore = (hasActionsCount / totalRepos) * 100;
  const successRate =
    totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : hasActionsCount > 0 ? 0 : 100;
  const ciCdScore = actionsImplScore * 0.4 + successRate * 0.6;

  const dependabotScore = (dependabotCount / totalRepos) * 100;
  const codeFactorScore = codeFactorTotal > 0 ? (aPlusCount / codeFactorTotal) * 100 : 100;
  const securityScore = dependabotScore * 0.3 + codeFactorScore * 0.7;

  const orgScore = (wellOrganizedCount / totalRepos) * 100;
  const overallScore = (ciCdScore + securityScore + orgScore) / 3;

  return {
    ciCd: { hasActionsCount, totalRuns, successRate, grade: getRankFromScore(ciCdScore) },
    security: {
      dependabotCount,
      codeFactorAPlusCount: aPlusCount,
      codeFactorTotal: publicReposLength,
      advisories: 0, // Removed due to permission issues
      grade: getRankFromScore(securityScore),
    },
    organization: {
      totalRepos,
      archivedRepos,
      wellOrganizedCount: Math.floor(wellOrganizedCount),
      grade: getRankFromScore(orgScore),
    },
    overallGrade: getRankFromScore(overallScore),
  };
}

// --- Implementation ---

export async function fetchDevOps(username: string): Promise<DevOpsData> {
  const cacheKey = cacheManager.buildKey('devops-v5', username);

  return cacheManager.getOrFetch<DevOpsData>(
    cacheKey,
    async () => {
      const data = await retryWithBackoff(async (token: string) => {
        const response: unknown = await graphql(DEVOPS_QUERY, {
          login: username,
          headers: { authorization: `Bearer ${token}` },
        });
        return DevOpsResponseSchema.parse(response);
      });

      if (!data.user) throw new Error(`User "${username}" not found.`);

      const allRepos = data.user.repositories.nodes;
      const publicRepos = allRepos.filter((r) => !r.isPrivate);
      const totalRepos = allRepos.length;

      if (totalRepos === 0) return createEmptyDevOpsData();

      const metrics = countRepoMetrics(allRepos);
      const codeFactor = await calculateCodeFactorResult(publicRepos);
      return computeDevOpsResult(metrics, codeFactor, totalRepos, publicRepos.length);
    },
    'devops',
  );
}

function createEmptyDevOpsData(): DevOpsData {
  return {
    ciCd: { hasActionsCount: 0, totalRuns: 0, successRate: 0, grade: 'C' },
    security: {
      dependabotCount: 0,
      codeFactorAPlusCount: 0,
      codeFactorTotal: 0,
      advisories: 0,
      grade: 'C',
    },
    organization: { totalRepos: 0, archivedRepos: 0, wellOrganizedCount: 0, grade: 'C' },
    overallGrade: 'C',
  };
}
