# Antigravity — GitHub Stats API

API self-hosted que gera cards SVG dinâmicos com estatísticas de qualquer perfil
do GitHub. Construída em Node.js, Fastify e TypeScript.

O perfil analisado é **sempre informado pela URL** (`?username=<login>`); basta
o usuário colocar o próprio login no link e os cards são gerados automaticamente.

## Requisitos

- Node.js 22+
- Um Personal Access Token do GitHub (para evitar o rate limit anônimo)

## Setup

```bash
npm install
cp .env.example .env
# edite .env e preencha PAT_1 com seu Personal Access Token
npm run dev
```

A API sobe em `http://localhost:3000`.

## Variáveis de ambiente

| Nome      | Obrigatório | Descrição                                  |
|-----------|-------------|--------------------------------------------|
| `PAT_1`   | Sim         | GitHub PAT (pode adicionar `PAT_2`, `PAT_3`… para round-robin) |
| `PORT`    | Não         | Porta HTTP (padrão `3000`)                 |
| `HOST`    | Não         | Host de bind (padrão `0.0.0.0`)            |
| `LOG_LEVEL` | Não       | Nível do logger Fastify (padrão `info`)    |

Não há variável de username — o login do GitHub vem **sempre** pela querystring.

## Rotas

Todas as rotas de card aceitam o parâmetro obrigatório `username`.

| Rota               | Função                                |
|--------------------|---------------------------------------|
| `GET /`            | Status da API e lista de rotas        |
| `GET /health`      | Healthcheck (uptime, memória, cache, rate limit) |
| `GET /api/stats`   | Card de estatísticas do perfil        |
| `GET /api/top-langs` | Linguagens mais usadas              |
| `GET /api/streak`  | Streak de contribuições               |
| `GET /api/activity` | Heatmap de atividade                 |
| `GET /api/pin`     | Repositórios fixados                  |
| `GET /api/devops`  | CI/CD + CodeFactor + Security         |
| `GET /api/wakatime` | Estatísticas do WakaTime             |

### Exemplo de uso no README

```markdown
[![GitHub Stats](https://seu-dominio.com/api/stats?username=SEU_LOGIN)](https://github.com/SEU_LOGIN)
```

### Parâmetros comuns (`/api/stats`)

- `username` (obrigatório): login do GitHub.
- `theme` (opcional): nome de um tema de `src/themes/index.ts` (padrão `dracula-black`).
- `hide_title`, `hide_border`, `hide_rank` (boolean): ocultam partes do card.
- `bg_color`, `text_color`, `title_color`, `icon_color`, `border_color`: hex sem `#`.
- `locale`: `en`, `pt-br` ou `es`.
- `disable_animations` (boolean).
- `hide` / `show`: lista separada por vírgula entre `stars,commits,prs,issues,contribs`.
- `custom_title`: título customizado.

## Scripts

| Script | Descrição |
|--------|-----------|
| `npm run dev`       | Servidor em watch (tsx) |
| `npm run build`     | Compila para `dist/`    |
| `npm start`         | Roda `dist/server.js`   |
| `npm test`          | Testes (vitest)         |
| `npm run lint`      | ESLint                  |
| `npm run typecheck` | TypeScript sem emitir   |
| `npm run format`    | Prettier                |
| `npm run spell`     | cspell                  |

## Deploy na VPS via GitHub

O projeto é puro Node.js — nenhum container ou pipeline externo é necessário.
Fluxo recomendado na VPS:

```bash
git clone <seu-repo>
cd engineering-overview-pro
npm ci
npm run build
cp .env.example .env  # preencha PAT_1
node dist/server.js   # ou via systemd / pm2
```

Para atualizações posteriores: `git pull && npm ci && npm run build` e reinicie
o serviço.

## Licença

MIT
