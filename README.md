# Init

A comprehensive boilerplate to build, launch, and scale your next project 🚀

## Getting Started

**Prerequisites**: [Node.js 20+](https://nodejs.org), [pnpm 10+](https://pnpm.io), [Docker](https://docs.docker.com/get-docker/)

```sh
pnpm install
pnpm bootstrap
```

The bootstrap script will select apps, start Supabase, configure your `.env`, and push the database schema.

## Project Structure

```
apps/
  web/         # Next.js web app
  mobile/      # Expo/React Native mobile app
  extension/   # WXT Chrome extension
  desktop/     # Electron desktop app
packages/
  api/         # tRPC router + better-auth
  db/          # Drizzle schema + Supabase client
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
| `pnpm dev-web`       | Run Next.js only              |
| `pnpm dev-mobile`    | Run Expo only                 |
| `pnpm dev-extension` | Run Chrome extension only     |
| `pnpm dev-desktop`   | Run Electron only             |
| `pnpm build`         | Build all packages            |
| `pnpm typecheck`     | Type check all packages       |
| `pnpm lint`          | Lint all packages (oxlint)    |
| `pnpm format`        | Format all packages (oxfmt)   |
| `pnpm db-start`      | Start local Supabase (Docker) |
| `pnpm db-stop`       | Stop local Supabase           |
| `pnpm db-push`       | Push Drizzle schema           |
| `pnpm db-reset`      | Reset and push schema         |
| `pnpm gen-ui`        | Add shadcn components         |

## License

Licensed under the [MIT license](https://github.com/kyh/init/blob/main/LICENSE).
