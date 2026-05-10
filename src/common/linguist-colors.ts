// ============================================================
// Language → color mapping (derived from GitHub Linguist)
// Top 60 programming languages with their official colors.
// Update with: scripts/update-linguist-data.ts
// ============================================================

import type { LinguistLanguage } from '../types/index.js';

export const LINGUIST_LANGUAGES: ReadonlyArray<LinguistLanguage> = [
  {
    name: 'JavaScript',
    color: '#f1e05a',
    type: 'programming',
    extensions: ['.js', '.mjs', '.cjs'],
  },
  {
    name: 'TypeScript',
    color: '#3178c6',
    type: 'programming',
    extensions: ['.ts', '.mts', '.cts'],
  },
  { name: 'Python', color: '#3572A5', type: 'programming', extensions: ['.py', '.pyw'] },
  { name: 'Java', color: '#b07219', type: 'programming', extensions: ['.java'] },
  { name: 'C#', color: '#178600', type: 'programming', extensions: ['.cs'] },
  {
    name: 'C++',
    color: '#f34b7d',
    type: 'programming',
    extensions: ['.cpp', '.cc', '.cxx', '.hpp', '.hxx'],
  },
  { name: 'C', color: '#555555', type: 'programming', extensions: ['.c', '.h'] },
  { name: 'PHP', color: '#4F5D95', type: 'programming', extensions: ['.php'] },
  { name: 'Ruby', color: '#701516', type: 'programming', extensions: ['.rb'] },
  { name: 'Go', color: '#00ADD8', type: 'programming', extensions: ['.go'] },
  { name: 'Rust', color: '#dea584', type: 'programming', extensions: ['.rs'] },
  { name: 'Swift', color: '#F05138', type: 'programming', extensions: ['.swift'] },
  { name: 'Kotlin', color: '#A97BFF', type: 'programming', extensions: ['.kt', '.kts'] },
  { name: 'Dart', color: '#00B4AB', type: 'programming', extensions: ['.dart'] },
  { name: 'Scala', color: '#c22d40', type: 'programming', extensions: ['.scala', '.sc'] },
  { name: 'Shell', color: '#89e051', type: 'programming', extensions: ['.sh', '.bash', '.zsh'] },
  { name: 'PowerShell', color: '#012456', type: 'programming', extensions: ['.ps1', '.psm1'] },
  { name: 'Lua', color: '#000080', type: 'programming', extensions: ['.lua'] },
  { name: 'R', color: '#198CE7', type: 'programming', extensions: ['.r', '.R'] },
  { name: 'MATLAB', color: '#e16737', type: 'programming', extensions: ['.m'] },
  { name: 'Perl', color: '#0298c3', type: 'programming', extensions: ['.pl', '.pm'] },
  { name: 'Haskell', color: '#5e5086', type: 'programming', extensions: ['.hs'] },
  { name: 'Elixir', color: '#6e4a7e', type: 'programming', extensions: ['.ex', '.exs'] },
  { name: 'Clojure', color: '#db5855', type: 'programming', extensions: ['.clj', '.cljs'] },
  { name: 'Erlang', color: '#B83998', type: 'programming', extensions: ['.erl'] },
  { name: 'Julia', color: '#a270ba', type: 'programming', extensions: ['.jl'] },
  { name: 'Objective-C', color: '#438eff', type: 'programming', extensions: ['.m', '.mm'] },
  { name: 'Assembly', color: '#6E4C13', type: 'programming', extensions: ['.asm', '.s'] },
  { name: 'Groovy', color: '#4298b8', type: 'programming', extensions: ['.groovy'] },
  { name: 'Visual Basic .NET', color: '#945db7', type: 'programming', extensions: ['.vb'] },
  { name: 'F#', color: '#b845fc', type: 'programming', extensions: ['.fs', '.fsi', '.fsx'] },
  { name: 'Zig', color: '#ec915c', type: 'programming', extensions: ['.zig'] },
  { name: 'Nim', color: '#ffc200', type: 'programming', extensions: ['.nim'] },
  { name: 'OCaml', color: '#3be133', type: 'programming', extensions: ['.ml', '.mli'] },
  { name: 'Solidity', color: '#AA6746', type: 'programming', extensions: ['.sol'] },
  { name: 'V', color: '#4f87c4', type: 'programming', extensions: ['.v'] },
  { name: 'Crystal', color: '#000100', type: 'programming', extensions: ['.cr'] },
  { name: 'Svelte', color: '#ff3e00', type: 'programming', extensions: ['.svelte'] },
  { name: 'Vue', color: '#41b883', type: 'programming', extensions: ['.vue'] },
  { name: 'Astro', color: '#ff5a03', type: 'programming', extensions: ['.astro'] },
  { name: 'VBScript', color: '#15dcdc', type: 'programming', extensions: ['.vbs'] },
  { name: 'Batchfile', color: '#89e051', type: 'programming', extensions: ['.bat', '.cmd'] },
  // Aliases for matching
  { name: 'VBS', color: '#15dcdc', type: 'programming', extensions: ['.vbs'] },
  { name: 'Batch', color: '#89e051', type: 'programming', extensions: ['.bat', '.cmd'] },
  // Markup
  { name: 'HTML', color: '#e34c26', type: 'markup', extensions: ['.html', '.htm'] },
  { name: 'CSS', color: '#563d7c', type: 'markup', extensions: ['.css'] },
  { name: 'SCSS', color: '#c6538c', type: 'markup', extensions: ['.scss'] },
  { name: 'Less', color: '#1d365d', type: 'markup', extensions: ['.less'] },
  { name: 'Sass', color: '#a53b70', type: 'markup', extensions: ['.sass'] },
  { name: 'Markdown', color: '#083fa1', type: 'markup', extensions: ['.md', '.markdown'] },
  { name: 'MD', color: '#083fa1', type: 'markup', extensions: ['.md'] },
  { name: 'TSX', color: '#3178c6', type: 'programming', extensions: ['.tsx'] },
  { name: 'JSX', color: '#f1e05a', type: 'programming', extensions: ['.jsx'] },
  // Data
  { name: 'JSON', color: '#292929', type: 'data', extensions: ['.json'] },
  { name: 'YAML', color: '#cb171e', type: 'data', extensions: ['.yml', '.yaml'] },
  { name: 'TOML', color: '#9c4221', type: 'data', extensions: ['.toml'] },
  { name: 'XML', color: '#0060ac', type: 'data', extensions: ['.xml'] },
  { name: 'SQL', color: '#e38c00', type: 'data', extensions: ['.sql'] },
  { name: 'GraphQL', color: '#e10098', type: 'data', extensions: ['.graphql', '.gql'] },
  { name: 'Protocol Buffers', color: '#6a9dc5', type: 'data', extensions: ['.proto'] },
  // Prose
  { name: 'TeX', color: '#3D6117', type: 'prose', extensions: ['.tex'] },
  { name: 'reStructuredText', color: '#141414', type: 'prose', extensions: ['.rst'] },
];

// Pre-built lookup: extension → language
const extensionMap = new Map<string, LinguistLanguage>();

for (const lang of LINGUIST_LANGUAGES) {
  for (const ext of lang.extensions) {
    // First match wins (e.g. .m → Objective-C, not MATLAB)
    if (!extensionMap.has(ext)) {
      extensionMap.set(ext, lang);
    }
  }
}

/**
 * Resolve language by file extension.
 * Returns undefined if extension is not recognized.
 */
export function getLanguageByExtension(ext: string): LinguistLanguage | undefined {
  const normalized = ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`;
  return extensionMap.get(normalized);
}

/**
 * Get language color by name.
 * Returns a neutral gray if language is unknown.
 */
export function getLanguageColor(name: string): string {
  const DEFAULT_COLOR = '#8b8b8b';
  const lang = LINGUIST_LANGUAGES.find((l) => l.name.toLowerCase() === name.toLowerCase());
  return lang?.color ?? DEFAULT_COLOR;
}
