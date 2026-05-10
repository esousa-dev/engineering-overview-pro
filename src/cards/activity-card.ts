import { renderBaseCard, FONT_FAMILY } from '../common/card.js';
import { escapeXml, formatNumber } from '../common/utils.js';
import { t } from '../common/i18n.js';
import { iconStar, iconFork } from '../common/icons.js';
import type { ActivityData, CardOptions, ContributionLevel, ThemeConfig } from '../types/index.js';

export type ActivityCardOptions = CardOptions;

/**
 * Rainbow colors for the 3 faces of an isometric block.
 * Hue rotates across columns, lightness varies by contribution level,
 * and each face gets a different lightness to simulate 3D lighting.
 *
 * ALL blocks (including NONE) get rainbow color — NONE is just darker.
 * This matches the github-profile-3d-contrib night-rainbow style where
 * the entire grid shows the rainbow gradient.
 */
function getRainbowFaceColors(
  col: number,
  totalCols: number,
  level: ContributionLevel,
): { top: string; right: string; left: string } {
  // Hue: full 360° rotation across columns
  const hue = Math.round((col / totalCols) * 360);

  // Saturation: vivid for active, muted for NONE
  const saturation = level === 'NONE' ? 30 : 60;

  // Base lightness per contribution level
  // NONE still gets a rainbow tint, just very dark
  let baseLightness: number;
  switch (level) {
    case 'NONE': baseLightness = 15; break;
    case 'FIRST_QUARTILE': baseLightness = 28; break;
    case 'SECOND_QUARTILE': baseLightness = 38; break;
    case 'THIRD_QUARTILE': baseLightness = 48; break;
    case 'FOURTH_QUARTILE': baseLightness = 58; break;
    default: baseLightness = 15;
  }

  // 3 faces with different lightness to simulate 3D lighting:
  // Top face: brightest (direct light)
  // Left face: medium (ambient)
  // Right face: darkest (shadow)
  return {
    top: `hsl(${String(hue)}, ${String(saturation)}%, ${String(baseLightness)}%)`,
    left: `hsl(${String(hue)}, ${String(saturation)}%, ${String(Math.max(baseLightness - 8, 5))}%)`,
    right: `hsl(${String(hue)}, ${String(saturation)}%, ${String(Math.max(baseLightness - 15, 3))}%)`,
  };
}

