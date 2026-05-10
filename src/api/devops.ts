import { StatsParamsSchema } from '../common/validators.js';
import { resolveTheme } from '../themes/index.js';
import { renderErrorCard } from '../common/card.js';
import { fetchDevOps } from '../fetchers/devops-fetcher.js';
import { renderDevOpsCard } from '../cards/devops-card.js';
import { draculaBlack } from '../themes/dracula-black.js';
import { sanitizeUserError } from '../common/errors.js';

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { SupportedLocale } from '../types/index.js';

export function devopsRoute(server: FastifyInstance, _opts: unknown, done: () => void): void {
  server.get('/devops', async (request: FastifyRequest<{ Querystring: Record<string, string | undefined> }>, reply: FastifyReply) => {
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

    const theme = resolveTheme(params.theme, {
      bgColor: params.bg_color,
      textColor: params.text_color,
      titleColor: params.title_color,
      iconColor: params.icon_color,
      borderColor: params.border_color,
    });

    try {
      const data = await fetchDevOps(params.username);

      const svg = renderDevOpsCard(data, {
        theme,
        hideBorder: params.hide_border,
        borderRadius: params.border_radius,
        hideTitle: params.hide_title,
        customTitle: params.custom_title,
        disableAnimations: params.disable_animations,
        locale: params.locale as SupportedLocale,
        width: 550,
        height: 195,
      });

      sendSvg(reply, svg, params.cache_seconds);
    } catch (error: unknown) {
      request.log.warn({ err: error }, 'devops route failed');
      sendSvg(reply, renderErrorCard(sanitizeUserError(error), theme), 300);
    }
  });

  done();
}

function sendSvg(reply: FastifyReply, svg: string, cacheSeconds: number): void {
  void reply
    .code(200)
    .header('Content-Type', 'image/svg+xml; charset=utf-8')
    .header('Cache-Control', `public, max-age=${String(cacheSeconds)}`)
    .header('Access-Control-Allow-Origin', '*')
    .send(svg);
}

function parseCommaSeparated(value: string | undefined): ReadonlyArray<string> {
  if (value === undefined || value.length === 0) {
    return [];
  }
  return value
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);
}
