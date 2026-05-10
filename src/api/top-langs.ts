// ============================================================
// Top Languages route handler — /api/top-langs
// ============================================================

import { TopLangsParamsSchema } from '../common/validators.js';
import { resolveTheme } from '../themes/index.js';
import { renderErrorCard } from '../common/card.js';
import { fetchTopLanguages } from '../fetchers/top-langs-fetcher.js';
import { renderTopLangsCard } from '../cards/top-langs-card.js';
import { draculaBlack } from '../themes/dracula-black.js';
import { sanitizeUserError } from '../common/errors.js';

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { SupportedLocale } from '../types/index.js';

/**
 * Top Languages route plugin for Fastify.
 * GET /api/top-langs?username={user}
 */
export function topLangsRoute(server: FastifyInstance): void {
  server.get('/top-langs', async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = TopLangsParamsSchema.safeParse(request.query);

    if (!parseResult.success) {
      const errorSvg = renderErrorCard(
        'Invalid parameters. Please check the documentation.',
        draculaBlack,
      );
      sendSvg(reply, errorSvg, 14_400);
      return;
    }

    const params = parseResult.data;

    const theme = resolveTheme(params.theme, {
      bgColor: params.bg_color,
      textColor: params.text_color,
      titleColor: params.title_color,
      iconColor: params.icon_color,
      borderColor: params.border_color,
    });

    try {
      const langs = await fetchTopLanguages(params.username, {
        includePrivate: false, // Explicitly false per project rules unless opted-in, but top-langs doesn't have include_private in its schema actually. We pass what we have.
        includeArchived: params.include_archived,
        hideLanguages: parseCommaSeparated(params.hide),
        limit: params.langs_count,
      });

      const svg = renderTopLangsCard(langs, {
        theme,
        hideBorder: params.hide_border,
        borderRadius: params.border_radius,
        hideTitle: params.hide_title,
        customTitle: params.custom_title,
        disableAnimations: params.disable_animations,
        locale: params.locale as SupportedLocale,
        width: 495,
        height: 195, // The card recalculates this internally based on items
        hideProgress: false,
        hideLangs: parseCommaSeparated(params.hide),
      });

      sendSvg(reply, svg, params.cache_seconds);
      return;
    } catch (error: unknown) {
      request.log.warn({ err: error }, 'top-langs route failed');
      const errorSvg = renderErrorCard(sanitizeUserError(error), theme);

      sendSvg(reply, errorSvg, 300);
    }
  });
}

/**
 * Send SVG response with proper headers.
 */
function sendSvg(reply: FastifyReply, svg: string, cacheSeconds: number): void {
  void reply
    .code(200)
    .header('Content-Type', 'image/svg+xml; charset=utf-8')
    .header('Cache-Control', `public, max-age=${String(cacheSeconds)}`)
    .header('Access-Control-Allow-Origin', '*')
    .send(svg);
}

/**
 * Parse comma-separated string into array of trimmed, lowercase values.
 */
function parseCommaSeparated(value: string | undefined): ReadonlyArray<string> {
  if (value === undefined || value.length === 0) {
    return [];
  }
  return value
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);
}
