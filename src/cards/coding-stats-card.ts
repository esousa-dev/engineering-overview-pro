// ============================================================
// Coding Stats Card — pure SVG renderer (Redesigned)
// ============================================================
// Layout: Metric chips → Stacked language bar → Project rows
// Replaces the dual-column WakaTime layout with a cleaner
// top-to-bottom information hierarchy.
// ============================================================

import { renderBaseCard, FONT_FAMILY } from '../common/card.js';
import { escapeXml, formatDuration } from '../common/utils.js';

import type { CodingStatsData, CardOptions } from '../types/index.js';

interface CodingStatsCardOptions extends CardOptions {
  readonly langsCount: number;
}

// ── Palette tokens (Dracula Black compatible) ────────────────
const COLOR = {
  chipBg: '#161b22',
  chipBorder: '#21262d',
  divider: '#21262d',
  label: '#484f58',
  value: '#e6edf3',
  text: '#c9d1d9',
  muted: '#8b949e',
  barTrack: '#161b22',
  rowBg: '#161b22',
  disclaimer: '#30363d',
} as const;

// ── Metric Chip ──────────────────────────────────────────────
function renderChip(
  x: number,
  y: number,
  width: number,
  label: string,
  value: string,
  delay: number,
  disableAnimations: boolean,
): string {
  const stagger = disableAnimations
    ? ''
    : `opacity:0;animation:fadeSlideIn 0.5s ease ${String(delay)}ms forwards;`;
  return `
    <g style="${stagger}">
      <rect x="${String(x)}" y="${String(y)}" width="${String(width)}" height="38" rx="6"
            fill="${COLOR.chipBg}" stroke="${COLOR.chipBorder}" stroke-width="0.8"/>
      <text x="${String(x + 12)}" y="${String(y + 14)}"
            fill="${COLOR.label}" font-family="${FONT_FAMILY}" font-size="10"
            letter-spacing="0.4">${escapeXml(label)}</text>
      <text x="${String(x + 12)}" y="${String(y + 30)}"
            fill="${COLOR.value}" font-family="${FONT_FAMILY}" font-size="15"
            font-weight="700">${escapeXml(value)}</text>
    </g>`;
}

// ── Stacked Language Bar ─────────────────────────────────────
function renderLanguageBar(
  languages: CodingStatsData['languages'],
  barWidth: number,
  x: number,
  y: number,
  delay: number,
  disableAnimations: boolean,
): string {
  const stagger = disableAnimations
    ? ''
    : `opacity:0;animation:fadeSlideIn 0.5s ease ${String(delay)}ms forwards;`;

  // 1. Normalize percentages to 100% total
  const totalPercent = languages.reduce((acc, l) => acc + l.percent, 0);
  const normalizedLangs = languages.map((l) => ({
    ...l,
    normalizedPercent: totalPercent > 0 ? (l.percent / totalPercent) * 100 : 0,
  }));

  // 2. Build segments and pre-calculate centers for labels
  let offset = 0;
  const layout = normalizedLangs.map((lang) => {
    const w = (lang.normalizedPercent / 100) * barWidth;
    const center = offset + w / 2;
    const segment = `<rect x="${String(offset)}" y="0" width="${String(w)}" height="8" fill="${lang.color}"/>`;
    offset += w;
    return { segment, center, ...lang };
  });

  // 3. Render segments
  const segments = layout.map((l) => l.segment).join('');

  // 4. Render rotated legends
  const legends = layout
    .map((l) => {
      // We position the label under the segment center
      // and rotate it 45 degrees.
      return `
      <g transform="translate(${String(l.center)}, 12) rotate(45)">
        <circle cx="0" cy="0" r="3.5" fill="${l.color}"/>
        <text x="8" y="4" fill="${COLOR.text}" font-family="${FONT_FAMILY}" font-size="10.5" font-weight="600">${escapeXml(l.name)}</text>
        <text x="8" y="15" fill="${COLOR.label}" font-family="${FONT_FAMILY}" font-size="9">${l.percent.toFixed(1)}%</text>
      </g>
    `;
    })
    .join('');

  return `
    <g transform="translate(${String(x)}, ${String(y)})" style="${stagger}">
      <text x="0" y="0" fill="${COLOR.label}" font-family="${FONT_FAMILY}" font-size="10" letter-spacing="0.4">LANGUAGES</text>
      <g transform="translate(0, 10)">
        <rect x="0" y="0" width="${String(barWidth)}" height="8" rx="4" fill="${COLOR.barTrack}"/>
        <clipPath id="langBarClip"><rect x="0" y="0" width="${String(barWidth)}" height="8" rx="4"/></clipPath>
        <g clip-path="url(#langBarClip)">${segments}</g>
      </g>
      <g transform="translate(0, 20)">${legends}</g>
    </g>`;
}

