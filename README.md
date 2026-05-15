<p align="center">
  <img src="assets/typescript.png" alt="engineering-overview-pro banner" width="920" />
</p>

<h1 align="center">engineering-overview-pro</h1>

<p align="center">
  <a href="https://github.com/esousa-dev/engineering-overview-pro/actions/workflows/ci.yml"><img src="https://github.com/esousa-dev/engineering-overview-pro/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI status" /></a>
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
  <a href="https://github.com/esousa-dev/engineering-overview-pro/actions/workflows/ci.yml"><img src="https://img.shields.io/badge/npm_audit-passing-brightgreen?logo=npm&amp;logoColor=white" alt="npm audit passing" /></a>
  <a href="https://github.com/esousa-dev/engineering-overview-pro/blob/main/package.json"><img src="https://img.shields.io/github/package-json/dependency-version/esousa-dev/engineering-overview-pro/dev/typescript?branch=main&amp;label=typescript%20%28dev%29" alt="TypeScript devDependency version" /></a>
  <a href="https://github.com/esousa-dev/engineering-overview-pro/actions/workflows/release.yml"><img src="https://img.shields.io/badge/npm_publish-optional-CB3837?logo=npm&amp;logoColor=white" alt="npm publish optional" /></a>
</p>

<p align="center">
  <a href="https://www.codefactor.io/repository/github/esousa-dev/engineering-overview-pro"><img src="https://www.codefactor.io/repository/github/esousa-dev/engineering-overview-pro/badge/main" alt="CodeFactor" /></a>
  <a href="https://github.com/esousa-dev/engineering-overview-pro/pulse"><img src="https://img.shields.io/github/issues/esousa-dev/engineering-overview-pro?logo=github&amp;label=issues" alt="GitHub issues" /></a>
  <a href="https://github.com/esousa-dev/engineering-overview-pro/pulls"><img src="https://img.shields.io/github/issues-pr/esousa-dev/engineering-overview-pro?logo=github&amp;label=pull%20requests" alt="GitHub pull requests" /></a>
  <a href="https://github.com/esousa-dev/engineering-overview-pro"><img src="https://img.shields.io/github/stars/esousa-dev/engineering-overview-pro?style=social" alt="GitHub stars" /></a>
</p>

---

A free, public **SVG card service** for GitHub profiles. Embed dynamic stats, language breakdowns, contribution streaks, activity heatmaps, pinned repositories, DevOps signals, and coding activity directly in your README — no sign-up, no install, just a URL.

