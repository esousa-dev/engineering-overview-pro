<p align="center">
  <img src="assets/typescript.png" alt="engineering-overview-pro banner" width="920" />
</p>

<h1 align="center">engineering-overview-pro</h1>

<p align="center">
  <a href="https://github.com/esousa-dev/engineering-overview-pro/actions/workflows/ci.yml"><img src="https://github.com/esousa-dev/engineering-overview-pro/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI status" /></a>
  <a href="https://github.com/esousa-dev/engineering-overview-pro/actions/workflows/release.yml"><img src="https://github.com/esousa-dev/engineering-overview-pro/actions/workflows/release.yml/badge.svg" alt="Release workflow" /></a>
  <a href="https://github.com/esousa-dev/engineering-overview-pro/commits/main/"><img src="https://img.shields.io/github/last-commit/esousa-dev/engineering-overview-pro?logo=github&amp;label=last%20commit" alt="Last commit" /></a>
  <a href="https://github.com/esousa-dev/engineering-overview-pro/graphs/commit-activity"><img src="https://img.shields.io/github/commit-activity/m/esousa-dev/engineering-overview-pro?label=commits%2Fmonth&amp;logo=github" alt="Commit activity" /></a>
  <a href="https://github.com/esousa-dev/engineering-overview-pro/blob/main/LICENSE"><img src="https://img.shields.io/github/license/esousa-dev/engineering-overview-pro?color=blue&amp;label=license" alt="License" /></a>
</p>

<p align="center">
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&amp;logoColor=white" alt="TypeScript" /></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/node.js-%3E%3D22-339933?logo=node.js&amp;logoColor=white" alt="Node.js" /></a>
  <a href="https://fastify.dev/"><img src="https://img.shields.io/badge/Fastify-5-000000?logo=fastify&amp;logoColor=white" alt="Fastify" /></a>
  <a href="https://zod.dev/"><img src="https://img.shields.io/badge/schema-Zod-3068B7" alt="Zod" /></a>
  <a href="https://graphql.org/"><img src="https://img.shields.io/badge/GitHub-GraphQL-E10098?logo=graphql&amp;logoColor=white" alt="GitHub GraphQL API" /></a>
  <a href="https://github.com/octokit/graphql.js"><img src="https://img.shields.io/badge/Octokit-graphql.js-24292f?logo=github" alt="Octokit GraphQL" /></a>
  <a href="https://vitest.dev/"><img src="https://img.shields.io/badge/tests-Vitest-6E9F18?logo=vitest&amp;logoColor=white" alt="Vitest" /></a>
  <a href="https://eslint.org/"><img src="https://img.shields.io/badge/ESLint-9-4B32C3?logo=eslint&amp;logoColor=white" alt="ESLint" /></a>
  <a href="https://prettier.io/"><img src="https://img.shields.io/badge/code_style-Prettier-ff69b4.svg" alt="Prettier" /></a>
</p>

<p align="center">
  <a href="https://github.com/esousa-dev/engineering-overview-pro/blob/main/.github/dependabot.yml"><img src="https://img.shields.io/badge/Dependabot-enabled-025e8c?logo=dependabot&amp;logoColor=white" alt="Dependabot" /></a>
  <a href="https://github.com/esousa-dev/engineering-overview-pro/blob/main/package.json"><img src="https://img.shields.io/github/package-json/dependencies/esousa-dev/engineering-overview-pro?label=dependencies&amp;logo=npm&amp;logoColor=white" alt="Dependencies" /></a>
  <a href="https://github.com/esousa-dev/engineering-overview-pro/blob/main/package.json"><img src="https://img.shields.io/github/package-json/dependency-version/esousa-dev/engineering-overview-pro/dev/typescript?branch=main&amp;label=typescript%20%28dev%29" alt="TypeScript devDependency version" /></a>
  <a href="https://github.com/esousa-dev/engineering-overview-pro/releases"><img src="https://img.shields.io/github/v/release/esousa-dev/engineering-overview-pro?sort=semver&amp;logo=github&amp;label=release" alt="GitHub release" /></a>
  <a href="https://github.com/esousa-dev/engineering-overview-pro/actions/workflows/release.yml"><img src="https://img.shields.io/badge/npm_publish-optional-CB3837?logo=npm&amp;logoColor=white" alt="npm publish optional" /></a>
