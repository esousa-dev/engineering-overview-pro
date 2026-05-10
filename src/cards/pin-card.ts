import { renderBaseCard, FONT_FAMILY } from '../common/card.js';
import { escapeXml, formatNumber, wrapText } from '../common/utils.js';
import { iconStar, iconFork, iconRepo, iconArchive } from '../common/icons.js';
import type { PinData, CardOptions } from '../types/index.js';

export type PinCardOptions = CardOptions;

// ─── Layout Constants ────────────────────────────────────────
const SINGLE_CARD_WIDTH = 460;
const SINGLE_CARD_HEIGHT = 180;
const GRID_COLUMNS = 2;
const GRID_GAP_X = 20;
const GRID_GAP_Y = 20;
const GRID_PADDING_X = 30;
const GRID_PADDING_TOP = 60;
const GRID_PADDING_BOTTOM = 30;

// ─── Helpers ─────────────────────────────────────────────────

function truncateRepoName(name: string, maxLen: number): string {
  return name.length > maxLen ? name.substring(0, maxLen - 3) + '...' : name;
}

// ─── Shared Content Renderer ────────────────────────────────

/**
 * Shared body for both grid items and standalone cards.
 * Ensures consistent alignment and layout.
 */
function renderCardBody(data: PinData, options: PinCardOptions, isStandalone = false): string {
  const { theme } = options;
  const br = options.borderRadius;
  const width = SINGLE_CARD_WIDTH;
  const height = SINGLE_CARD_HEIGHT;

  const repoName = truncateRepoName(data.name, isStandalone ? 36 : 30);
  const accentColor = data.primaryLanguage?.color || theme.purple;
  const repoIcon = data.isFork ? iconFork(accentColor) : iconRepo(accentColor);
  const ownerSlash = `${data.owner} /`;

  // Description: wrap to 2 lines, better density
  const descLines = wrapText(data.description || 'No description provided.', isStandalone ? 64 : 58).slice(0, 2);
  const descriptionHtml = descLines
    .map((line, i) => `<tspan x="0" dy="${i === 0 ? '0' : '1.4em'}">${escapeXml(line)}</tspan>`)
    .join('');

  // Language pill & stats
  const langName = data.primaryLanguage?.name || '';
  const pillWidth = langName ? langName.length * 8 + 38 : 0;

  const langPill = langName ? `
    <g transform="translate(0, 0)">
      <rect width="${String(pillWidth)}" height="26" rx="13" fill="${accentColor}" fill-opacity="0.1" stroke="${accentColor}" stroke-opacity="0.2" stroke-width="1" />
      <circle cx="14" cy="13" r="4.5" fill="${accentColor}" />
      <text x="24" y="13" class="lang-text" dominant-baseline="central">${escapeXml(langName)}</text>
    </g>` : '';

  const statsX = langName ? pillWidth + 16 : 0;

  const starsStat = `
    <g transform="translate(${String(statsX)}, 0)">
      <g transform="translate(0, 5)">${iconStar(theme.muted)}</g>
      <text x="22" y="13" class="stat-text" dominant-baseline="central">${formatNumber(data.stargazerCount)}</text>
    </g>`;

  const forksStat = `
    <g transform="translate(${String(statsX + 65)}, 0)">
      <g transform="translate(0, 5)">${iconFork(theme.muted)}</g>
      <text x="22" y="13" class="stat-text" dominant-baseline="central">${formatNumber(data.forkCount)}</text>
    </g>`;

  const archivedBadge = data.isArchived ? `
    <g transform="translate(0, 0)">
      <rect width="100" height="26" rx="13" fill="${theme.red}" fill-opacity="0.12" stroke="${theme.red}" stroke-opacity="0.3" stroke-width="1" />
      <g transform="translate(13, 5)">${iconArchive(theme.red)}</g>
      <text x="62" y="13" fill="${theme.red}" class="badge-text" text-anchor="middle" dominant-baseline="central">Archived</text>
    </g>` : '';

  // Unique ID for gradients to prevent overlap between cards
  const uniqueId = `pin-${data.name.replace(/[^a-zA-Z0-9]/g, '')}-${Math.floor(Math.random() * 10000)}`;

  return `
    <defs>
      <radialGradient id="glow-${uniqueId}" cx="0%" cy="0%" r="100%">
        <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.12" />
        <stop offset="100%" stop-color="${theme.surface}" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="border-${uniqueId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.5" />
        <stop offset="100%" stop-color="${theme.border}" stop-opacity="0.2" />
      </linearGradient>
    </defs>

    <!-- Base surface -->
    <rect x="0" y="0" width="${String(width)}" height="${String(height)}" rx="${String(br)}" fill="${theme.surface}" filter="url(#cardShadow)" />
    <!-- Language glow -->
    <rect x="0" y="0" width="${String(width)}" height="${String(height)}" rx="${String(br)}" fill="url(#glow-${uniqueId})" />
    <!-- Border -->
    <rect x="0" y="0" width="${String(width)}" height="${String(height)}" rx="${String(br)}" fill="none" stroke="url(#border-${uniqueId})" stroke-width="1.5" />

    <!-- Content -->
    <g transform="translate(26, 24)">
      <!-- Header -->
      <g>
        <g transform="translate(0, 0)">${repoIcon}</g>
        <text x="26" y="8" dominant-baseline="central">
          <tspan class="repo-owner">${escapeXml(ownerSlash)}</tspan>
          <tspan class="repo-name" dx="4">${escapeXml(repoName)}</tspan>
        </text>
      </g>

      <!-- Description -->
      <g transform="translate(0, 50)">
        <text class="repo-desc">${descriptionHtml}</text>
      </g>
    </g>

    <!-- Bottom stats -->
    <g transform="translate(26, ${String(height - 40)})">
      ${langPill}
      ${starsStat}
      ${forksStat}
      ${data.isArchived ? `<g transform="translate(${String(width - 26 - 26 - 100)}, 0)">${archivedBadge}</g>` : ''}
    </g>
  `;
}