// ─── Radar Chart ─────────────────────────────────────────────────────
function renderRadarChart(stats: ActivityData['stats'], theme: ThemeConfig): string {
  const axes = ['Commit', 'Issue', 'PullReq', 'Review', 'Repo'];
  const values = [stats.commits, stats.issues, stats.pullRequests, stats.reviews, stats.repos];

  const maxValue = Math.max(...values, 10);
  const logMax = Math.log10(maxValue + 1) || 1;

  const size = 448;
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = (size / 2) * 0.58;

  const points: string[] = [];
  const bgLines: string[] = [];

  // Logarithmic scale labels along the top axis
  const scaleLabels = [1, 10, 100, 1000, 10000].filter(v => v <= maxValue * 2);
  scaleLabels.forEach((val) => {
    const logVal = Math.log10(val + 1);
    const r = (radius * logVal) / logMax;
    if (r > 0 && r <= radius) {
      const label = val >= 1000 ? `${String(val / 1000)}K` : String(val);
      bgLines.push(
        `<text x="${String(centerX + 4)}" y="${String(centerY - r - 6)}" fill="${theme.muted}" font-size="15" text-anchor="start" font-family="${FONT_FAMILY}" opacity="0.6">${label}</text>`
      );
    }
  });

  axes.forEach((label, i) => {
    const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    bgLines.push(
      `<line x1="${String(centerX)}" y1="${String(centerY)}" x2="${String(x)}" y2="${String(y)}" stroke="${theme.muted}" stroke-width="0.8" opacity="0.5" stroke-dasharray="5,4" />`
    );

    const val = values[i] || 0;
    const logVal = Math.log10(val + 1);
    const r = (radius * logVal) / logMax;
    const px = centerX + r * Math.cos(angle);
    const py = centerY + r * Math.sin(angle);
    points.push(`${String(px)},${String(py)}`);

    const lx = centerX + (radius + 48) * Math.cos(angle);
    const ly = centerY + (radius + 32) * Math.sin(angle);
    bgLines.push(
      `<text x="${String(lx)}" y="${String(ly)}" fill="${theme.muted}" font-size="20" font-weight="600" text-anchor="middle" dominant-baseline="middle" font-family="${FONT_FAMILY}">${label}</text>`
    );
  });

  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1];
  gridLevels.forEach((factor) => {
    const p: string = axes.map((_, i) => {
      const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
      return `${String(centerX + radius * factor * Math.cos(angle))},${String(centerY + radius * factor * Math.sin(angle))}`;
    }).join(' ');
    bgLines.push(
      `<polygon points="${p}" fill="none" stroke="${theme.muted}" stroke-width="0.8" opacity="0.25" stroke-dasharray="4,4" />`
    );
  });

  return `
    <g class="radar-chart">
      <defs>
        <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${theme.purple}" stop-opacity="0.15" />
          <stop offset="100%" stop-color="${theme.purple}" stop-opacity="0.45" />
        </radialGradient>
      </defs>
      ${bgLines.join('\n')}
      <polygon points="${points.join(' ')}" fill="url(#radarGrad)" stroke="${theme.purple}" stroke-width="2.5" />
      ${points.map(p => {
        const [x, y] = p.split(',');
        return `<circle cx="${String(x)}" cy="${String(y)}" r="5" fill="${theme.purple}" />`;
      }).join('')}
    </g>
  `;
}

