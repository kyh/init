# Agent Instructions

## Project Overview

**init** - pnpm monorepo with Turborepo. Multi-platform starter: Next.js web, Expo mobile, Chrome extension, Tauri desktop.

## Tech Stack

- **Package Manager**: pnpm 10.x with workspace catalogs
- **Build**: Turborepo, Vite, Next.js Turbopack
- **Language**: TypeScript 5.x, React 19
- **Styling**: Tailwind CSS 4.x, Radix UI, shadcn/ui patterns
- **Backend**: tRPC, better-auth, Drizzle ORM
- **Database**: Supabase (Postgres)
- **AI**: Vercel AI SDK

## Monorepo Structure

```
apps/
  nextjs/      # Next.js 16 web app (fumadocs for docs)
  expo/        # React Native mobile (nativewind)
  wxt/         # Chrome extension (wxt)
  tauri/       # Desktop app (Tauri)
packages/
  api/         # tRPC router + better-auth
  db/          # Drizzle schema + Supabase client
  ui/          # Shared React components (shadcn-style)
```

## Common Commands

```bash
pnpm dev              # Run all apps
pnpm dev-nextjs       # Run Next.js only
pnpm dev-expo         # Run Expo only
pnpm typecheck        # Type check all packages
pnpm lint             # Lint all packages
pnpm build            # Build all packages

# Database
pnpm db-start         # Start local Supabase
pnpm db-stop          # Stop Supabase
pnpm db-push          # Push Drizzle schema
pnpm db-reset         # Reset and push schema

# UI
pnpm gen-ui           # Add shadcn components
```