/**
 * Render individual card body for grid placement.
 */
function renderSinglePinBody(data: PinData, options: PinCardOptions, _index: number): string {
  return renderCardBody(data, options, false);
}

// ─── Grid Renderer ───────────────────────────────────────────

/**
 * Render a premium grid SVG containing all pinned repository cards.
 */
export function renderPinnedCards(repos: PinData[], options: PinCardOptions): string {
  const rows = Math.ceil(repos.length / GRID_COLUMNS);
  const totalWidth = GRID_PADDING_X * 2 + GRID_COLUMNS * SINGLE_CARD_WIDTH + (GRID_COLUMNS - 1) * GRID_GAP_X;
  const totalHeight = GRID_PADDING_TOP + rows * SINGLE_CARD_HEIGHT + (rows - 1) * GRID_GAP_Y + GRID_PADDING_BOTTOM;

  const { theme, disableAnimations } = options;
  const borderRadius = options.borderRadius;

  const cards = repos.map((repo, i) => {
    const col = i % GRID_COLUMNS;
    const row = Math.floor(i / GRID_COLUMNS);
    const x = GRID_PADDING_X + col * (SINGLE_CARD_WIDTH + GRID_GAP_X);
    const y = GRID_PADDING_TOP + row * (SINGLE_CARD_HEIGHT + GRID_GAP_Y);
    const delay = 200 + i * 120;
    const cardSvg = renderSinglePinBody(repo, options, i);

    return `
      <g transform="translate(${String(x)}, ${String(y)})">
        <g class="card-enter" style="animation-delay: ${String(delay)}ms;">
          ${cardSvg}
        </g>
      </g>`;
  }).join('\n');

  return `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${String(totalWidth)}"
  height="${String(totalHeight)}"
  viewBox="0 0 ${String(totalWidth)} ${String(totalHeight)}"
  role="img"
  aria-label="Pinned Repositories"
>
  <title>Pinned Repositories${repos[0]?.owner ? ` — ${escapeXml(repos[0].owner)}` : ''}</title>

  <defs>
    <filter id="noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.03" />
      </feComponentTransfer>
      <feBlend in="SourceGraphic" mode="overlay" />
    </filter>

    <filter id="cardShadow" x="-4%" y="-4%" width="108%" height="112%">
      <feDropShadow dx="0" dy="2" stdDeviation="6" flood-color="rgba(0,0,0,0.25)" />
    </filter>

    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${theme.purple}" stop-opacity="0" />
      <stop offset="20%" stop-color="${theme.purple}" stop-opacity="0.8" />
      <stop offset="50%" stop-color="${theme.pink}" stop-opacity="1" />
      <stop offset="80%" stop-color="${theme.orange}" stop-opacity="0.8" />
      <stop offset="100%" stop-color="${theme.orange}" stop-opacity="0" />
    </linearGradient>
  </defs>

  <style>
    .header-title { font-family: ${FONT_FAMILY}; font-size: 14px; font-weight: 700; fill: ${theme.title}; letter-spacing: 0.08em; text-transform: uppercase; }
    .header-count { font-family: ${FONT_FAMILY}; font-size: 11px; font-weight: 400; fill: ${theme.muted}; }
    .repo-name { font-family: ${FONT_FAMILY}; font-size: 17px; font-weight: 700; fill: ${theme.title}; letter-spacing: -0.2px; }
    .repo-owner { font-family: ${FONT_FAMILY}; font-size: 13px; font-weight: 400; fill: ${theme.muted}; letter-spacing: -0.2px; }
    .repo-desc { font-family: ${FONT_FAMILY}; font-size: 13px; fill: ${theme.text}; opacity: 0.85; line-height: 1.6; letter-spacing: -0.2px; }
    .stat-text { font-family: ${FONT_FAMILY}; font-size: 13px; font-weight: 600; fill: ${theme.muted}; letter-spacing: -0.2px; }
    .lang-text { font-family: ${FONT_FAMILY}; font-size: 13px; font-weight: 500; fill: ${theme.text}; letter-spacing: -0.2px; }
    .badge-text { font-family: ${FONT_FAMILY}; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }

    .card-enter { opacity: 0; animation: cardSlideIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
    @keyframes cardSlideIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    .header-line { animation: lineGrow 1s cubic-bezier(0.22, 1, 0.36, 1) forwards; transform-origin: center; }
    @keyframes lineGrow { from { transform: scaleX(0); } to { transform: scaleX(1); } }

    ${disableAnimations ? `
      .card-enter { opacity: 1; animation: none; }
      .header-line { animation: none; transform: scaleX(1); }
    ` : ''}
  </style>

  <rect x="0.5" y="0.5" width="${String(totalWidth - 1)}" height="${String(totalHeight - 1)}" rx="${String(borderRadius)}" fill="${theme.bg}" stroke="${options.hideBorder ? 'none' : theme.border}" stroke-opacity="0.3" />
  <rect x="0.5" y="0.5" width="${String(totalWidth - 1)}" height="${String(totalHeight - 1)}" rx="${String(borderRadius)}" fill="transparent" filter="url(#noise)" />

  <g transform="translate(${String(GRID_PADDING_X)}, 28)">
    <text class="header-title" x="0" y="0">Pinned Repositories</text>
    <text class="header-count" x="0" y="18">${String(repos.length)} repositories pinned on GitHub</text>
  </g>

  <line class="header-line" x1="${String(GRID_PADDING_X)}" y1="${String(GRID_PADDING_TOP - 8)}" x2="${String(totalWidth - GRID_PADDING_X)}" y2="${String(GRID_PADDING_TOP - 8)}" stroke="url(#headerGrad)" stroke-width="1.5" stroke-linecap="round" />

  ${cards}
</svg>`.trim();
}

