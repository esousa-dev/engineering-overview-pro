import { renderBaseCard, FONT_FAMILY } from '../common/card.js';
import { escapeXml } from '../common/utils.js';
import { t } from '../common/i18n.js';
import { iconArchive, iconCheck, iconShield } from '../common/icons.js';
import type { DevOpsData, CardOptions, ThemeConfig } from '../types/index.js';

interface StatItem {
  readonly key: string;
  readonly icon: string;
  readonly iconColor: string;
  readonly label: string;
  readonly value: string;
  readonly grade: string;
}

function getGradeColor(g: string, theme: ThemeConfig): string {
  const main = g.charAt(0).toUpperCase();
  if (main === 'S') return theme.purple;
  if (main === 'A') return theme.green;
  if (main === 'B') return theme.cyan;
  if (main === 'C') return theme.yellow;
  if (main === 'D') return theme.orange;
  return theme.red;
}

function getGradeProgress(g: string): number {
  if (g === 'S+') return 100;
  if (g === 'S') return 95;
  if (g === 'A++') return 92;
  if (g === 'A+') return 85;
  if (g === 'A') return 78;
  if (g === 'B+') return 65;
  if (g === 'B') return 55;
  if (g === 'C') return 40;
  if (g === 'D') return 22;
  return 10;
}

function buildStatItems(data: DevOpsData, theme: ThemeConfig): ReadonlyArray<StatItem> {
  return [
    {
      key: 'cicd',
      icon: iconCheck(theme.cyan),
      iconColor: theme.cyan,
      label: 'CI/CD Pipeline',
      value: `${String(data.ciCd.hasActionsCount)}/${String(data.organization.totalRepos)} Actions · ${data.ciCd.successRate.toFixed(1)}% success rate`,
      grade: data.ciCd.grade,
    },
    {
      key: 'security',
      icon: iconShield(theme.purple),
      iconColor: theme.purple,
      label: 'Security Posture',
      value: `${String(data.security.codeFactorAPlusCount)}/${String(data.security.codeFactorTotal)} A+ CodeFactor · ${String(data.security.dependabotCount)} Dependabot alerts`,
      grade: data.security.grade,
    },
    {
      key: 'organization',
      icon: iconArchive(theme.green),
      iconColor: theme.green,
      label: 'Project Organization',
      value: `${String(data.organization.wellOrganizedCount)}/${String(data.organization.totalRepos)} organized · ${String(data.organization.archivedRepos)} archived`,
      grade: data.organization.grade,
    },
  ];
}

// ─── Score Panel ─────────────────────────────────────────────────────────────
// Rendered in LOCAL coordinates (0,0 = top-center of the block).
// The caller places the block via a <g transform="translate(cx, topY)">
// so the whole unit moves as one piece.

interface ScorePanelParams {
  readonly data: DevOpsData;
  readonly theme: ThemeConfig;
  readonly disabled: boolean;
}

// Exported dimensions so caller can compute centering.
const SCORE = {
  RADIUS: 54,
  STROKE_W: 5,
  PIP_GAP_Y: 14, // gap between circle bottom and pip label row
  PIP_LABEL_H: 9,
  PIP_VALUE_H: 14,
  PIP_ROW_GAP: 6,
  PIP_SPACING: 50, // horizontal distance between pips
} as const;

/** Total height of the score block (circle diameter + pips). */
export const SCORE_BLOCK_HEIGHT =
  SCORE.RADIUS * 2 + SCORE.PIP_GAP_Y + SCORE.PIP_LABEL_H + SCORE.PIP_ROW_GAP + SCORE.PIP_VALUE_H; // 108 + 14 + 9 + 6 + 14 = 151

