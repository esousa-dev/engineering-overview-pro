// ============================================================
// Mensagens de erro seguras para exposição ao cliente.
// Nunca repasse `error.message` cru: pode conter dados de
// upstream (texto controlado externamente), URLs internas ou
// detalhes que ajudem um atacante.
// ============================================================

const KNOWN_PATTERNS: Array<{ test: RegExp; message: string }> = [
  { test: /not found/i, message: 'User or repository not found.' },
  { test: /private/i, message: 'Resource is private or unavailable.' },
  { test: /no pinned/i, message: 'No pinned repositories.' },
  { test: /rate limit|secondary rate/i, message: 'Rate limit exceeded. Try again later.' },
  { test: /unauthorized|bad credentials/i, message: 'Upstream authentication failed.' },
  { test: /timeout|ETIMEDOUT|ECONNRESET/i, message: 'Upstream timeout. Try again later.' },
];

/**
 * Convert any error into a short, user-safe message suitable for the
 * SVG error card. Logs nothing — the caller should log the original
 * error separately.
 */
export function sanitizeUserError(err: unknown): string {
  const raw = err instanceof Error ? err.message : '';
  for (const { test, message } of KNOWN_PATTERNS) {
    if (test.test(raw)) return message;
  }
  return 'Something went wrong. Please try again later.';
}