// ── Project Row ──────────────────────────────────────────────
function renderProjectRow(
  project: CodingStatsData['projects'][number],
  index: number,
  y: number,
  maxWidth: number,
  color: string,
  paddingX: number,
  delay: number,
  disableAnimations: boolean,
): string {
  const stagger = disableAnimations
    ? ''
    : `opacity:0;animation:fadeSlideIn 0.5s ease ${String(delay)}ms forwards;`;
  const hasZebraBg = index % 2 === 0;
  const bgRect = hasZebraBg
    ? `<rect x="-8" y="0" width="${String(maxWidth + paddingX)}" height="24" rx="4" fill="${COLOR.rowBg}" opacity="0.5"/>`
    : '';

  return `
    <g transform="translate(${String(paddingX)}, ${String(y)})" style="${stagger}">
      ${bgRect}
      <circle cx="6" cy="12" r="3" fill="${color}"/>
      <text x="16" y="15.5" fill="${COLOR.text}" font-family="${FONT_FAMILY}" font-size="12">
        ${escapeXml(project.name)}
      </text>
      <text x="${String(maxWidth)}" y="15.5" fill="${COLOR.muted}" font-family="${FONT_FAMILY}" font-size="12" text-anchor="end">
        ${escapeXml(formatDuration(project.estimatedSeconds))}
      </text>
    </g>`;
}