</p>

<p align="center">
  <a href="https://www.codefactor.io/repository/github/esousa-dev/engineering-overview-pro"><img src="https://www.codefactor.io/repository/github/esousa-dev/engineering-overview-pro/badge/main" alt="CodeFactor" /></a>
  <a href="https://scorecard.dev/viewer/?uri=github.com/esousa-dev/engineering-overview-pro"><img src="https://api.scorecard.dev/projects/github.com/esousa-dev/engineering-overview-pro/badge" alt="OpenSSF Scorecard" /></a>
  <a href="https://github.com/esousa-dev/engineering-overview-pro/pulse"><img src="https://img.shields.io/github/issues/esousa-dev/engineering-overview-pro?logo=github&amp;label=issues" alt="GitHub issues" /></a>
  <a href="https://github.com/esousa-dev/engineering-overview-pro/pulls"><img src="https://img.shields.io/github/issues-pr/esousa-dev/engineering-overview-pro?logo=github&amp;label=pull%20requests" alt="GitHub pull requests" /></a>
  <a href="https://github.com/esousa-dev/engineering-overview-pro"><img src="https://img.shields.io/github/stars/esousa-dev/engineering-overview-pro?style=social" alt="GitHub stars" /></a>
</p>

---

Self-hosted HTTP API that renders **dynamic SVG cards** with GitHub profile statistics. Built with **Node.js**, **Fastify**, and **TypeScript**. Embed the cards in README files, dashboards, or any context that accepts images.

The GitHub profile is **always** selected via the query string (`?username=<login>`). End users put their GitHub username in the URL; the server fetches data from the GitHub API and returns SVG.