function renderScorePanel({ data, theme, disabled }: ScorePanelParams): string {
  const { RADIUS, STROKE_W, PIP_GAP_Y, PIP_LABEL_H, PIP_ROW_GAP, PIP_SPACING } = SCORE;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  const normalizedGrade: string = data.overallGrade;
  const progressPct = getGradeProgress(normalizedGrade);
  const dashOffset = ((100 - progressPct) / 100) * CIRCUMFERENCE;
  const arcColor = getGradeColor(normalizedGrade, theme);
  const gradId = `dvGrad${normalizedGrade.replace(/[^a-zA-Z0-9]/g, 'X')}`;

  // In local coords: circle center is at (0, RADIUS)
  const CX = 0;
  const CY = RADIUS;

  const animStyle = disabled
    ? `stroke-dashoffset: ${String(dashOffset)};`
    : `animation: dvArcIn 0.85s cubic-bezier(0.25,0.46,0.45,0.94) 400ms forwards; stroke-dashoffset: ${String(CIRCUMFERENCE)};`;

  const animKeys = disabled
    ? ''
    : `
    @keyframes dvArcIn {
      from { stroke-dashoffset: ${String(CIRCUMFERENCE)}; }
      to   { stroke-dashoffset: ${String(dashOffset)}; }
    }
    @media (prefers-reduced-motion: reduce) {
      .dv-arc { animation: none !important; stroke-dashoffset: ${String(dashOffset)} !important; }
    }`;

  // Pip rows — y relative to block top (local coords)
  const pipLabelY = CY + RADIUS + PIP_GAP_Y + PIP_LABEL_H / 2;
  const pipValueY = pipLabelY + PIP_LABEL_H / 2 + PIP_ROW_GAP + 7; // +7 ≈ half of 14px font

  const dims = [
    { label: 'CI/CD', grade: data.ciCd.grade },
    { label: 'SEC', grade: data.security.grade },
    { label: 'ORG', grade: data.organization.grade },
  ] as const;

  const pipSvg = dims
    .map((d, i) => {
      const px = (i - 1) * PIP_SPACING; // -50, 0, +50 — centered on CX=0
      const pc = getGradeColor(d.grade, theme);
      return `
      <text x="${String(px)}" y="${String(pipLabelY)}"
        text-anchor="middle" dominant-baseline="central"
        font-family="${FONT_FAMILY}" font-size="9" font-weight="500"
        letter-spacing="0.7" fill="${theme.muted}">
        ${escapeXml(d.label)}
      </text>
      <text x="${String(px)}" y="${String(pipValueY)}"
        text-anchor="middle" dominant-baseline="central"
        font-family="${FONT_FAMILY}" font-size="13" font-weight="600"
        fill="${pc}">
        ${escapeXml(d.grade)}
      </text>`;
    })
    .join('');

  const sepY = CY + RADIUS + Math.round(PIP_GAP_Y / 2);

  return `
    <style>${animKeys}</style>
    <defs>
      <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stop-color="${arcColor}" stop-opacity="1" />
        <stop offset="100%" stop-color="${arcColor}" stop-opacity="0.4" />
      </linearGradient>
    </defs>

    <!-- track ring -->
    <circle cx="${String(CX)}" cy="${String(CY)}" r="${String(RADIUS)}"
      fill="none"
      stroke="${theme.border}"
      stroke-width="${String(STROKE_W)}"
      stroke-opacity="0.2" />

    <!-- progress arc -->
    <circle class="dv-arc"
      cx="${String(CX)}" cy="${String(CY)}" r="${String(RADIUS)}"
      fill="none"
      stroke="url(#${gradId})"
      stroke-width="${String(STROKE_W)}"
      stroke-linecap="round"
      stroke-dasharray="${String(CIRCUMFERENCE)}"
      style="${animStyle}"
      transform="rotate(-90 ${String(CX)} ${String(CY)})" />

    <!-- grade letter -->
    <text x="${String(CX)}" y="${String(CY - 9)}"
      text-anchor="middle" dominant-baseline="central"
      font-family="${FONT_FAMILY}" font-size="42" font-weight="400"
      fill="${arcColor}">
      ${escapeXml(normalizedGrade)}
    </text>

    <!-- OVERALL sub-label -->
    <text x="${String(CX)}" y="${String(CY + 18)}"
      text-anchor="middle" dominant-baseline="central"
      font-family="${FONT_FAMILY}" font-size="8" font-weight="500"
      letter-spacing="1.4" fill="${theme.muted}">
      SCORE
    </text>

    <!-- pip separator -->
    <line x1="${String(-PIP_SPACING - 10)}" y1="${String(sepY)}"
          x2="${String(PIP_SPACING + 10)}" y2="${String(sepY)}"
      stroke="${theme.border}" stroke-width="1" stroke-opacity="0.2" />

    ${pipSvg}`;
}

// ─── Main render ─────────────────────────────────────────────────────────────