// ── Main Renderer ────────────────────────────────────────────
export function renderCodingStatsCard(
  data: CodingStatsData,
  options: CodingStatsCardOptions,
): string {
  const { langsCount } = options;

  const CARD_WIDTH = 648; // Stretched by 20% (540 * 1.2)
  const PADDING_X = 25;
  const CONTENT_WIDTH = CARD_WIDTH - PADDING_X * 2;

  const topLangs = data.languages.slice(0, langsCount);
  const topProjects = data.projects.slice(0, 5);

  // ── Y-cursor tracking ──────────────────────────────────────
  // Backed off to -15 for a clean, minimal top padding (approx 15px from edge)
  let cursorY = -15;

  // ── Title ──────────────────────────────────────────────────

  const header = `
    <text x="${String(PADDING_X)}" y="${String(cursorY + 5)}"
          fill="${options.theme.title}" font-family="${FONT_FAMILY}"
          font-weight="700" font-size="16">
      Coding Stats
    </text>
    <text x="${String(CARD_WIDTH - PADDING_X)}" y="${String(cursorY + 5)}"
          fill="${COLOR.label}" font-family="${FONT_FAMILY}"
          font-size="9" text-anchor="end">
      estimated · last 7 days
    </text>`;

  cursorY += 20;

  // ── Metric Chips ───────────────────────────────────────────
  // Adjusted widths to fill 598px (CONTENT_WIDTH)
  // Total gap = 3 * 12px = 36px. Remaining = 562px.
  // Proportions: 160, 160, 120, 122
  const chipY = cursorY;
  const gap = 12;
  const c1w = 160;
  const c2w = 160;
  const c3w = 120;
  const c4w = CONTENT_WIDTH - (c1w + c2w + c3w + gap * 3);

  const chips = [
    renderChip(PADDING_X, chipY, c1w, 'TOTAL TIME', formatDuration(data.totalSeconds), 0, true),
    renderChip(
      PADDING_X + c1w + gap,
      chipY,
      c2w,
      'DAILY AVG',
      formatDuration(data.dailyAverageSeconds),
      0,
      true,
    ),
    renderChip(
      PADDING_X + c1w + c2w + gap * 2,
      chipY,
      c3w,
      'SESSIONS',
      String(data.sessions),
      0,
      true,
    ),
    renderChip(
      PADDING_X + c1w + c2w + c3w + gap * 3,
      chipY,
      c4w,
      'DAYS',
      String(data.activeDays),
      0,
      true,
    ),
  ].join('');

  cursorY += 38 + 20; // Height + Gap

  // ── Divider 1 ──────────────────────────────────────────────
  const divider1 = `<line x1="${String(PADDING_X)}" y1="${String(cursorY)}" x2="${String(CARD_WIDTH - PADDING_X)}" y2="${String(cursorY)}" stroke="${COLOR.divider}" stroke-width="1"/>`;
  cursorY += 15;

  // ── Language Bar ───────────────────────────────────────────
  const langBar =
    topLangs.length > 0
      ? renderLanguageBar(topLangs, CONTENT_WIDTH, PADDING_X, cursorY, 0, true)
      : '';

  // Space for rotated legends (approx 65-75px depending on string length)
  cursorY += topLangs.length > 0 ? 80 : 0;

  // ── Divider 2 ──────────────────────────────────────────────
  const divider2 =
    topProjects.length > 0
      ? `<line x1="${String(PADDING_X)}" y1="${String(cursorY)}" x2="${String(CARD_WIDTH - PADDING_X)}" y2="${String(cursorY)}" stroke="${COLOR.divider}" stroke-width="1"/>`
      : '';
  cursorY += topProjects.length > 0 ? 18 : 0;

  // ── Projects Header ────────────────────────────────────────
  const projectsHeader =
    topProjects.length > 0
      ? `<g transform="translate(${String(PADDING_X)}, ${String(cursorY)})">
        <text x="0" y="0" fill="${COLOR.label}" font-family="${FONT_FAMILY}" font-size="9" font-weight="600" letter-spacing="0.5">TOP PROJECTS</text>
        <text x="${String(CONTENT_WIDTH)}" y="0" fill="${COLOR.label}" font-family="${FONT_FAMILY}" font-size="9" font-weight="600" letter-spacing="0.5" text-anchor="end">TIME</text>
      </g>`
      : '';

  cursorY += topProjects.length > 0 ? 18 : 0;

  // ── Project Rows ───────────────────────────────────────────
  const ROW_HEIGHT = 26;
  const projectRows = topProjects
    .map((project, i) => {
      const color = project.color;
      const rowY = cursorY + i * ROW_HEIGHT;
      return renderProjectRow(project, i, rowY, CONTENT_WIDTH, color, PADDING_X, 0, true);
    })
    .join('');

  // ── Adjust project row render to not use transform for the row itself ────────────────
  // Need to fix renderProjectRow to accept absolute X/Y instead of transform if needed,
  // but let's try with fixed transform first.

  cursorY += topProjects.length * ROW_HEIGHT + 10;

  // ── Footer ─────────────────────────────────────────────────
  cursorY += 8; // Small top padding for footer
  const footer = `
    <text x="${String(CARD_WIDTH / 2)}" y="${String(cursorY)}"
          fill="${COLOR.disclaimer}" font-family="${FONT_FAMILY}"
          font-size="8.5" text-anchor="middle">
      Estimated from GitHub events
    </text>`;

  cursorY += 20;

  // ── Assemble ───────────────────────────────────────────────
  const body = [
    header,
    chips,
    divider1,
    langBar,
    divider2,
    projectsHeader,
    projectRows,
    footer,
  ].join('\n');

  // When calculating final height, we must account for the 30px offset from renderBaseCard
  // and minimize the padding after the footer.
  const finalHeight = cursorY + 15;

  return renderBaseCard({
    body,
    options: {
      ...options,
      hideTitle: true,
      width: CARD_WIDTH,
      height: finalHeight,
    },
    title: '',
    description: 'Coding stats estimated from GitHub activity',
  });
}
