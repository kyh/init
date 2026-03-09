# Init

A comprehensive boilerplate to build, launch, and scale your next project 🚀

## Stack

- [Next.js](https://nextjs.org)
- [Expo](https://expo.dev)
- [Chrome Extension (WXT)](https://wxt.dev)
- [Electron](https://www.electronjs.org)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)
- [Drizzle](https://orm.drizzle.team)
- [Supabase](https://supabase.com)
- [better-auth](https://www.better-auth.com)

## Getting Started

1. Install dependencies:

```sh
pnpm install
```

2. Run the setup script to pick which apps to include (web, mobile, extension, desktop):

```sh
pnpm setup
```

3. Copy `.env.example` to `.env.local` and update the variables:

```sh
cp .env.example .env.local
```

4. Start your local database:

```sh
pnpm db-start
```

5. Push the database schema:

```sh
pnpm db-push
```

6. Start the development server:

```sh
pnpm dev
```

## Project Structure

```
apps/
  web/         # Next.js web app
  mobile/      # Expo/React Native mobile app
  extension/   # Chrome extension (WXT)
  desktop/     # Electron desktop app
packages/
  api/         # tRPC router + better-auth
  db/          # Drizzle schema + Supabase client
  ui/          # Shared React components
```

## Scripts

| Command           | Description                   |
| ----------------- | ----------------------------- |
| `pnpm dev`        | Run all apps                  |
| `pnpm dev-web`    | Run Next.js only              |
| `pnpm dev-mobile` | Run Expo only                 |
| `pnpm build`      | Build all packages            |
| `pnpm typecheck`  | Type check all packages       |
| `pnpm lint`       | Lint all packages             |
| `pnpm db-start`   | Start local Supabase (Docker) |
| `pnpm db-stop`    | Stop local Supabase           |
| `pnpm db-push`    | Push Drizzle schema           |
| `pnpm db-reset`   | Reset and push schema         |
| `pnpm gen-ui`     | Add shadcn components         |

## License

Licensed under the [MIT license](https://github.com/kyh/init/blob/main/LICENSE).
