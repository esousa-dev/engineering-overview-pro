// ============================================================
// Theme registry and resolution
// ============================================================

import { draculaBlack } from './dracula-black.js';
import { proDark } from './pro-dark.js';
import { toHexColor, isValidHex } from '../common/utils.js';

import type { ThemeConfig, ThemeOverrides } from '../types/index.js';

// Registry of all available themes
const THEME_REGISTRY: Record<string, ThemeConfig> = {
  'dracula-black': draculaBlack,
  'pro-dark': proDark,
};

const DEFAULT_THEME_NAME = 'pro-dark';

/**
 * Resolve theme by name with optional color overrides.
 * Falls back to dracula-black if theme name is invalid.
 */
export function resolveTheme(
  themeName: string = DEFAULT_THEME_NAME,
  overrides: ThemeOverrides = {},
): ThemeConfig {
  const base = THEME_REGISTRY[themeName] ?? THEME_REGISTRY[DEFAULT_THEME_NAME];

  if (base === undefined) {
    throw new Error('Default theme not found in registry. This should never happen.');
  }

  // Apply color overrides if valid hex values provided
  return {
    ...base,
    ...(overrides.bgColor !== undefined && isValidHex(overrides.bgColor)
      ? { bg: toHexColor(overrides.bgColor) }
      : {}),
    ...(overrides.textColor !== undefined && isValidHex(overrides.textColor)
      ? { text: toHexColor(overrides.textColor) }
      : {}),
    ...(overrides.titleColor !== undefined && isValidHex(overrides.titleColor)
      ? { title: toHexColor(overrides.titleColor) }
      : {}),
    ...(overrides.iconColor !== undefined && isValidHex(overrides.iconColor)
      ? { icon: toHexColor(overrides.iconColor) }
      : {}),
    ...(overrides.borderColor !== undefined && isValidHex(overrides.borderColor)
      ? { border: toHexColor(overrides.borderColor) }
      : {}),
  };
}

/**
 * Get list of all registered theme names.
 */
export function getAvailableThemes(): ReadonlyArray<string> {
  return Object.keys(THEME_REGISTRY);
}

/**
 * Register a new theme in the registry.
 */
export function registerTheme(name: string, config: ThemeConfig): void {
  THEME_REGISTRY[name] = config;
}

export { THEME_REGISTRY, DEFAULT_THEME_NAME };
