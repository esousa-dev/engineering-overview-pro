// ============================================================
// XML/SVG utility functions
// ============================================================

import { createHash } from 'node:crypto';

/**
 * Sanitize a color string before interpolating it into an SVG attribute.
 * Accepts only hex colors (#RGB, #RGBA, #RRGGBB, #RRGGBBAA). Anything else
 * — including upstream-controlled values from external APIs — falls back to
 * the supplied default. Prevents attribute-injection XSS in SVG output.
 */
const SAFE_HEX_RE = /^#?[0-9a-fA-F]{3,8}$/;
export function sanitizeSvgColor(value: string | null | undefined, fallback: string): string {
  if (!value || typeof value !== 'string') return fallback;
  if (!SAFE_HEX_RE.test(value)) return fallback;
  return value.startsWith('#') ? value : `#${value}`;
}

/**
 * Escape dynamic text for safe insertion into SVG/XML.
 * MUST be called on ALL user-provided strings before template interpolation.
 */
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Format large numbers with locale-aware short notation.
 * e.g. 1500 → "1.5k", 1200000 → "1.2M"
 */
export function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}k`;
  }
  return String(num);
}

/**
 * Clamp a number between min and max (inclusive).
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Generate a stable hash string from sorted query parameters.
 * Used for cache key generation.
 */
export function hashParams(params: Record<string, unknown>): string {
  const sorted = Object.keys(params)
    .sort()
    .map((key) => {
      const val = params[key];
      const strVal =
        typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean'
          ? String(val)
          : '';
      return `${key}=${strVal}`;
    })
    .join('&');

  return createHash('sha256').update(sorted).digest('hex').slice(0, 16);
}

/**
 * Validate hex color string (6 or 8 chars, no # prefix).
 */
export function isValidHex(hex: string): boolean {
  return /^[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(hex);
}

/**
 * Prefix hex color with # if not already prefixed.
 */
export function toHexColor(hex: string): string {
  return hex.startsWith('#') ? hex : `#${hex}`;
}

/**
 * Measure approximate text width in SVG (based on average char width).
 * Uses 7px per character at 14px font size as baseline.
 */
export function measureText(text: string, fontSize: number = 14): number {
  const AVG_CHAR_WIDTH = 0.5;
  return text.length * fontSize * AVG_CHAR_WIDTH;
}

/**
 * Truncate text to fit within a max width, adding ellipsis.
 */
export function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) {
    return text;
  }
  return `${text.slice(0, maxChars - 3)}...`;
}

/**
 * Split text into multiple lines for SVG <tspan> rendering.
 */
export function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxChars) {
      currentLine = currentLine === '' ? word : `${currentLine} ${word}`;
    } else {
      if (currentLine !== '') lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine !== '') lines.push(currentLine);
  return lines;
}

/**
 * Format seconds into human-readable duration.
 * e.g. 3661 → "1 hr 1 min"
 */
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0 && minutes > 0) {
    return `${String(hours)} hr${hours > 1 ? 's' : ''} ${String(minutes)} min`;
  }
  if (hours > 0) {
    return `${String(hours)} hr${hours > 1 ? 's' : ''}`;
  }
  if (minutes > 0) {
    return `${String(minutes)} min`;
  }
  return '0 min';
}

/**
 * Format ISO date string into short human-readable format.
 * e.g. "2024-03-07T..." → "Mar 7, 2024"
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Parse comma-separated string into an array of trimmed, lowercase values.
 * Returns an empty array for undefined or empty input.
 */
export function parseCommaSeparated(value: string | undefined): ReadonlyArray<string> {
  if (value === undefined || value.length === 0) return [];
  return value
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);
}
