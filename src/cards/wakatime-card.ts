// ============================================================
// WakaTime Card — pure SVG renderer
// ============================================================

import { renderBaseCard } from '../common/card.js';
import { escapeXml, formatDuration } from '../common/utils.js';
import { t } from '../common/i18n.js';
import { iconClock } from '../common/icons.js';

import type { WakaTimeData, CardOptions } from '../types/index.js';

interface WakatimeCardOptions extends CardOptions {
  readonly langsCount: number;
}

/**
 * Render WakaTime stats card SVG.
 * Pure function: (data, options) => string.
 */
export function renderWakatimeCard(data: WakaTimeData, options: WakatimeCardOptions): string {
  const { theme, locale, disableAnimations, langsCount } = options;

  const topLangs = data.languages.slice(0, langsCount);
  const totalSeconds = data.totalSeconds;

  const CARD_WIDTH = 495;
  const BAR_WIDTH = 250;
  const LINE_HEIGHT = 20;

  // Header stats: Total and Daily Average
  const headerStats = `
    <g transform="translate(25, 0)">
      <g class="stagger" style="animation-delay: 150ms;">
        ${iconClock(theme.icon)}
        <text x="25" y="8" class="stat-label" dominant-baseline="central" fill="${theme.text}">
          ${escapeXml(t('wakatime.totalTime', locale))}:
        </text>
        <text x="200" y="8" class="stat-value" dominant-baseline="central" fill="${theme.text}" text-anchor="end">
          ${escapeXml(formatDuration(totalSeconds))}
        </text>
      </g>
      <g class="stagger" style="animation-delay: 300ms;" transform="translate(0, 25)">
        <text x="25" y="8" class="stat-label" dominant-baseline="central" fill="${theme.text}">
          ${escapeXml(t('wakatime.dailyAverage', locale))}:
        </text>
        <text x="200" y="8" class="stat-value" dominant-baseline="central" fill="${theme.text}" text-anchor="end">
          ${escapeXml(formatDuration(data.dailyAverage))}
        </text>
      </g>
    </g>
  `;

  // Language bars
  const langRows = topLangs
    .map((lang, index) => {
      const y = index * (LINE_HEIGHT + 15);
      const delay = (index + 3) * 150;
      const staggerStyle = disableAnimations ? '' : `animation-delay: ${String(delay)}ms;`;
      const progress = (lang.percent / 100) * BAR_WIDTH;

      const barAnimation = disableAnimations
        ? `width: ${String(progress)}px;`
        : `animation: barAnimation${String(index)} 1s ease-in-out forwards; width: 0;`;

      const keyframes = disableAnimations
        ? ''
        : `
        @keyframes barAnimation${String(index)} {
          to { width: ${String(progress)}px; }
        }`;

      return `
      <g transform="translate(0, ${String(y)})">
        <style>${keyframes}</style>
        <g class="stagger" style="${staggerStyle}">
          <text x="0" y="8" class="stat-label" dominant-baseline="central" fill="${theme.text}" font-size="12">
            ${escapeXml(lang.name)}
          </text>
          <text x="${String(BAR_WIDTH + 5)}" y="21" class="small" dominant-baseline="central" fill="${theme.muted}" text-anchor="start">
            ${lang.percent.toFixed(1)}%
          </text>
          <rect x="0" y="18" width="${String(BAR_WIDTH)}" height="6" fill="${theme.surface}" rx="3" ry="3" fill-opacity="0.3" />
          <rect x="0" y="18" height="6" fill="${lang.color}" rx="3" ry="3" style="${barAnimation}" />
        </g>
      </g>`;
    })
    .join('');

  const body = `
    ${headerStats}
    <g transform="translate(25, 65)">
      ${langRows}
    </g>
  `;

  const footerY = 65 + topLangs.length * (LINE_HEIGHT + 15) + 5;
  const bestDaySection = data.bestDay
    ? `
    <g transform="translate(25, ${String(footerY)})">
      <g class="stagger" style="animation-delay: ${String((topLangs.length + 3) * 150)}ms;">
        <text x="0" y="8" class="small" dominant-baseline="central" fill="${theme.muted}">
          ${escapeXml(t('wakatime.bestDay', locale))}: ${escapeXml(data.bestDay.date)} (${formatDuration(data.bestDay.totalSeconds)})
        </text>
      </g>
    </g>`
    : '';

  const bodyOffset = options.hideTitle ? 30 : 55;
  const paddingBottom = 20;
  const cardHeight = Math.max(
    bodyOffset + footerY + (data.bestDay ? 25 : 0) + paddingBottom,
    160,
  );

  const title = options.customTitle ?? t('wakatime.title', locale);

  return renderBaseCard({
    body: body + bestDaySection,
    options: { ...options, width: CARD_WIDTH, height: cardHeight },
    title,
    description: `WakaTime coding stats`,
  });
}