// ─── Donut Chart ─────────────────────────────────────────────────────
function renderDonutChart(languages: ActivityData['languages'], theme: ThemeConfig): string {
  const centerX = 150;
  const centerY = 150;
  const outerRadius = 130;
  const innerRadius = 82;
  const ringWidth = outerRadius - innerRadius; // 48

  const total = languages.reduce((sum, lang) => sum + lang.size, 0) || 1;
  const uid = Math.random().toString(36).slice(2, 7);

  // Gap between segments (radians) — creates the separated look
  const gapAngle = languages.length > 1 ? 0.02 : 0;

  const defs = `
    <defs>
      <filter id="ds-${uid}" x="-15%" y="-10%" width="130%" height="130%">
        <feDropShadow dx="0" dy="2" stdDeviation="5" flood-color="#000" flood-opacity="0.3" />
      </filter>
      <clipPath id="donutClip-${uid}">
        <path d="
          M ${String(centerX + outerRadius)},${String(centerY)}
          A ${String(outerRadius)},${String(outerRadius)} 0 1,1 ${String(centerX - outerRadius)},${String(centerY)}
          A ${String(outerRadius)},${String(outerRadius)} 0 1,1 ${String(centerX + outerRadius)},${String(centerY)}
          M ${String(centerX + innerRadius)},${String(centerY)}
          A ${String(innerRadius)},${String(innerRadius)} 0 1,0 ${String(centerX - innerRadius)},${String(centerY)}
          A ${String(innerRadius)},${String(innerRadius)} 0 1,0 ${String(centerX + innerRadius)},${String(centerY)}
          Z" fill-rule="evenodd" />
      </clipPath>
    </defs>
  `;

  const layers: string[] = [];

  // Shadow behind the donut ring
  layers.push(`
    <circle cx="${String(centerX)}" cy="${String(centerY)}" r="${String((outerRadius + innerRadius) / 2)}"
      fill="none" stroke="${theme.surface}" stroke-width="${String(ringWidth)}"
      opacity="0.12" filter="url(#ds-${uid})" />
  `);

  // Filled arc segments (wedge shapes, not strokes)
  let currentAngle = -Math.PI / 2;
  languages.forEach((lang) => {
    const fullSlice = (lang.size / total) * Math.PI * 2;
    const sliceAngle = Math.max(fullSlice - gapAngle, 0.001);
    const startAngle = currentAngle + gapAngle / 2;
    const endAngle = startAngle + sliceAngle;

    const ox1 = centerX + outerRadius * Math.cos(startAngle);
    const oy1 = centerY + outerRadius * Math.sin(startAngle);
    const ox2 = centerX + outerRadius * Math.cos(endAngle);
    const oy2 = centerY + outerRadius * Math.sin(endAngle);
    const ix1 = centerX + innerRadius * Math.cos(endAngle);
    const iy1 = centerY + innerRadius * Math.sin(endAngle);
    const ix2 = centerX + innerRadius * Math.cos(startAngle);
    const iy2 = centerY + innerRadius * Math.sin(startAngle);
    const largeArc = sliceAngle > Math.PI ? 1 : 0;

    layers.push(`
      <path d="M ${String(ox1)} ${String(oy1)}
               A ${String(outerRadius)} ${String(outerRadius)} 0 ${String(largeArc)} 1 ${String(ox2)} ${String(oy2)}
               L ${String(ix1)} ${String(iy1)}
               A ${String(innerRadius)} ${String(innerRadius)} 0 ${String(largeArc)} 0 ${String(ix2)} ${String(iy2)}
               Z"
            fill="${lang.color}" />
    `);

    currentAngle += fullSlice;
  });

  // ── Legend — dots + names, vertically centered with the donut ──
  const legendX = 320;
  const donutTop = centerY - outerRadius;
  const donutHeight = outerRadius * 2;

  const rowHeight = Math.max(22, Math.min(30, Math.floor(donutHeight / languages.length)));
  const totalLegendHeight = languages.length * rowHeight;
  const legendStartY = donutTop + (donutHeight - totalLegendHeight) / 2;

  const fontSize = languages.length > 10 ? 13 : languages.length > 7 ? 14 : 16;

  const legend: string[] = [];
  languages.forEach((lang, i) => {
    const y = legendStartY + i * rowHeight + rowHeight / 2;

    legend.push(`
      <g transform="translate(${String(legendX)}, ${String(y)})">
        <rect y="-5" width="10" height="10" rx="2" fill="${lang.color}" />
        <text x="16" y="0"
          dominant-baseline="central"
          fill="${theme.text}" font-size="${String(fontSize)}" font-weight="400"
          font-family="${FONT_FAMILY}"
          shape-rendering="crispEdges">${escapeXml(lang.name)}</text>
      </g>
    `);
  });

  return `
    <g class="donut-chart">
      ${defs}
      ${layers.join('\n')}
      ${legend.join('\n')}
    </g>
  `;
}

