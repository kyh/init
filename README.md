# Init

The AI-native boilerplate to build, launch, and scale your next project 🚀

One TypeScript codebase that ships to web, mobile, browser extension, and desktop — built to supercharge your dev workflow, and your coding agents':

1. **A stack AI already knows** — Tailwind, shadcn/ui, Drizzle, Postgres, Vitest, pnpm, Stripe: the tools [Claude Code picks on its own](https://amplifying.ai/research/claude-code-picks), so agents complete them correctly instead of hallucinating APIs
2. **Idiomatic implementations** — auth, orgs, and billing built the way each library's docs say to; agents extend patterns that match their training
3. **Agent rules and surfaces built in** — `CLAUDE.md` conventions, `llms.txt`, markdown content negotiation on every docs page, an API catalog, and an `@claude` GitHub action
4. **Self-updating documentation** — a scheduled [OpenWiki](https://github.com/langchain-ai/openwiki) workflow regenerates the agent wiki + `AGENTS.md` from the code and opens the diff as a PR

## Getting Started

**Prerequisites**: [Node.js 24+](https://nodejs.org), [pnpm 10+](https://pnpm.io), [Docker](https://docs.docker.com/get-docker/)

```sh
pnpm install
pnpm bootstrap
```

The bootstrap script selects apps, starts Supabase, configures your `.env`, pushes the schema, and seeds a dev user. It's interactive by default; pass `--yes` (or pipe it, as a coding agent would) to keep all apps and run unattended. See [`AGENTS.md`](./AGENTS.md) for the full agent-driven workflow.

## Project Structure

```
apps/
  web/         # Next.js web app
  mobile/      # Expo/React Native mobile app
  extension/   # WXT Chrome extension
  desktop/     # Electron desktop app
packages/
  api/         # tRPC router + better-auth
  db/          # Drizzle schema + Supabase config
  ui/          # Shared React components
```

## Links

- [Next.js](https://nextjs.org)
- [Expo](https://expo.dev)
- [Chrome Extension (WXT)](https://wxt.dev)
- [Electron](https://www.electronjs.org)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)
- [Drizzle](https://orm.drizzle.team)
- [Supabase](https://supabase.com)
- [better-auth](https://www.better-auth.com)

## Scripts

| Command              | Description                   |
| -------------------- | ----------------------------- |
| `pnpm dev`           | Run all apps                  |
| `pnpm dev:web`       | Run Next.js only              |
| `pnpm dev:mobile`    | Run Expo only                 |
| `pnpm dev:extension` | Run Chrome extension only     |
| `pnpm dev:desktop`   | Run Electron only             |
| `pnpm build`         | Build all packages            |
| `pnpm typecheck`     | Type check all packages       |
| `pnpm lint`          | Lint all packages (oxlint)    |
| `pnpm format`        | Format all packages (oxfmt)   |
| `pnpm db:start`      | Start local Supabase (Docker) |
| `pnpm db:stop`       | Stop local Supabase           |
| `pnpm db:push`       | Push Drizzle schema           |
| `pnpm db:reset`      | Reset and push schema         |

## License

Licensed under the [MIT license](https://github.com/kyh/init/blob/main/LICENSE).
