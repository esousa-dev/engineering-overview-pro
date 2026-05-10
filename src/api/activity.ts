import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { ActivityData } from '../types/index.js';
import { fetchActivity } from '../fetchers/activity-fetcher.js';
import { fetchTopLanguages } from '../fetchers/top-langs-fetcher.js';
import { renderActivityCard } from '../cards/activity-card.js';
import { ActivityParamsSchema } from '../common/validators.js';
import { resolveTheme } from '../themes/index.js';
import { renderErrorCard } from '../common/card.js';
import { cacheManager } from '../common/cache.js';
import { sanitizeUserError } from '../common/errors.js';

type ActivityRequest = FastifyRequest<{
  Querystring: Record<string, string | undefined>;
}>;

export function activityRoute(server: FastifyInstance, _opts: unknown, done: () => void): void {
  server.get('/activity', async (request: ActivityRequest, reply: FastifyReply) => {
    const parseResult = ActivityParamsSchema.safeParse(request.query);

    if (!parseResult.success) {
      const errorSvg = renderErrorCard('Invalid query parameters', resolveTheme('dracula-black'));
      void reply.header('Content-Type', 'image/svg+xml; charset=utf-8').send(errorSvg);
      return;
    }

    const params = parseResult.data;
    const { username } = params;

    const theme = resolveTheme(params.theme, {
      bgColor: params.bg_color,
      textColor: params.text_color,
      titleColor: params.title_color,
      iconColor: params.icon_color,
      borderColor: params.border_color,
    });

    const options = {
      theme,
      hideBorder: params.hide_border,
      borderRadius: params.border_radius,
      hideTitle: params.hide_title,
      customTitle: params.custom_title,
      disableAnimations: params.disable_animations,
      locale: params.locale,
      width: 0,
      height: 0,
    };

    try {
      const cacheKey = cacheManager.buildKey('activity', username, { ...params });
      let svg = cacheManager.get<string>(cacheKey);

      if (svg === undefined) {
        const [activityData, topLangs] = await Promise.all([
          fetchActivity(username),
          fetchTopLanguages(username, {
            includePrivate: false,
            includeArchived: true,
            hideLanguages: [],
            limit: 20,
          }),
        ]);

        const data: ActivityData = {
          ...activityData,
          languages: topLangs.map((lang) => ({
            name: lang.name,
            size: lang.size,
            color: lang.color,
            percentage: lang.percentage,
          })),
        };

        svg = renderActivityCard(data, options);
        cacheManager.set(cacheKey, svg, 'activity', params.cache_seconds);
      }

      void reply
        .header('Content-Type', 'image/svg+xml; charset=utf-8')
        .header('Cache-Control', `public, max-age=${String(params.cache_seconds)}`)
        .send(svg);
    } catch (err: unknown) {
      request.log.warn({ err }, 'activity route failed');
      void reply
        .header('Content-Type', 'image/svg+xml; charset=utf-8')
        .send(renderErrorCard(sanitizeUserError(err), theme));
    }
  });

  done();
}
