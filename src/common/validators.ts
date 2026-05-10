// ============================================================
// Zod validation schemas for all API query parameters
// ============================================================

import { z } from 'zod';

// GitHub username: 1-39 chars, alphanumeric + hyphens (no leading/trailing hyphen)
const USERNAME_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;
const HEX_COLOR_REGEX = /^[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/;

// --- Base schema (shared across all endpoints) ---

export const BaseParamsSchema = z.object({
  username: z
    .string({ required_error: 'username query parameter is required' })
    .min(1)
    .max(39)
    .regex(USERNAME_REGEX, 'Invalid GitHub username format'),
  theme: z.string().default('dracula-black'),
  hide_border: z.coerce.boolean().default(false),
  border_radius: z.coerce.number().min(0).max(50).default(12),
  bg_color: z.string().regex(HEX_COLOR_REGEX).optional(),
  text_color: z.string().regex(HEX_COLOR_REGEX).optional(),
  title_color: z.string().regex(HEX_COLOR_REGEX).optional(),
  icon_color: z.string().regex(HEX_COLOR_REGEX).optional(),
  border_color: z.string().regex(HEX_COLOR_REGEX).optional(),
  locale: z.enum(['en', 'pt-br', 'es']).default('en'),
  hide_title: z.coerce.boolean().default(false),
  custom_title: z.string().max(100).optional(),
  disable_animations: z.coerce.boolean().default(false),
  cache_seconds: z.coerce.number().min(300).max(86_400).default(14_400),
});

// --- Stats endpoint ---

export const StatsParamsSchema = BaseParamsSchema.extend({
  include_private: z.coerce.boolean().optional(),
  include_archived: z.coerce.boolean().default(true),
  include_forks: z.coerce.boolean().default(false),
  count_private: z.coerce.boolean().optional(),
  hide: z.string().max(200).optional(),
  show: z.string().max(200).optional(),
  hide_rank: z.coerce.boolean().default(false),
  line_height: z.coerce.number().min(20).max(40).default(25),
});

// --- Top Languages endpoint ---

export const TopLangsParamsSchema = BaseParamsSchema.extend({
  langs_count: z.coerce.number().min(1).max(100).default(20),
  layout: z.enum(['normal', 'compact', 'donut', 'donut-vertical', 'pie']).default('normal'),
  exclude_repo: z.string().max(500).optional(),
  hide: z.string().max(200).optional(),
  include_archived: z.coerce.boolean().default(true),
  include_forks: z.coerce.boolean().default(false),
  size_weight: z.coerce.number().min(0).max(1).default(1),
  count_weight: z.coerce.number().min(0).max(1).default(0),
});

// --- Streak endpoint ---

export const StreakParamsSchema = BaseParamsSchema.extend({
  hide_current_streak: z.coerce.boolean().default(false),
  hide_longest_streak: z.coerce.boolean().default(false),
  mode: z.enum(['daily', 'weekly']).default('daily'),
  exclude_days: z.string().max(50).optional(),
});
// --- Activity endpoint ---

export const ActivityParamsSchema = BaseParamsSchema;

// --- Pin endpoint ---

const REPO_NAME_REGEX = /^[A-Za-z0-9._-]{1,100}$/;

export const PinParamsSchema = BaseParamsSchema.extend({
  repo: z
    .string({ required_error: 'Repository name (repo) is required' })
    .min(1, 'Repository name is required')
    .max(100)
    .regex(REPO_NAME_REGEX, 'Invalid repository name'),
  show_owner: z.coerce.boolean().default(false),
  description_lines_count: z.coerce.number().min(1).max(3).default(1),
});

// Pin grid (sem repo): mesmo schema, sem `repo`.
export const PinAllParamsSchema = BaseParamsSchema.extend({
  show_owner: z.coerce.boolean().default(false),
  description_lines_count: z.coerce.number().min(1).max(3).default(1),
});

// --- DevOps endpoint ---

export const DevOpsParamsSchema = BaseParamsSchema.extend({
  include_codefactor: z.coerce.boolean().default(true),
  include_security: z.coerce.boolean().default(true),
  workflows_count: z.coerce.number().min(1).max(10).default(5),
});

// --- WakaTime endpoint ---

export const WakatimeParamsSchema = BaseParamsSchema.extend({
  hide_title: z.coerce.boolean().default(false),
  langs_count: z.coerce.number().min(1).max(100).default(5),
  layout: z.enum(['normal', 'compact']).default('normal'),
});

// --- Inferred types ---

export type BaseParams = z.infer<typeof BaseParamsSchema>;
export type StatsParams = z.infer<typeof StatsParamsSchema>;
export type TopLangsParams = z.infer<typeof TopLangsParamsSchema>;
export type StreakParams = z.infer<typeof StreakParamsSchema>;
export type ActivityParams = z.infer<typeof ActivityParamsSchema>;
export type PinParams = z.infer<typeof PinParamsSchema>;
export type DevOpsParams = z.infer<typeof DevOpsParamsSchema>;
export type WakatimeParams = z.infer<typeof WakatimeParamsSchema>;
