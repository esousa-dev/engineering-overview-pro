// ============================================================
// API index route — GET /
// Returns a machine-readable catalog of all available endpoints
// with their parameters, defaults, and example URLs.
// ============================================================

import type { FastifyInstance } from 'fastify';
import { getAvailableThemes } from '../themes/index.js';

// ---- Shared parameter definitions (inherited by every endpoint) ----

const SHARED_PARAMS = {
  username: {
    required: true,
    type: 'string',
    description: 'GitHub username (1–39 chars, alphanumeric + hyphens)',
    example: 'ESousa97',
  },
  theme: {
    required: false,
    type: 'string',
    default: 'dracula-black',
    description: 'Card colour theme. See themes[] for valid values.',
  },
  hide_border: {
    required: false,
    type: 'boolean',
    default: false,
    description: 'Remove the card border',
  },
  border_radius: {
    required: false,
    type: 'number',
    default: 12,
    range: [0, 50],
    description: 'Corner radius in pixels',
  },
  locale: {
    required: false,
    type: 'enum',
    options: ['en', 'pt-br', 'es'],
    default: 'en',
    description: 'Card label language',
  },
  hide_title: {
    required: false,
    type: 'boolean',
    default: false,
    description: 'Hide the card title bar',
  },
  custom_title: {
    required: false,
    type: 'string',
    maxLength: 100,
    description: 'Override the default card title',
  },
  disable_animations: {
    required: false,
    type: 'boolean',
    default: false,
    description: 'Disable SVG entry animations',
  },
  cache_seconds: {
    required: false,
    type: 'number',
    default: 14400,
    range: [300, 86400],
    description: 'Browser/CDN cache TTL in seconds',
  },
  bg_color: {
    required: false,
    type: 'string',
    format: 'RRGGBB hex (no #)',
    description: 'Background colour override',
  },
  text_color: {
    required: false,
    type: 'string',
    format: 'RRGGBB hex (no #)',
    description: 'Body text colour override',
  },
  title_color: {
    required: false,
    type: 'string',
    format: 'RRGGBB hex (no #)',
    description: 'Title text colour override',
  },
  icon_color: {
    required: false,
    type: 'string',
    format: 'RRGGBB hex (no #)',
    description: 'Icon colour override',
  },
  border_color: {
    required: false,
    type: 'string',
    format: 'RRGGBB hex (no #)',
    description: 'Border colour override',
  },
} as const;

// ---- Per-endpoint extra parameters ----

