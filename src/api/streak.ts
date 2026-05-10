// ============================================================
// Streak route handler — /api/streak
// ============================================================

import { StreakParamsSchema } from '../common/validators.js';
import { resolveTheme } from '../themes/index.js';
import { renderErrorCard } from '../common/card.js';
import { fetchStreakStats } from '../fetchers/streak-fetcher.js';
import { renderStreakCard } from '../cards/streak-card.js';
import { draculaBlack } from '../themes/dracula-black.js';
import { sanitizeUserError } from '../common/errors.js';

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { SupportedLocale } from '../types/index.js';

/**
 * Streak route plugin for Fastify.
 * GET /api/streak?username={user}
 */
export function streakRoute(server: FastifyInstance): void {
  server.get('/streak', async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = StreakParamsSchema.safeParse(request.query);

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
      const stats = await fetchStreakStats(params.username, {
        hideCurrentStreak: params.hide_current_streak,
        hideLongestStreak: params.hide_longest_streak,
      });

      const svg = renderStreakCard(stats, {
        theme,
        hideBorder: params.hide_border,
        borderRadius: params.border_radius,
        hideTitle: params.hide_title,
        customTitle: params.custom_title,
        disableAnimations: params.disable_animations,
        locale: params.locale as SupportedLocale,
        width: 495,
        height: 195,
        hideCurrentStreak: params.hide_current_streak,
        hideLongestStreak: params.hide_longest_streak,
      });

      sendSvg(reply, svg, params.cache_seconds);
      return;
    } catch (error: unknown) {
      request.log.warn({ err: error }, 'streak route failed');
      sendSvg(reply, renderErrorCard(sanitizeUserError(error), theme), 300);
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
