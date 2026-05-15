// ============================================================
// Bootstrap do Fastify + camadas de segurança (read-only API)
// ============================================================

import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';

import { cacheManager } from './common/cache.js';
import { PORT, HOST, LOG_LEVEL, resolveTrustProxy } from './common/config.js';
import { indexRoute } from './api/index-route.js';
import { statsRoute } from './api/stats.js';
import { topLangsRoute } from './api/top-langs.js';
import { streakRoute } from './api/streak.js';
import { activityRoute } from './api/activity.js';
import { pinRoute } from './api/pin.js';
import { devopsRoute } from './api/devops.js';
import { codingStatsRoute } from './api/wakatime.js';
import { getRateLimitStatus } from './common/retryer.js';
import { startBackgroundPoller } from './common/poller.js';

// Métodos HTTP permitidos: somente leitura.
const ALLOWED_METHODS = new Set(['GET', 'HEAD']);

async function buildServer(): Promise<FastifyInstance> {
  const server = Fastify({
    logger: { level: LOG_LEVEL },
    // Recusa qualquer corpo de requisição (read-only).
    bodyLimit: 1,
    // Só confia em X-Forwarded-For quando TRUST_PROXY estiver setado.
    // Sem isso, atacante poderia forjar o IP e bypassar o rate-limit.
    trustProxy: resolveTrustProxy(),
    // Tamanho máximo do header / URL para mitigar abuso.
    maxParamLength: 200,
    // Timeout de conexão (ms): aborta requests longos.
    connectionTimeout: 15_000,
    // Timeout de keep-alive.
    keepAliveTimeout: 5_000,
    disableRequestLogging: false,
  });

  // ---------- Cabeçalhos de segurança ----------
  await server.register(helmet, {
    // SVGs são embedados em qualquer README; mantemos CSP relaxada apenas
    // para o conteúdo SVG inline e bloqueamos o resto.
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        imgSrc: ["'self'", 'data:'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });

  // ---------- CORS ----------
  // Cards SVG são embedados em qualquer origem; permitimos GET/HEAD apenas.
  await server.register(cors, {
    origin: '*',
    methods: ['GET', 'HEAD'],
  });

  // ---------- Rate limit global ----------
  await server.register(rateLimit, {
    global: true,
    max: 60,
    timeWindow: '1 minute',
    cache: 10_000,
    allowList: ['127.0.0.1', '::1'],
    addHeadersOnExceeding: { 'x-ratelimit-limit': true, 'x-ratelimit-remaining': true },
  });

  // ---------- Bloquear métodos que não sejam GET/HEAD ----------
  server.addHook('onRequest', async (request, reply) => {
    if (!ALLOWED_METHODS.has(request.method)) {
      await reply.status(405).header('Allow', 'GET, HEAD').send({ error: 'Method Not Allowed' });
    }
  });

  // ---------- Rotas ----------
  await server.register(indexRoute);

  server.get('/health', async () => {
    const memory = process.memoryUsage();
    const githubStatus = await getRateLimitStatus();

    return {
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      memory: {
        rss: `${String(Math.round(memory.rss / 1024 / 1024))}MB`,
        heapUsed: `${String(Math.round(memory.heapUsed / 1024 / 1024))}MB`,
        heapTotal: `${String(Math.round(memory.heapTotal / 1024 / 1024))}MB`,
      },
      cache: { size: cacheManager.getSize() },
      github: githubStatus,
    };
  });

  await server.register(statsRoute, { prefix: '/api' });
  await server.register(topLangsRoute, { prefix: '/api' });
  await server.register(streakRoute, { prefix: '/api' });
  await server.register(activityRoute, { prefix: '/api' });
  await server.register(pinRoute, { prefix: '/api' });
  await server.register(devopsRoute, { prefix: '/api' });
  await server.register(codingStatsRoute, { prefix: '/api' });

  return server;
}

async function start(): Promise<void> {
  const server = await buildServer();

  try {
    await server.listen({ port: PORT, host: HOST });
    server.log.info(`Server listening on ${HOST}:${String(PORT)}`);
    startBackgroundPoller(server.log);
  } catch (err: unknown) {
    server.log.error(err);
    process.exit(1);
  }

  const shutdown = async (): Promise<void> => {
    server.log.info('Shutting down gracefully...');
    await server.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => {
    void shutdown();
  });
  process.on('SIGINT', () => {
    void shutdown();
  });
}

void start();

export { buildServer };