export function renderDevOpsCard(data: DevOpsData, options: CardOptions): string {
  const { theme, locale, disableAnimations } = options;

  // ── Layout constants ─────────────────────────────────────────────
  const CARD_WIDTH = 560;
  const ROW_HEIGHT = 80;
  const BODY_PAD_TOP = 24;
  const BOTTOM_PAD = 24;

  const LEFT_PAD = 24;
  const ACCENT_W = 2;
  const ICON_OFFSET = 14;
  const TEXT_X = 40;
  const SEP_RIGHT = 288;

  const DIVIDER_X = 318;
  const RIGHT_CX = DIVIDER_X + (CARD_WIDTH - DIVIDER_X) / 2; // 456
  // ─────────────────────────────────────────────────────────────────

  const items = buildStatItems(data, theme);
  const listHeight = items.length * ROW_HEIGHT; // 240

  // Center the block's bounding-box inside the body area.
  // We use the full available body height for perfect vertical centering.
  const scoreTopY = BODY_PAD_TOP + Math.round((listHeight - SCORE_BLOCK_HEIGHT) / 2);

  // ── Stat rows ─────────────────────────────────────────────────────
  const statRows = items
    .map((item, index) => {
      const rowY = BODY_PAD_TOP + index * ROW_HEIGHT;
      const delay = (index + 1) * 90;
      const staggerStyle = disableAnimations ? '' : `animation-delay: ${String(delay)}ms;`;
      const midY = ROW_HEIGHT / 2; // 40

      const separator =
        index > 0
          ? `<line x1="${String(TEXT_X)}" y1="0" x2="${String(SEP_RIGHT)}" y2="0"
           stroke="${theme.border}" stroke-width="1" stroke-opacity="0.18" />`
          : '';

      return `
    <g transform="translate(${String(LEFT_PAD)}, ${String(rowY)})">
      <g class="stagger" style="${staggerStyle}">
        ${separator}

        <!-- accent bar -->
        <rect x="0" y="${String(midY - 14)}" width="${String(ACCENT_W)}" height="28" rx="1"
          fill="${item.iconColor}" fill-opacity="0.6" />

        <!-- icon -->
        <g transform="translate(${String(ICON_OFFSET)}, ${String(midY - 8)})">
          ${item.icon}
        </g>

        <!-- label -->
        <text x="${String(TEXT_X)}" y="${String(midY - 12)}"
          class="dv-label" dominant-baseline="central" fill="${theme.title}">
          ${escapeXml(item.label)}
        </text>

        <!-- metrics -->
        <text x="${String(TEXT_X)}" y="${String(midY + 11)}"
          class="dv-value" dominant-baseline="central" fill="${theme.text}">
          ${escapeXml(item.value)}
        </text>
      </g>
    </g>`;
    })
    .join('');

  // ── Vertical divider ──────────────────────────────────────────────
  const divTop = BODY_PAD_TOP + 8;
  const divBottom = BODY_PAD_TOP + listHeight - 8;

  const verticalDivider = `
    <defs>
      <linearGradient id="dv-vdiv" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%"   stop-color="${theme.border}" stop-opacity="0" />
        <stop offset="35%"  stop-color="${theme.border}" stop-opacity="0.45" />
        <stop offset="65%"  stop-color="${theme.border}" stop-opacity="0.45" />
        <stop offset="100%" stop-color="${theme.border}" stop-opacity="0" />
      </linearGradient>
    </defs>
    <line x1="${String(DIVIDER_X)}" y1="${String(divTop)}"
          x2="${String(DIVIDER_X)}" y2="${String(divBottom)}"
      stroke="url(#dv-vdiv)" stroke-width="1"
      class="stagger" style="${disableAnimations ? '' : 'animation-delay: 330ms;'}" />`;

  // ── Score panel — translated as a single unit ─────────────────────
  // We wrap the stagger group inside the translated group to avoid
  // CSS transform (animation) overriding the SVG transform attribute.
  const scorePanel = `
    <g transform="translate(${String(RIGHT_CX)}, ${String(scoreTopY)})">
      <g class="stagger" style="${disableAnimations ? '' : 'animation-delay: 420ms;'}">
        ${renderScorePanel({ data, theme, disabled: disableAnimations })}
      </g>
    </g>`;

  // ── Styles ────────────────────────────────────────────────────────
  const bodyStyle = `
    <style>
      .dv-label { font-family: ${FONT_FAMILY}; font-size: 14px; font-weight: 600; }
      .dv-value { font-family: ${FONT_FAMILY}; font-size: 11.5px; font-weight: 400; opacity: 0.52; font-variant-numeric: tabular-nums; }
      .stagger  { opacity: 0; animation: dvFadeUp 0.35s cubic-bezier(0.25,0.46,0.45,0.94) forwards; }
      @keyframes dvFadeUp {
        from { opacity: 0; transform: translateY(6px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @media (prefers-reduced-motion: reduce) {
        .stagger { opacity: 1 !important; animation: none !important; transform: none !important; }
      }
    </style>`;

  const body = `
    ${bodyStyle}
    ${verticalDivider}
    ${statRows}
    ${scorePanel}`;

  const title = options.customTitle ?? t('devops.title', locale);
  const bodyOffset = options.hideTitle ? 30 : 55;
  const cardHeight = Math.max(bodyOffset + BODY_PAD_TOP + listHeight + BOTTOM_PAD, 200);

  return renderBaseCard({
    body,
    options: { ...options, width: CARD_WIDTH, height: cardHeight },
    title,
  });
}