> 🌐 **Live at [`https://esousa97.com`](https://esousa97.com)** — open and free for community use. Built with **Node.js**, **Fastify**, and **TypeScript**. MIT-licensed; you can also self-host.

**Maintainer:** [ESousa97](https://github.com/ESousa97)

## Quickstart — embed a card in 1 line

Drop this into your `README.md`, replacing `YOUR_LOGIN` with your GitHub username:

```markdown
![](https://esousa97.com/api/stats?username=YOUR_LOGIN)
```

That's it. The service fetches your public GitHub data and returns an SVG, which any markdown-aware renderer (GitHub, GitLab, dashboards, blog posts) embeds inline.

### A profile-ready combo

```markdown
![Stats](https://esousa97.com/api/stats?username=YOUR_LOGIN)
![Top languages](https://esousa97.com/api/top-langs?username=YOUR_LOGIN&layout=donut)
![Streak](https://esousa97.com/api/streak?username=YOUR_LOGIN)
![Activity](https://esousa97.com/api/activity?username=YOUR_LOGIN)
```

## Available cards

All card endpoints require `?username=<github-login>` and return `image/svg+xml`.

| Endpoint | What it shows |
|---|---|
| `/api/stats` | Profile statistics — commits, PRs, issues, stars, contributions, rank |
| `/api/top-langs` | Most-used languages — layouts: `normal`, `compact`, `donut`, `donut-vertical`, `pie` |
| `/api/streak` | Contribution streak — `mode=daily \| weekly` |
| `/api/activity` | Activity heatmap + radar chart |
| `/api/pin?repo=<name>` | Single pinned repository card |
| `/api/pin` | Pinned repositories grid |
| `/api/devops` | CI/CD, CodeFactor, and security-related signals |
| `/api/coding-stats` | Coding activity derived from public GitHub events (no external service) |

**Utility endpoints**

| Endpoint | Returns |
|---|---|
| `GET /` | Machine-readable JSON catalog of all endpoints with every supported parameter, type, default, and example URL |
| `GET /health` | JSON snapshot — uptime, memory, cache size, GitHub rate-limit headroom per token |

## Customizing

Every card supports the parameters below. Hex colors are passed **without** the leading `#`.

| Parameter | Type | Default | Notes |
|---|---|---|---|
| `theme` | `dracula-black` \| `pro-dark` | `dracula-black` | Theme id |
| `locale` | `en` \| `pt-br` \| `es` | `en` | Card copy language |
| `hide_title` | bool | `false` | |
| `hide_border` | bool | `false` | |
| `custom_title` | string ≤100 | — | Override default title |
| `border_radius` | 0–50 | `12` | Card corner radius |
| `bg_color` | hex | — | Background |
| `text_color` | hex | — | Body text |
| `title_color` | hex | — | Title |
| `icon_color` | hex | — | Icons |
| `border_color` | hex | — | Border |
| `disable_animations` | bool | `false` | |
| `cache_seconds` | 300–86400 | `14400` | CDN/client cache hint (4h default) |

### `/api/stats` — extra parameters

| Parameter | Type | Default | Notes |
|---|---|---|---|
| `include_private` | bool | `false` | Count private contributions (requires expanded PAT scope) |
| `include_archived` | bool | `true` | Include archived repos in star count |
| `include_forks` | bool | `false` | Include forked repos in star count |
| `hide_rank` | bool | `false` | Hide the rank badge |
| `hide` | comma list | — | Hide stat rows: `stars`, `commits`, `prs`, `issues`, `contribs` |
| `show` | comma list | — | Add extra rows: `reviews`, `discussions_started`, `discussions_answered`, `prs_merged` |
| `line_height` | 20–40 | `25` | Vertical spacing between rows |

### `/api/top-langs` — extra parameters

| Parameter | Type | Default | Notes |
|---|---|---|---|
| `langs_count` | 1–100 | `20` | Max languages to display |
| `layout` | enum | `normal` | `normal` \| `compact` \| `donut` \| `donut-vertical` \| `pie` |
| `hide` | comma list | — | Language names to exclude (e.g. `HTML,CSS`) |
| `exclude_repo` | comma list | — | Repositories to exclude from aggregation |
| `include_archived` | bool | `true` | Include archived repos |
| `size_weight` | 0–1 | `1` | Weight given to byte size |
| `count_weight` | 0–1 | `0` | Weight given to repo count |

### `/api/streak` — extra parameters

| Parameter | Type | Default | Notes |
|---|---|---|---|
| `mode` | `daily` \| `weekly` | `daily` | Streak counting granularity |
| `hide_current_streak` | bool | `false` | Hide the current streak section |
| `hide_longest_streak` | bool | `false` | Hide the longest streak section |

### `/api/activity` — no extra parameters

Uses only the shared parameters above.

### `/api/pin` — extra parameters

| Parameter | Type | Default | Notes |
|---|---|---|---|
| `repo` | string | — | Repository name (without owner). **Omit** for the pinned-repos grid; **include** for a single-repo card. |
| `show_owner` | bool | `false` | Prefix the repo name with `owner/` |
| `description_lines_count` | 1–3 | `1` | Lines of description to display |

### `/api/devops` — no extra parameters

Uses only the shared parameters above.

### `/api/coding-stats` — extra parameters

| Parameter | Type | Default | Notes |
|---|---|---|---|
| `langs_count` | 1–100 | `5` | Number of top languages to display |
| `layout` | `normal` \| `compact` | `normal` | Card layout style |

---

> The machine-readable version of this reference (with exact types, ranges, and per-field descriptions) is always available at `GET /` on any running instance.

### Themed examples

```markdown
<!-- Pro Dark with custom title -->
![](https://esousa97.com/api/stats?username=YOUR_LOGIN&theme=pro-dark&custom_title=My%20GitHub%20Stats)

<!-- Donut top-langs in pt-br -->
![](https://esousa97.com/api/top-langs?username=YOUR_LOGIN&layout=donut&locale=pt-br)

<!-- Single pinned repo -->
![](https://esousa97.com/api/pin?username=YOUR_LOGIN&repo=engineering-overview-pro)

<!-- GitHub-dark color override -->
![](https://esousa97.com/api/stats?username=YOUR_LOGIN&bg_color=0d1117&text_color=c9d1d9&title_color=58a6ff&border_color=30363d)
```

## Rate limits & fair use

- The public instance is rate-limited to **60 requests per minute** per client IP.
- Responses use long cache hints (`cache_seconds=14400` by default), so README embeds rarely hit the limit.
- The service is best-effort and free. For high-traffic dashboards or guaranteed availability, please **self-host** (next section).

## Self-hosting

The application is a standard Node.js service — no Docker required, though you may containerize it if you prefer.

### Requirements

- **Node.js** 22 or newer
- One **GitHub Personal Access Token** (PAT) — fine-scoped, public read is enough; private fields require additional scopes

### Run locally

```bash
git clone https://github.com/esousa-dev/engineering-overview-pro.git
cd engineering-overview-pro
npm install
cp .env.example .env
# Edit .env and set PAT_1
npm run dev
```

Server listens on `http://localhost:3000`.

### Run in production

```bash
npm ci
npm run build
node dist/server.js
```

Use **systemd**, **pm2**, or any process supervisor for restarts and logs. Put a reverse proxy (Nginx, Traefik, Caddy) in front for TLS and set `TRUST_PROXY=true` so rate limiting sees the real client IP.

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `PAT_1` | Yes | GitHub PAT. Add `PAT_2`, `PAT_3`, … for round-robin rotation — each token shares the 5 000 req/h quota, so more tokens means more headroom. |
| `PORT` | No | HTTP port (default `3000`) |
| `HOST` | No | Bind address (default `0.0.0.0`) |
| `LOG_LEVEL` | No | Fastify logger level: `info`, `warn`, `error`, `debug` (default `info`) |
| `TRUST_PROXY` | No | `true`, `false`, or comma-separated allow-list. **Only enable behind a trusted proxy** — otherwise clients can spoof `X-Forwarded-For` and bypass rate limiting. Default `false`. |
| `WARM_USERNAMES` | No | Comma-separated GitHub usernames to pre-warm in the background (e.g. `ESousa97`). The service silently refreshes their data before the cache expires, eliminating cold-start latency for every card embed. |
| `WARM_INTERVAL_MS` | No | How often the background warmer runs in milliseconds. Default `60000` (1 minute). Floor is `30000` (30 s). Warming only fires when the cache has actually expired, so at normal TTLs the warmer makes ≈ 6 GitHub calls per endpoint per day. |

There is **no** default username; every card URL must include `?username=`.

### Updates

```bash
git pull
npm ci
npm run build
# Restart the process
```

### Operational notes

- Keep PATs scoped to the minimum GitHub permissions you need.
- Monitor `/health` for rate-limit headroom when traffic grows.
- Enable `TRUST_PROXY` **only** when a trusted reverse proxy terminates TLS and sets `X-Forwarded-For` correctly.

## Development

| Script | Description |
|---|---|
| `npm run dev` | Watch-mode dev server (`tsx`) |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run `dist/server.js` (loads `.env` when present) |
| `npm test` | Unit tests (Vitest, includes GraphQL syntax validation) |
| `npm run test:coverage` | Vitest with V8 coverage report |
| `npm run lint` | ESLint on `src/` |
| `npm run typecheck` | TypeScript check without emit |
| `npm run format` | Prettier write |
| `npm run format:check` | Prettier check (CI) |
| `npm run spell` | cspell on the full tree |
| `npm run spell:ci` | cspell on docs + GraphQL queries (CI subset) |
| `npm run verify` | CI parity: format, lint, typecheck, spell, tests, build, `npm audit` |

## CI/CD and automation

- **CI** ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) — on every push and PR to `main` / `dev`, runs Prettier, ESLint, TypeScript, spell check, Vitest (including GraphQL syntax validation), production build, and `npm audit --audit-level=high`.
- **Dependabot** ([`.github/dependabot.yml`](.github/dependabot.yml)) — weekly grouped npm updates (Octokit, Fastify, TypeScript/Vitest clusters) and monthly GitHub Actions updates.
- **Releases** ([`.github/workflows/release.yml`](.github/workflows/release.yml)) — pushing a `v*` tag (e.g. `v1.0.1`) creates a GitHub Release with auto-generated notes; npm publish is opt-in via the `NPM_PUBLISH` repo variable + `NPM_TOKEN` secret.

## Contributing

PRs welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Security

See [SECURITY.md](SECURITY.md) for reporting vulnerabilities. Please do **not** include real PATs or secrets in issues — use the disclosure channel listed there.

## License

MIT — see [LICENSE](LICENSE).

<div align="center">

## Author

**Enoque Sousa**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/enoque-sousa-bb89aa168/)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=flat&logo=github&logoColor=white)](https://github.com/ESousa97)
[![Portfolio](https://img.shields.io/badge/Portfolio-FF5722?style=flat&logo=target&logoColor=white)](https://enoquesousa.vercel.app)

**[⬆ Back to top](#engineering-overview-pro)**

Made with ❤️ by [Enoque Sousa](https://github.com/ESousa97)

**Project status:** Public service — open for community use

</div>
