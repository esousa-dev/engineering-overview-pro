import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { fetchRepo, fetchPinnedRepos } from '../fetchers/pin-fetcher.js';
import { renderPinCard, renderPinnedCards } from '../cards/pin-card.js';
import { PinParamsSchema, PinAllParamsSchema } from '../common/validators.js';
import { resolveTheme } from '../themes/index.js';
import { cacheManager } from '../common/cache.js';
import { renderErrorCard } from '../common/card.js';
import { sanitizeUserError } from '../common/errors.js';

type PinRequest = FastifyRequest<{
  Querystring: Record<string, string | undefined>;
}>;

/**
 * Register Pin Card route
 *
 * - GET /pin?username=X                → All pinned repos from user X (grid)
 * - GET /pin?username=X&repo=Y         → Single repo card
 */
export function pinRoute(server: FastifyInstance, _opts: unknown, done: () => void): void {
  server.get('/pin', async (request: PinRequest, reply: FastifyReply) => {
    const query = request.query;
    const isGrid = !query['repo'];

    const schema = isGrid ? PinAllParamsSchema : PinParamsSchema;
    const result = schema.safeParse(query);

    if (!result.success) {
      const theme = resolveTheme(query['theme'] ?? 'dracula-black', {});
      const message = result.error.errors.map((e) => e.message).join(', ');
      return await reply
        .status(200)
        .type('image/svg+xml')
        .send(renderErrorCard(message, theme));
    }

    const params = result.data;
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
      width: 400,
      height: 150,
    };

    try {
      if (isGrid) {
        const cacheKey = cacheManager.buildKey('pin-all', params.username, params);
        let svg = cacheManager.get<string>(cacheKey);

        if (svg === undefined) {
          const repos = await fetchPinnedRepos(params.username);
          svg = renderPinnedCards(repos, options);
          cacheManager.set(cacheKey, svg, 'pin', params.cache_seconds);
        }

        return await reply
          .status(200)
          .type('image/svg+xml; charset=utf-8')
          .header('Cache-Control', `public, max-age=${String(params.cache_seconds)}`)
          .send(svg);
      }

      // Single repo (params has repo guaranteed by PinParamsSchema)
      const { username, repo } = params as typeof params & { repo: string };
      const cacheKey = cacheManager.buildKey('pin', `${username}:${repo}`, params);
      let svg = cacheManager.get<string>(cacheKey);

      if (svg === undefined) {
        const data = await fetchRepo(username, repo);
        svg = renderPinCard(data, options);
        cacheManager.set(cacheKey, svg, 'pin', params.cache_seconds);
      }

      return await reply
        .status(200)
        .type('image/svg+xml; charset=utf-8')
        .header('Cache-Control', `public, max-age=${String(params.cache_seconds)}`)
        .send(svg);
    } catch (error) {
      request.log.warn({ err: error }, 'pin route failed');
      return await reply
        .status(200)
        .type('image/svg+xml')
        .send(renderErrorCard(sanitizeUserError(error), theme));
    }
  });

  done();
}