// ─── Main Card Renderer ──────────────────────────────────────────────
export function renderActivityCard(data: ActivityData, options: ActivityCardOptions): string {
  const { theme, locale, disableAnimations } = options;

  const cardWidth = 1280;
  const cardHeight = 850;

  // ── Max contributions for bar height scaling ──
  let maxContribs = 1;
  data.weeks.forEach((week) => {
    week.contributionDays.forEach((day) => {
      if (day.contributionCount > maxContribs) maxContribs = day.contributionCount;
    });
  });

  const totalCols = data.weeks.length;
  const totalRows = 7;

  // ── Isometric grid parameters ──
  // The heatmap must fill the ENTIRE canvas as a background layer.
  // Radar, donut, and footer are rendered ON TOP of it.
  //
  // stepX=20, stepY=10 → 2:1 isometric ratio
  // Grid x-span: (totalCols-1 + totalRows-1) * stepX ≈ 57 * 20 = 1140px
  // Grid y-span: (totalCols-1 + totalRows-1) * stepY ≈ 57 * 10 = 570px
  // H_MAX = 120 → tallest bars extend 120px above base

  const stepX = 21;
  const stepY = 10;
  const dx = 18;
  const dy = 9;
  const H_MIN = 4;
  const H_MAX = 120;

  type Block = { col: number; row: number; count: number; level: ContributionLevel; date: string };
  const blocks: Block[] = [];
  data.weeks.forEach((week, col) => {
    week.contributionDays.forEach((day, row) => {
      blocks.push({ col, row, count: day.contributionCount, level: day.contributionLevel, date: day.date });
    });
  });
  blocks.sort((a, b) => (a.col + a.row) - (b.col + b.row));

  // Origin placement:
  // The grid must span the full canvas width with the diagonal going
  // from upper-left to lower-right. All overlay elements (radar, donut,
  // footer) sit ON TOP of the heatmap blocks.
  //
  // Left edge: originX + (0 - 6) * stepX = originX - 120
  // Right edge: originX + (totalCols-1) * stepX ≈ originX + 1020
  // Top edge: originY - H_MAX (tallest bar)
  // Bottom edge: originY + (totalCols-1 + 6) * stepY ≈ originY + 570
  //
  // To fill full width: originX - 120 ≈ 30 → originX ≈ 150
  // To fill full height: originY - 120 ≈ 30 → originY ≈ 150
  //   bottom: 150 + 570 = 720, leaving 130px for footer ✓
  const originX = 150;
  const originY = 150;

  let heatmapContent = `
    <!-- Platform Base -->
    <g transform="translate(0, 5)">
      <polygon points="${String(-(totalRows - 1) * stepX - dx)},${String((totalRows - 1) * stepY - dy)} 0,${String(-2 * dy)} ${String((totalCols - 1) * stepX + dx)},${String((totalCols - 1) * stepY - dy)} ${String((totalCols - 1 - (totalRows - 1)) * stepX)},${String((totalCols - 1 + totalRows - 1) * stepY)}" fill="${theme.surface}" opacity="0.35" />
    </g>
  `;

  blocks.forEach((block) => {
    const cx = (block.col - block.row) * stepX;
    const cy = (block.col + block.row) * stepY;
    let h = H_MIN;
    if (block.count > 0) h = H_MIN + (block.count / maxContribs) * H_MAX;
    const colors = getRainbowFaceColors(block.col, totalCols, block.level);
    const delay = disableAnimations ? 0 : (block.col + block.row) * 8;
    const animStyle = disableAnimations ? '' : `style="animation-delay: ${String(delay)}ms;"`;

    heatmapContent += `
      <g class="block-anim" ${animStyle}>
        <path d="M ${String(cx)},${String(cy - h)} L ${String(cx + dx)},${String(cy - dy - h)} L ${String(cx + dx)},${String(cy - dy)} L ${String(cx)},${String(cy)} Z" fill="${colors.right}" />
        <path d="M ${String(cx - dx)},${String(cy - dy - h)} L ${String(cx)},${String(cy - h)} L ${String(cx)},${String(cy)} L ${String(cx - dx)},${String(cy - dy)} Z" fill="${colors.left}" />
        <path d="M ${String(cx)},${String(cy - h)} L ${String(cx - dx)},${String(cy - dy - h)} L ${String(cx)},${String(cy - 2 * dy - h)} L ${String(cx + dx)},${String(cy - dy - h)} Z" fill="${colors.top}" />
        <path d="M ${String(cx)},${String(cy)} L ${String(cx + dx)},${String(cy - dy)} L ${String(cx + dx)},${String(cy - dy - h)} L ${String(cx)},${String(cy - 2 * dy - h)} L ${String(cx - dx)},${String(cy - dy - h)} L ${String(cx - dx)},${String(cy - dy)} Z" fill="transparent">
          <title>${escapeXml(String(block.count))} contributions on ${escapeXml(block.date)}</title>
        </path>
      </g>
    `;
  });

  // ── Subcomponents ──
  const radar = renderRadarChart(data.stats, theme);
  const donut = renderDonutChart(data.languages, theme);

  // ── Date range ──
  const weeks = data.weeks;
  const startDay = weeks[0]?.contributionDays[0];
  const lastWeek = weeks[weeks.length - 1];
  const endDay = lastWeek?.contributionDays[lastWeek.contributionDays.length - 1];
  const startDate = startDay?.date || '';
  const endDate = endDay?.date || '';
  const dateRange = startDate && endDate ? `${startDate} / ${endDate}` : '';

  // ── Overlay positions ──
  // These elements sit ON TOP of the heatmap. The heatmap blocks
  // render behind them since SVG uses painter's model (later = on top).
  const radarX = cardWidth - 505;
  const radarY = 35;
  const donutX = 20;
  const donutY = cardHeight - 380;
  const footerX = cardWidth / 2 - 220;
  const footerY = cardHeight - 110;

  const body = `
    <style>
      @keyframes popUp { 0% { opacity: 0; transform: translateY(15px); } 100% { opacity: 1; transform: translateY(0); } }
      .block-anim { animation: popUp 0.6s cubic-bezier(0.18, 0.89, 0.32, 1.28) backwards; }
      .fade-in { animation: fadeIn 0.5s ease-out forwards; opacity: 0; }
      @keyframes fadeIn { to { opacity: 1; } }
      .rainbow-icon { animation: rainbow 5s linear infinite; }
      @keyframes rainbow { 0% { filter: hue-rotate(0deg); } 100% { filter: hue-rotate(360deg); } }
    </style>

    <!-- ═══════════════════════════════════════════════════════════════
         LAYER 0 (BACK): 3D Isometric Heatmap — fills entire canvas
         ═══════════════════════════════════════════════════════════════ -->
    <g transform="translate(${String(originX)}, ${String(originY)})" class="rainbow-icon">
      ${heatmapContent}
    </g>

    <!-- ═══════════════════════════════════════════════════════════════
         LAYER 1 (FRONT): Overlay elements rendered ON TOP of heatmap
         ═══════════════════════════════════════════════════════════════ -->

    <!-- Date range (upper-right) -->
    <text x="${String(cardWidth - 35)}" y="40" fill="${theme.muted}" font-size="14" text-anchor="end" font-family="${FONT_FAMILY}" opacity="0.7">${escapeXml(dateRange)}</text>

    <!-- Radar Chart (upper-right, overlapping heatmap blocks) -->
    <g transform="translate(${String(radarX)}, ${String(radarY)})">
      ${radar}
    </g>

    <!-- Donut Chart + Legend (lower-left, overlapping heatmap blocks) -->
    <g transform="translate(${String(donutX)}, ${String(donutY)})">
      ${donut}
    </g>

    <!-- Footer: Summary Stats (centered bottom, on top of everything) -->
    <g transform="translate(${String(footerX)}, ${String(footerY)})">
      <text x="0" y="32" fill="${theme.yellow}" font-size="44" font-weight="600" font-family="'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif">
        ${formatNumber(data.totalContributions)}
        <tspan fill="${theme.text}" font-size="26" font-weight="400"> ${escapeXml(t('stats.contribs', locale))}</tspan>
      </text>

      <g transform="translate(290, 8)">
        <g transform="translate(4, 4) scale(1.5)" class="rainbow-icon">${iconStar(theme.purple)}</g>
        <text x="32" y="28" fill="${theme.text}" font-size="36" font-weight="400" font-family="'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif">${formatNumber(data.summary.totalStars)}</text>
      </g>

      <g transform="translate(390, 8)">
        <g transform="translate(4, 4) scale(1.5)" class="rainbow-icon">${iconFork(theme.purple)}</g>
        <text x="32" y="28" fill="${theme.text}" font-size="36" font-weight="400" font-family="'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif">${formatNumber(data.summary.totalForks)}</text>
      </g>
    </g>
  `;

  return renderBaseCard({
    body,
    options: { ...options, width: cardWidth, height: cardHeight },
    title: options.customTitle ?? t('activity.title', locale),
    description: 'Premium 3D Isometric Activity Insight',
  });
}
