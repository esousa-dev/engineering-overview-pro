// ============================================================
// Coding Stats route handler — /api/coding-stats
// ============================================================

import { WakatimeParamsSchema } from '../common/validators.js';
import { resolveTheme } from '../themes/index.js';
import { renderErrorCard } from '../common/card.js';
import { fetchInternalCodingStats } from '../fetchers/coding-stats-fetcher.js';
import { renderCodingStatsCard } from '../cards/coding-stats-card.js';
import { draculaBlack } from '../themes/dracula-black.js';
import { sanitizeUserError } from '../common/errors.js';

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { SupportedLocale } from '../types/index.js';

/**
 * Coding Stats route plugin for Fastify.
 * GET /api/coding-stats?username={user}
 */
export function codingStatsRoute(server: FastifyInstance): void {
  server.get('/coding-stats', async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = WakatimeParamsSchema.safeParse(request.query);

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
      const data = await fetchInternalCodingStats(params.username);

      const svg = renderCodingStatsCard(data, {
        theme,
        hideBorder: params.hide_border,
        borderRadius: params.border_radius,
        hideTitle: params.hide_title,
        customTitle: params.custom_title,
        disableAnimations: params.disable_animations,
        locale: params.locale as SupportedLocale,
        width: 495,
        height: 0,
        langsCount: params.langs_count,
      });

      sendSvg(reply, svg, params.cache_seconds);
    } catch (error: unknown) {
      request.log.warn({ err: error }, 'coding-stats route failed');
      sendSvg(reply, renderErrorCard(sanitizeUserError(error), theme), 300);
    }
  });
}

function sendSvg(reply: FastifyReply, svg: string, cacheSeconds: number): void {
  void reply
    .code(200)
    .header('Content-Type', 'image/svg+xml; charset=utf-8')
    .header('Cache-Control', `public, max-age=${String(cacheSeconds)}`)
    .header('Access-Control-Allow-Origin', '*')
    .send(svg);
}
