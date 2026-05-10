// ============================================================
// CodeFactor Fetcher (API + Badge Fallback)
// ============================================================

import { cacheManager } from '../common/cache.js';

import type { CodeFactorGrade } from '../types/index.js';

const CODEFACTOR_TIMEOUT_MS = 5000;

interface CodeFactorApiResponse {
  grade?: string;
  [key: string]: unknown;
}

/**
 * Fetch CodeFactor grade for a specific repository.
 * Tries API first if token present, falls back to parsing the public SVG badge.
 * Failures are silenced (returns null).
 */
export async function fetchCodeFactorGrade(
  owner: string,
  repo: string,
): Promise<CodeFactorGrade | null> {
  const cacheKey = cacheManager.buildKey('codefactor', owner, { repo });
  const cached = cacheManager.get<CodeFactorGrade | null>(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  let grade: CodeFactorGrade | null = null;
  const token = process.env['CODEFACTOR_API_TOKEN'];

  if (token) {
    grade = await fetchFromApi(owner, repo, token);
  }

  if (!grade) {
    grade = await fetchFromBadge(owner, repo);
  }

  // Cache even if null (to avoid repeated failed requests) for 12 hours
  cacheManager.set(cacheKey, grade, 'devops', 43_200);

  return grade;
}

async function fetchFromApi(
  owner: string,
  repo: string,
  token: string,
): Promise<CodeFactorGrade | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, CODEFACTOR_TIMEOUT_MS);

    // CodeFactor API v1 for repository
    const url = `https://www.codefactor.io/api/v1/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Token ${token}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as CodeFactorApiResponse;
    const grade = data.grade;

    if (isValidGrade(grade)) {
      return grade;
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchFromBadge(owner: string, repo: string): Promise<CodeFactorGrade | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, CODEFACTOR_TIMEOUT_MS);

    const url = `https://www.codefactor.io/repository/github/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/badge`;
    const response = await fetch(url, {
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return null;
    }

    const svgText = await response.text();
    // Extract via regex as defined in workspace rules: />([A-F][+-]?)<\/text>/
    const match = />([A-F][+-]?)<\/text>/.exec(svgText);

    if (match && match[1]) {
      const grade = match[1];
      if (isValidGrade(grade)) {
        return grade;
      }
    }

    return null;
  } catch {
    return null;
  }
}

function isValidGrade(grade: unknown): grade is CodeFactorGrade {
  if (typeof grade !== 'string') return false;
  return /^[A-F][+-]?$/.test(grade);
}