// ─── Standalone Single Card Renderer ─────────────────────────

/**
 * Render individual repository pin card SVG.
 */
export function renderPinCard(data: PinData, options: PinCardOptions): string {
  const { theme, disableAnimations } = options;

  const body = `
    <defs>
      <filter id="cardShadow" x="-4%" y="-4%" width="108%" height="112%">
        <feDropShadow dx="0" dy="2" stdDeviation="6" flood-color="rgba(0,0,0,0.25)" />
      </filter>
    </defs>

    <style>
      .repo-name { font-family: ${FONT_FAMILY}; font-size: 17px; font-weight: 700; fill: ${theme.title}; letter-spacing: -0.2px; }
      .repo-owner { font-family: ${FONT_FAMILY}; font-size: 13px; font-weight: 400; fill: ${theme.muted}; letter-spacing: -0.2px; }
      .repo-desc { font-family: ${FONT_FAMILY}; font-size: 13px; fill: ${theme.text}; opacity: 0.85; line-height: 1.6; letter-spacing: -0.2px; }
      .stat-text { font-family: ${FONT_FAMILY}; font-size: 13px; font-weight: 600; fill: ${theme.muted}; letter-spacing: -0.2px; }
      .lang-text { font-family: ${FONT_FAMILY}; font-size: 13px; font-weight: 500; fill: ${theme.text}; letter-spacing: -0.2px; }
      .badge-text { font-family: ${FONT_FAMILY}; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    </style>

    ${renderCardBody(data, options, true)}
  `;

  return renderBaseCard({
    body,
    options: { ...options, width: SINGLE_CARD_WIDTH, height: SINGLE_CARD_HEIGHT, hideTitle: true },
    title: `${data.owner}/${data.name}`,
    description: data.description,
  });
}