const ENDPOINT_CATALOG = [
  {
    path: '/api/stats',
    method: 'GET',
    description: 'GitHub contribution stats card (commits, PRs, issues, stars, rank)',
    example: '/api/stats?username=ESousa97',
    extra_params: {
      include_private: {
        required: false,
        type: 'boolean',
        default: false,
        description: 'Count private contributions (requires PAT scope)',
      },
      include_archived: {
        required: false,
        type: 'boolean',
        default: true,
        description: 'Include archived repositories in star count',
      },
      include_forks: {
        required: false,
        type: 'boolean',
        default: false,
        description: 'Include forked repositories in star count',
      },
      hide_rank: {
        required: false,
        type: 'boolean',
        default: false,
        description: 'Hide the rank badge',
      },
      hide: {
        required: false,
        type: 'string',
        format: 'comma-separated values',
        options: ['stars', 'commits', 'prs', 'issues', 'contribs'],
        description: 'Hide specific stat rows',
      },
      show: {
        required: false,
        type: 'string',
        format: 'comma-separated values',
        options: ['reviews', 'discussions_started', 'discussions_answered', 'prs_merged'],
        description: 'Show additional stat rows',
      },
      line_height: {
        required: false,
        type: 'number',
        default: 25,
        range: [20, 40],
        description: 'Vertical spacing between stat rows',
      },
    },
  },
  {
    path: '/api/top-langs',
    method: 'GET',
    description: 'Most used programming languages across all public repositories',
    example: '/api/top-langs?username=ESousa97&layout=donut',
    extra_params: {
      langs_count: {
        required: false,
        type: 'number',
        default: 20,
        range: [1, 100],
        description: 'Maximum number of languages to display',
      },
      layout: {
        required: false,
        type: 'enum',
        options: ['normal', 'compact', 'donut', 'donut-vertical', 'pie'],
        default: 'normal',
        description: 'Card layout style',
      },
      hide: {
        required: false,
        type: 'string',
        format: 'comma-separated language names',
        description: 'Languages to exclude (e.g. "HTML,CSS")',
      },
      exclude_repo: {
        required: false,
        type: 'string',
        format: 'comma-separated repo names',
        description: 'Repositories to exclude from aggregation',
      },
      include_archived: {
        required: false,
        type: 'boolean',
        default: true,
        description: 'Include archived repositories',
      },
      size_weight: {
        required: false,
        type: 'number',
        default: 1,
        range: [0, 1],
        description: 'Weight given to repository byte size',
      },
      count_weight: {
        required: false,
        type: 'number',
        default: 0,
        range: [0, 1],
        description: 'Weight given to repository count',
      },
    },
  },
  {
    path: '/api/streak',
    method: 'GET',
    description: 'Contribution streak card (current streak, longest streak, total contributions)',
    example: '/api/streak?username=ESousa97',
    extra_params: {
      hide_current_streak: {
        required: false,
        type: 'boolean',
        default: false,
        description: 'Hide the current streak section',
      },
      hide_longest_streak: {
        required: false,
        type: 'boolean',
        default: false,
        description: 'Hide the longest streak section',
      },
      mode: {
        required: false,
        type: 'enum',
        options: ['daily', 'weekly'],
        default: 'daily',
        description: 'Streak counting granularity',
      },
    },
  },
  {
    path: '/api/activity',
    method: 'GET',
    description:
      'Contribution heatmap + radar chart (commits, PRs, reviews, issues, repos, languages)',
    example: '/api/activity?username=ESousa97',
    extra_params: {},
  },
  {
    path: '/api/pin',
    method: 'GET',
    description:
      'Pinned repository card. Omit `repo` to show a grid of all pinned repos; include `repo` for a single repo card.',
    example: '/api/pin?username=ESousa97&repo=engineering-overview-pro',
    extra_params: {
      repo: {
        required: false,
        type: 'string',
        description: 'Repository name (without owner). Omit for pinned repos grid.',
      },
      show_owner: {
        required: false,
        type: 'boolean',
        default: false,
        description: 'Show the owner prefix (owner/repo)',
      },
      description_lines_count: {
        required: false,
        type: 'number',
        default: 1,
        range: [1, 3],
        description: 'Number of description lines to display',
      },
    },
  },
  {
    path: '/api/devops',
    method: 'GET',
    description:
      'DevOps health card (CI/CD score, security score, repo organisation grade via GitHub Actions + CodeFactor)',
    example: '/api/devops?username=ESousa97',
    extra_params: {},
  },
  {
    path: '/api/coding-stats',
    method: 'GET',
    description:
      'Estimated coding time card derived from recent GitHub public events (no external service required)',
    example: '/api/coding-stats?username=ESousa97',
    extra_params: {
      langs_count: {
        required: false,
        type: 'number',
        default: 5,
        range: [1, 100],
        description: 'Number of top languages to display',
      },
      layout: {
        required: false,
        type: 'enum',
        options: ['normal', 'compact'],
        default: 'normal',
        description: 'Card layout style',
      },
    },
  },
] as const;

/**
 * Root route — returns a complete, machine-readable catalog of the API.
 */
export function indexRoute(server: FastifyInstance): void {
  server.get('/', () => ({
    service: 'engineering-overview-pro',
    description:
      'Self-hosted GitHub profile SVG card generator. Embed card URLs directly in your GitHub README.',
    health: '/health',
    themes: getAvailableThemes(),
    shared_params: SHARED_PARAMS,
    endpoints: ENDPOINT_CATALOG,
  }));
}
