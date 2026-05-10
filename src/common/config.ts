// ============================================================
// Configuração de runtime a partir do ambiente.
// O usuário do GitHub vem sempre via querystring (?username=).
// O .env é carregado pelo Node via --env-file-if-exists (ver package.json).
// ============================================================

export const PORT = parseInt(process.env['PORT'] ?? '3000', 10);
export const HOST = process.env['HOST'] ?? '0.0.0.0';
export const LOG_LEVEL = process.env['LOG_LEVEL'] ?? 'info';

/**
 * Confiar em `X-Forwarded-For` somente quando explicitamente atrás de um proxy
 * reverso confiável (Nginx/Traefik/Cloudflare). Sem isso, qualquer cliente pode
 * forjar o IP e bypassar o rate-limit. Padrão: false.
 *
 * Aceita: "true", "1" → habilita; ou "10.0.0.1,127.0.0.1" → lista de IPs.
 */
export function resolveTrustProxy(): boolean | string[] {
  const raw = (process.env['TRUST_PROXY'] ?? '').trim();
  if (raw === '' || raw === 'false' || raw === '0') return false;
  if (raw === 'true' || raw === '1') return true;
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
