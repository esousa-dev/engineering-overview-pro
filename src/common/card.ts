// ============================================================
// Base SVG card template and error card renderer
// ============================================================

import { escapeXml } from './utils.js';

import type { CardOptions, ThemeConfig } from '../types/index.js';

const FONT_FAMILY = "'Segoe UI', Ubuntu, 'Helvetica Neue', sans-serif";

interface BaseCardParams {
  readonly body: string;
  readonly options: CardOptions;
  readonly title?: string | undefined;
  readonly description?: string | undefined;
}

/**
 * Generate the CSS animation keyframes for card content.
 */
function renderAnimationStyles(disabled: boolean): string {
  if (disabled) {
    return `
      .stagger { opacity: 1; }
    `;
  }

  return `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(5px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .stagger { opacity: 1; }
    }

    @media (prefers-reduced-motion: no-preference) {
      .stagger {
        opacity: 0;
        animation: fadeInUp 300ms ease-in-out forwards;
      }
    }
  `;
}

/**
 * Render base SVG card wrapper with border, background, title, and animations.
 * All card renderers compose inside this.
 */
export function renderBaseCard({ body, options, title, description }: BaseCardParams): string {
  const {
    theme,
    hideBorder,
    borderRadius,
    hideTitle,
    customTitle,
    disableAnimations,
    width,
    height,
  } = options;
  const displayTitle = customTitle ?? title ?? '';
  const displayDesc = description ?? displayTitle;

  const borderAttrs = hideBorder
    ? `stroke="none" stroke-width="0"`
    : `stroke="url(#border-grad)" stroke-width="1"`;

  const titleSection = hideTitle
    ? ''
    : `
    <g transform="translate(24, 33)">
      <g class="stagger" style="animation-delay: 0ms;">
        <circle cx="3" cy="0" r="3" fill="${theme.icon}" fill-opacity="0.75" />
        <text x="14" y="0"
          class="title"
          dominant-baseline="central"
          fill="${theme.title}"
          font-size="14"
          font-weight="600"
          letter-spacing="0.15"
          font-family="${FONT_FAMILY}">
          ${escapeXml(displayTitle)}
        </text>
      </g>
    </g>
    <line x1="24" y1="50" x2="${String(width - 24)}" y2="50"
      stroke="${theme.border}" stroke-width="1" stroke-opacity="0.22" />`;

  const bodyOffset = hideTitle ? 30 : 55;

  return `<svg xmlns="http://www.w3.org/2000/svg"
  width="${String(width)}" height="${String(height)}"
  viewBox="0 0 ${String(width)} ${String(height)}"
  role="img"
  aria-labelledby="card-title card-desc">
  <title id="card-title">${escapeXml(displayTitle)}</title>
  <desc id="card-desc">${escapeXml(displayDesc)}</desc>
  <defs>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="24" flood-color="#000000" flood-opacity="0.15" />
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000000" flood-opacity="0.05" />
    </filter>
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg}" />
      <stop offset="100%" stop-color="${theme.surface}" />
    </linearGradient>
    <linearGradient id="border-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.border}" stop-opacity="0.6" />
      <stop offset="100%" stop-color="${theme.border}" stop-opacity="0.1" />
    </linearGradient>
  </defs>
  <style>
    ${renderAnimationStyles(disableAnimations)}
    .title { font-family: ${FONT_FAMILY}; }
    .stat-label { font-family: ${FONT_FAMILY}; font-size: 14px; font-weight: 500; }
    .stat-value { font-family: ${FONT_FAMILY}; font-size: 14px; font-weight: 700; }
    .small { font-family: ${FONT_FAMILY}; font-size: 12px; font-weight: 400; }
  </style>
  <rect x="0.5" y="0.5"
    rx="${String(borderRadius)}" ry="${String(borderRadius)}"
    width="${String(width - 1)}" height="${String(height - 1)}"
    fill="url(#bg-grad)"
    filter="url(#shadow)"
    ${borderAttrs} />
  <rect x="1" y="1"
    rx="${String(borderRadius)}" ry="${String(borderRadius)}"
    width="${String(width - 2)}" height="1"
    fill="#ffffff" opacity="0.05" />
  ${titleSection}
  <g transform="translate(0, ${String(bodyOffset)})">
    ${body}
  </g>
</svg>`;
}

/**
 * Render a styled error card — always returned as SVG, never JSON/text.
 * HTTP 200 with error content so GitHub README renders it.
 */
export function renderErrorCard(
  message: string,
  theme: ThemeConfig,
  width: number = 495,
  height: number = 120,
): string {
  return `<svg xmlns="http://www.w3.org/2000/svg"
  width="${String(width)}" height="${String(height)}"
  viewBox="0 0 ${String(width)} ${String(height)}"
  role="img"
  aria-labelledby="error-title error-desc">
  <title id="error-title">Error</title>
  <desc id="error-desc">${escapeXml(message)}</desc>
  <defs>
    <filter id="error-shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="24" flood-color="#000000" flood-opacity="0.15" />
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000000" flood-opacity="0.05" />
    </filter>
    <linearGradient id="error-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg}" />
      <stop offset="100%" stop-color="${theme.surface}" />
    </linearGradient>
    <linearGradient id="error-border" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.red}" stop-opacity="0.6" />
      <stop offset="100%" stop-color="${theme.red}" stop-opacity="0.1" />
    </linearGradient>
  </defs>
  <rect x="0.5" y="0.5"
    rx="12" ry="12"
    width="${String(width - 1)}" height="${String(height - 1)}"
    fill="url(#error-bg)"
    filter="url(#error-shadow)"
    stroke="url(#error-border)" stroke-width="1.5" />
  <rect x="1" y="1"
    rx="12" ry="12"
    width="${String(width - 2)}" height="1"
    fill="#ffffff" opacity="0.05" />
  <g transform="translate(25, 35)">
    <rect x="0" y="-8" width="2" height="16" rx="1" fill="${theme.red}" />
    <text x="12" y="0"
      dominant-baseline="central"
      fill="${theme.red}"
      font-size="16" font-weight="600"
      font-family="${FONT_FAMILY}">
      Error
    </text>
    <text x="12" y="30"
      dominant-baseline="central"
      fill="${theme.text}"
      font-size="14" font-weight="400"
      font-family="${FONT_FAMILY}">
      ${escapeXml(message)}
    </text>
  </g>
</svg>`;
}

export { FONT_FAMILY };
