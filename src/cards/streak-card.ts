// ============================================================
// Streak SVG Card Renderer
// ============================================================

import { renderBaseCard, FONT_FAMILY } from '../common/card.js';
import { escapeXml, formatNumber } from '../common/utils.js';
import { t } from '../common/i18n.js';
import { iconContributions, iconFire, iconStar } from '../common/icons.js';

import type { StreakStats } from '../fetchers/streak-fetcher.js';
import type { CardOptions } from '../types/index.js';

export interface StreakCardOptions extends CardOptions {
  readonly hideCurrentStreak?: boolean;
  readonly hideLongestStreak?: boolean;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/**
 * Format a YYYY-MM-DD string into a short readable date.
 */
function formatShortDate(dateStr: string, locale: string): string {
  if (!dateStr || dateStr.length < 10) return 'Present';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;

  const year = parts[0] ?? '';
  const month = parts[1] ?? '01';
  const day = parts[2] ?? '01';

  if (locale === 'pt-br') {
    return `${day}/${month}/${year}`;
  }

  const mInt = parseInt(month, 10);
  const dInt = parseInt(day, 10);
  const monthLabel = MONTH_NAMES[mInt - 1] ?? 'Jan';
  return `${monthLabel} ${String(dInt)}, ${year}`;
}

/**
 * Render streak card SVG.
 * Pure function: (data, options) => string.
 */
export function renderStreakCard(stats: StreakStats, options: StreakCardOptions): string {
  const { theme, locale, disableAnimations } = options;

  const CARD_WIDTH = 594;
  const CARD_HEIGHT = 215;

  const columns: string[] = [];
  let colIndex = 0;

  let activeCols = 1;
  if (!options.hideCurrentStreak) activeCols++;
  if (!options.hideLongestStreak) activeCols++;
  
  const colWidth = CARD_WIDTH / activeCols;

  const addDivider = (x: number): void => {
    columns.push(`
      <line x1="${String(x)}" y1="15" x2="${String(x)}" y2="135" stroke="${theme.border}" stroke-width="1" opacity="0.6" />
    `);
  };

  const renderColumn = (
    index: number,
    iconSvg: string,
    iconColor: string,
    value: string,
    label: string,
    dateRange: string,
    isCenter: boolean = false
  ) => {
    const delay = (index + 1) * 150;
    const stagger = disableAnimations ? '' : `animation-delay: ${String(delay)}ms;`;
    const cx = colWidth * index + colWidth / 2;

    // Y coordinates matching the image
    const iconY = 5; 
    const valueY = 65;
    const labelY = isCenter ? 120 : 105;
    const dateY = isCenter ? 140 : 125;

    // Center ring logic
    const R = 40;
    const C = 2 * Math.PI * R; // ~251.3
    const gap = 38;
    const dash = C - gap;
    const offset = -gap / 2;

    const ringSvg = isCenter ? `
      <!-- Prominent Ring -->
      <circle cx="0" cy="55" r="${String(R)}" fill="none" stroke="${theme.icon}" stroke-width="4.5" stroke-linecap="round" stroke-dasharray="${String(dash)} ${String(gap)}" stroke-dashoffset="${String(offset)}" transform="rotate(-90 0 55)" opacity="0.8" />
    ` : '';

    return `
      <g transform="translate(${String(cx)}, 10)">
        <g class="stagger" style="${stagger}">
          ${ringSvg}
          
          <!-- Icon -->
          <g transform="translate(-12, ${String(iconY)}) scale(1.5)">
            ${iconSvg}
          </g>
          
          <!-- Value -->
          <text x="0" y="${String(valueY)}"
            text-anchor="middle"
            fill="${theme.text}"
            font-size="34" font-weight="700"
            font-family="${FONT_FAMILY}">
            ${escapeXml(value)}
          </text>
          
          <!-- Label -->
          <text x="0" y="${String(labelY)}"
            text-anchor="middle"
            fill="${iconColor}"
            font-size="14" font-weight="600"
            font-family="${FONT_FAMILY}">
            ${escapeXml(label)}
          </text>
          
          <!-- Date Range -->
          <text x="0" y="${String(dateY)}"
            text-anchor="middle"
            fill="${theme.muted}"
            font-size="12" font-weight="400"
            font-family="${FONT_FAMILY}">
            ${escapeXml(dateRange)}
          </text>
        </g>
      </g>
    `;
  };

  // 1. Total Contributions
  columns.push(renderColumn(
    colIndex++,
    iconContributions(theme.icon),
    theme.icon,
    formatNumber(stats.totalContributions),
    t('streak.total', locale),
    `${formatShortDate(stats.firstContribution, locale)} - Present`
  ));

  // 2. Current Streak
  if (!options.hideCurrentStreak) {
    addDivider(colWidth * colIndex);
    columns.push(renderColumn(
      colIndex++,
      iconFire(theme.orange),
      theme.orange,
      formatNumber(stats.currentStreak.length),
      t('streak.current', locale),
      `${formatShortDate(stats.currentStreak.start, locale)} - ${formatShortDate(stats.currentStreak.end, locale)}`,
      true // isCenter
    ));
  }

  // 3. Longest Streak
  if (!options.hideLongestStreak) {
    addDivider(colWidth * colIndex);
    columns.push(renderColumn(
      colIndex++,
      iconStar(theme.yellow),
      theme.yellow,
      formatNumber(stats.longestStreak.length),
      t('streak.longest', locale),
      `${formatShortDate(stats.longestStreak.start, locale)} - ${formatShortDate(stats.longestStreak.end, locale)}`
    ));
  }

  const body = `
    ${columns.join('')}
  `;

  const cardTitle = options.customTitle ?? t('streak.title', locale);

  return renderBaseCard({
    body,
    options: { ...options, width: CARD_WIDTH, height: CARD_HEIGHT },
    title: cardTitle,
    description: 'GitHub Streak Stats',
  });
}
