// ============================================================
// Internationalization — translation strings (en + pt-br + es)
// ============================================================

import type { SupportedLocale, TranslationKey, TranslationMap } from '../types/index.js';

const translations: Record<SupportedLocale, TranslationMap> = {
  en: {
    'stats.title': 'GitHub Stats',
    'stats.stars': 'Total Stars',
    'stats.commits': 'Total Commits',
    'stats.prs': 'Total PRs',
    'stats.issues': 'Total Issues',
    'stats.contribs': 'contributions',
    'stats.rank': 'Rank',
    'top-langs.title': 'Most Used Languages',
    'streak.title': 'GitHub Streak',
    'streak.current': 'Current Streak',
    'streak.longest': 'Longest Streak',
    'streak.total': 'Total Contributions',
    'activity.title': 'Contribution Activity',
    'pin.stars': 'Stars',
    'pin.forks': 'Forks',
    'devops.title': 'DevOps & CI/CD',
    'wakatime.title': 'WakaTime Stats',
    'wakatime.totalTime': 'Total Time',
    'wakatime.dailyAverage': 'Daily Average',
    'wakatime.bestDay': 'Best Day',
    'coding-stats.title': 'Coding Stats',
    'coding-stats.totalTime': 'Total Time',
    'coding-stats.dailyAverage': 'Daily Average',
    'coding-stats.sessions': 'Sessions',
    'coding-stats.projects': 'Top Projects',
    'coding-stats.disclaimer': 'Estimated from GitHub events',
    'error.title': 'Error',
    'error.generic': 'Something went wrong. Please try again later.',
    'error.user-not-found': 'User not found. Please check the username.',
    'error.rate-limit': 'API rate limit exceeded. Please try again later.',
  },
  'pt-br': {
    'stats.title': 'Estatísticas GitHub',
    'stats.stars': 'Total de Estrelas',
    'stats.commits': 'Total de Commits',
    'stats.prs': 'Total de PRs',
    'stats.issues': 'Total de Issues',
    'stats.contribs': 'Contribuiu para',
    'stats.rank': 'Ranking',
    'top-langs.title': 'Linguagens Mais Usadas',
    'streak.title': 'Sequência GitHub',
    'streak.current': 'Sequência Atual',
    'streak.longest': 'Maior Sequência',
    'streak.total': 'Total de Contribuições',
    'activity.title': 'Atividade de Contribuições',
    'pin.stars': 'Estrelas',
    'pin.forks': 'Forks',
    'devops.title': 'DevOps & CI/CD',
    'wakatime.title': 'Estatísticas WakaTime',
    'wakatime.totalTime': 'Tempo Total',
    'wakatime.dailyAverage': 'Média Diária',
    'wakatime.bestDay': 'Melhor Dia',
    'coding-stats.title': 'Estatísticas de Codificação (estimado)',
    'coding-stats.totalTime': 'Tempo Total',
    'coding-stats.dailyAverage': 'Média Diária',
    'coding-stats.sessions': 'Sessões',
    'coding-stats.projects': 'Principais Projetos',
    'coding-stats.disclaimer': 'Estimado via eventos GitHub',
    'error.title': 'Erro',
    'error.generic': 'Algo deu errado. Tente novamente mais tarde.',
    'error.user-not-found': 'Usuário não encontrado. Verifique o nome de usuário.',
    'error.rate-limit': 'Limite de requisições excedido. Tente novamente mais tarde.',
  },
  es: {
    'stats.title': 'Estadísticas GitHub',
    'stats.stars': 'Estrellas Totales',
    'stats.commits': 'Commits Totales',
    'stats.prs': 'PRs Totales',
    'stats.issues': 'Issues Totales',
    'stats.contribs': 'Contribuyó a',
    'stats.rank': 'Rango',
    'top-langs.title': 'Lenguajes Más Usados',
    'streak.title': 'Racha GitHub',
    'streak.current': 'Racha Actual',
    'streak.longest': 'Racha Más Larga',
    'streak.total': 'Contribuciones Totales',
    'activity.title': 'Actividad de Contribuciones',
    'pin.stars': 'Estrellas',
    'pin.forks': 'Forks',
    'devops.title': 'DevOps & CI/CD',
    'wakatime.title': 'Estadísticas WakaTime',
    'wakatime.totalTime': 'Tiempo Total',
    'wakatime.dailyAverage': 'Promedio Diario',
    'wakatime.bestDay': 'Mejor Día',
    'coding-stats.title': 'Estadísticas de Codificación (estimado)',
    'coding-stats.totalTime': 'Tiempo Total',
    'coding-stats.dailyAverage': 'Promedio Diario',
    'coding-stats.sessions': 'Sesiones',
    'coding-stats.projects': 'Principales Proyectos',
    'coding-stats.disclaimer': 'Estimado vía eventos GitHub',
    'error.title': 'Error',
    'error.generic': 'Algo salió mal. Inténtalo de nuevo más tarde.',
    'error.user-not-found': 'Usuario no encontrado. Verifica el nombre de usuario.',
    'error.rate-limit': 'Límite de API excedido. Inténtalo de nuevo más tarde.',
  },
};

/**
 * Get translated string by key and locale.
 * Falls back to English if key not found in requested locale.
 */
export function t(key: TranslationKey, locale: SupportedLocale = 'en'): string {
  const localeMap = translations[locale];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (localeMap?.[key]) {
    return localeMap[key];
  }

  // Fallback to English
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return translations.en[key] ?? key;
}

export { translations };
