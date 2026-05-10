// ============================================================
// Top Languages card — pure SVG renderer
// ============================================================

import { renderBaseCard, FONT_FAMILY } from '../common/card.js';
import { escapeXml } from '../common/utils.js';
import { t } from '../common/i18n.js';

import type { LanguageData, CardOptions } from '../types/index.js';

export interface TopLangsCardOptions extends CardOptions {
  readonly hideProgress: boolean;
  readonly hideLangs: ReadonlyArray<string>; // Currently unused in renderer but good for options type
}

/**
 * Render Top Languages card SVG.
 * Pure function: (data, options) => string.
 */
export function renderTopLangsCard(
  langs: ReadonlyArray<LanguageData>,
  options: TopLangsCardOptions,
): string {
  const { theme, locale, disableAnimations } = options;

  const CARD_WIDTH = 495;
  const CARD_PADDING_TOP = 15;
  const BAR_WIDTH = 445;
  const BAR_X = 25;
  const BAR_Y = CARD_PADDING_TOP;

  // Random ID for clipPath to avoid conflicts between multiple cards on the same page
  const maskId = `clip-langs-${Math.random().toString(36).slice(2, 8)}`;

  let currentX = BAR_X;
  const totalPercentage = langs.reduce((sum, lang) => sum + lang.percentage, 0);

  const progressBars = langs
    .map((lang) => {
      // Scale width so the sum of displayed languages fills 100% of the available bar width
      const fraction = totalPercentage > 0 ? lang.percentage / totalPercentage : 0;
      const width = BAR_WIDTH * fraction;
      const rect = `<rect x="${String(currentX)}" y="${String(BAR_Y)}" width="${String(width)}" height="12" fill="${lang.color}" />`;
      currentX += width;
      return rect;
    })
    .join('');

  const progressBarSvg = options.hideProgress
    ? ''
    : `
      <defs>
        <clipPath id="${maskId}">
          <rect x="${String(BAR_X)}" y="${String(BAR_Y)}" rx="6" ry="6" width="${disableAnimations ? String(BAR_WIDTH) : '0'}" height="12">
            ${
              disableAnimations
                ? ''
                : `<animate attributeName="width" from="0" to="${String(BAR_WIDTH)}" dur="1s" fill="freeze" calcMode="spline" keyTimes="0; 1" keySplines="0.25 0.1 0.25 1" />`
            }
          </rect>
        </clipPath>
      </defs>
      <!-- Background of the bar -->
      <rect x="${String(BAR_X)}" y="${String(BAR_Y)}" rx="6" ry="6" width="${String(BAR_WIDTH)}" height="12" fill="${theme.surface}" />
      <!-- Sliced segments -->
      <g clip-path="url(#${maskId})">
        ${progressBars}
      </g>
    `;

  const COLUMNS = 2;
  const COLUMN_GAP = 225; // 495 width allows for 25 left + 225 gap = 250 start for col 2
  const START_Y = options.hideProgress ? CARD_PADDING_TOP : BAR_Y + 35;
  const LINE_HEIGHT = 30;

  const itemsPerColumn = Math.ceil(langs.length / COLUMNS);

  const langList = langs
    .map((lang, index) => {
      const col = Math.floor(index / itemsPerColumn);
      const row = index % itemsPerColumn;
      const x = BAR_X + col * COLUMN_GAP;
      const y = START_Y + row * LINE_HEIGHT;
      const delay = (index + 1) * 150;
      const staggerStyle = disableAnimations ? '' : `animation-delay: ${String(delay)}ms;`;

      return `
      <g transform="translate(${String(x)}, ${String(y)})">
        <g class="stagger" style="${staggerStyle}">
          <!-- Language Color Dot -->
          <circle cx="5" cy="0" r="5" fill="${lang.color}" />
          
          <!-- Language Name -->
          <text x="20" y="0"
            dominant-baseline="central"
            fill="${theme.text}"
            font-size="14" font-weight="600"
            font-family="${FONT_FAMILY}">
            ${escapeXml(lang.name)}
          </text>
          
          <!-- Language Percentage -->
          <text x="180" y="0"
            dominant-baseline="central"
            text-anchor="end"
            fill="${theme.muted}"
            font-size="13" font-weight="400"
            font-family="${FONT_FAMILY}">
            ${String(lang.percentage)}%
          </text>
        </g>
      </g>`;
    })
    .join('');

  const bodyOffset = options.hideTitle ? 30 : 55;
  const paddingBottom = 26;
  const lastItemY = langs.length > 0 ? START_Y + (itemsPerColumn - 1) * LINE_HEIGHT : 0;

  const bodyHeight = langs.length > 0 ? bodyOffset + lastItemY + paddingBottom : 120;
  const cardHeight = Math.max(bodyHeight, 140);

  const body = `
    ${progressBarSvg}
    ${langList}
    ${
      langs.length === 0
        ? `<text x="25" y="30" fill="${theme.muted}" font-size="14" font-family="${FONT_FAMILY}">No languages available.</text>`
        : ''
    }
  `;

  const title = options.customTitle ?? t('top-langs.title', locale);

  return renderBaseCard({
    body,
    options: { ...options, width: CARD_WIDTH, height: cardHeight },
    title,
    description: `Top Languages`,
  });
}
