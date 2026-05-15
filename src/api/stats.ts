// ============================================================
// Stats route handler — /api/stats
// ============================================================

import { StatsParamsSchema } from '../common/validators.js';
import { resolveTheme } from '../themes/index.js';
import { renderErrorCard } from '../common/card.js';
import { fetchStats } from '../fetchers/stats-fetcher.js';
import { renderStatsCard } from '../cards/stats-card.js';
import { draculaBlack } from '../themes/dracula-black.js';
import { sanitizeUserError } from '../common/errors.js';
import { parseCommaSeparated } from '../common/utils.js';

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { SupportedLocale } from '../types/index.js';

/**
 * Stats route plugin for Fastify.
 * GET /api/stats?username={user}
 */
export function statsRoute(server: FastifyInstance): void {
  server.get('/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    // Validate query params — invalid values fall back to defaults silently
    const parseResult = StatsParamsSchema.safeParse(request.query);

    if (!parseResult.success) {
      const errorSvg = renderErrorCard(
        'Invalid parameters. Please check the documentation.',
        draculaBlack,
      );
      sendSvg(reply, errorSvg, 14_400);
      return;
    }

    const params = parseResult.data;

    // Resolve theme with optional color overrides
    const theme = resolveTheme(params.theme, {
      bgColor: params.bg_color,
      textColor: params.text_color,
      titleColor: params.title_color,
      iconColor: params.icon_color,
      borderColor: params.border_color,
    });

    try {
      const stats = await fetchStats(params.username, {
        includePrivate: params.include_private ?? false,
        includeArchived: params.include_archived,
        includeForks: params.include_forks,
      });

      const svg = renderStatsCard(stats, {
        theme,
        hideBorder: params.hide_border,
        borderRadius: params.border_radius,
        hideTitle: params.hide_title,
        customTitle: params.custom_title,
        disableAnimations: params.disable_animations,
        locale: params.locale as SupportedLocale,
        width: 495,
        height: 195,
        hideRank: params.hide_rank,
        lineHeight: params.line_height,
        hideItems: parseCommaSeparated(params.hide),
        showItems: parseCommaSeparated(params.show),
      });

      sendSvg(reply, svg, params.cache_seconds);
      return;
    } catch (error: unknown) {
      request.log.warn({ err: error }, 'stats route failed');
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