**Maintainer:** [esousa-dev](https://github.com/esousa-dev)

## Features

- Read-only API (GET and HEAD only), security headers, global rate limiting, optional trusted reverse proxy support
- Multiple card types: profile stats, top languages, contribution streak, activity heatmap, pinned repos, DevOps signals, coding activity (WakaTime-style from GitHub events)
- Theming, locales (`en`, `pt-br`, `es`), and cache-friendly responses

## Requirements

- **Node.js** 22 or newer
- At least one **GitHub Personal Access Token** (PAT) to avoid unauthenticated rate limits

## Quick start

```bash
git clone https://github.com/esousa-dev/engineering-overview-pro.git
cd engineering-overview-pro
npm install
cp .env.example .env
# Edit .env and set PAT_1 to a fine-scoped or classic PAT with repo read access as needed
npm run dev
```

The server listens on `http://localhost:3000` by default.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PAT_1` | Yes | GitHub PAT. You may define `PAT_2`, `PAT_3`, … for round-robin rotation. |
| `PORT` | No | HTTP port (default `3000`). |
| `HOST` | No | Bind address (default `0.0.0.0`). |
| `LOG_LEVEL` | No | Fastify logger level (default `info`). |
| `TRUST_PROXY` | No | When behind Nginx, Traefik, or similar, set to `true` or a comma-separated allow list so rate limiting uses the real client IP. **Do not** enable if the app is exposed directly to the internet without a trusted proxy (clients could spoof `X-Forwarded-For`). Default `false`. |

There is **no** default GitHub username in configuration; every card URL must include `username`.

## API overview

All card routes require `username` (valid GitHub login). Responses are `image/svg+xml` unless noted.

| Route | Description |
|-------|-------------|
| `GET /` | JSON: service message, health URL, and route list |
| `GET /health` | JSON: uptime, memory, cache size, GitHub rate-limit snapshot |
| `GET /api/stats` | Profile statistics card |
| `GET /api/top-langs` | Most-used languages |
| `GET /api/streak` | Contribution streak |
| `GET /api/activity` | Activity heatmap |
| `GET /api/pin` | Pinned repositories (grid) or a single repo with `repo` |
| `GET /api/devops` | CI/CD, CodeFactor, and security-related signals |
| `GET /api/coding-stats` | Coding-style stats derived from public GitHub activity |
| `GET /api/wakatime` | **Legacy alias** for `/api/coding-stats` |

### Example: README badge

```markdown
[![GitHub Stats](https://your-domain.com/api/stats?username=YOUR_LOGIN)](https://github.com/YOUR_LOGIN)
```

### Common query parameters (`/api/stats` and shared base)

- `username` (required): GitHub login.
- `theme`: theme id from `src/themes/index.ts` (default `dracula-black`).
- `hide_title`, `hide_border`, `hide_rank`: boolean flags.
- `bg_color`, `text_color`, `title_color`, `icon_color`, `border_color`: hex **without** `#`.
- `locale`: `en`, `pt-br`, or `es`.
- `disable_animations`: boolean.
- `hide` / `show`: comma-separated among `stars`, `commits`, `prs`, `issues`, `contribs` (stats endpoint).
- `custom_title`: override card title.
- `cache_seconds`: client cache hint (allowed range enforced by validation; default aligns with CDN-friendly caching).

Endpoint-specific options (layouts, `langs_count`, pin `repo`, DevOps toggles, and coding-stats layout) are validated in `src/common/validators.ts`.

## npm scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Development server with watch (`tsx`) |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run `dist/server.js` (loads `.env` when present) |
| `npm test` | Unit tests (Vitest) |
| `npm run test:coverage` | Vitest with V8 coverage report (no global gate; useful locally or in custom pipelines) |
| `npm run verify` | Same checks as CI: Prettier, ESLint, TypeScript, spell (docs + GraphQL), tests, build, `npm audit` |
| `npm run lint` | ESLint on `src/` |
| `npm run typecheck` | TypeScript check without emit |
| `npm run format` | Prettier write on `src/**/*.ts` and `tests/**/*.ts` |
| `npm run format:check` | Prettier check (CI) |
| `npm run spell` | cspell on the full tree (local) |
| `npm run spell:ci` | cspell on documentation and `src/graphql/` only (CI) |

## Production deployment

The application is a standard Node.js service: no Docker is required, though you may containerize it if you prefer.

Example on a VPS:

```bash
git clone https://github.com/esousa-dev/engineering-overview-pro.git
cd engineering-overview-pro
npm ci
npm run build
cp .env.example .env
# Set PAT_1 (and optional PAT_n), PORT, TRUST_PROXY as needed
node dist/server.js
```

Use **systemd**, **pm2**, or a process supervisor for restarts and logging. Place **Nginx** or another reverse proxy in front for TLS and optional `TRUST_PROXY=true`.

Updates:

```bash
git pull
npm ci
npm run build
# Restart the process
```

### Operational notes

- Keep PATs scoped to the minimum GitHub permissions you need.
- Monitor `/health` for rate-limit headroom when traffic grows.
- Tune `TRUST_PROXY` only when a trusted proxy terminates TLS and sets forwarding headers correctly.

## CI/CD and automation

- **CI** ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)): on every push and pull request to `main` / `dev`, runs Prettier check, ESLint, TypeScript, spell check (documentation plus [`src/graphql/github-queries.ts`](src/graphql/github-queries.ts)), Vitest (including GraphQL syntax validation), production build, and `npm audit --audit-level=high`.
- **Dependabot** ([`.github/dependabot.yml`](.github/dependabot.yml)): weekly grouped npm updates (Octokit, Fastify, TypeScript/Vitest clusters) and monthly GitHub Actions updates.
- **Releases** ([`.github/workflows/release.yml`](.github/workflows/release.yml)): pushing a version tag matching `v*` (for example `v1.0.1`) runs the same checks, creates a **GitHub Release** with auto-generated notes, and optionally publishes to **npm** when you set repository variable `NPM_PUBLISH` to `true` and configure the `NPM_TOKEN` secret (otherwise the publish job is skipped).

Local parity with CI:

```bash
npm run verify
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

See [SECURITY.md](SECURITY.md) for reporting vulnerabilities.

## Code of conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## License

MIT — see [LICENSE](LICENSE).
