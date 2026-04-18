# Agent Instructions

## Project Overview

**init** - pnpm monorepo with Turborepo. Multi-platform starter: Next.js web, Expo mobile, Chrome extension, Electron desktop.

## Tech Stack

- **Package Manager**: pnpm 10.x with workspace catalogs
- **Build**: Turborepo, Vite, Next.js Turbopack
- **Language**: TypeScript 5.x, React 19
- **Styling**: Tailwind CSS 4.x, Base UI, shadcn/ui (base-mira registry)
- **Backend**: tRPC, better-auth, Drizzle ORM
- **Database**: Supabase (Postgres)
- **AI**: Vercel AI SDK

## Monorepo Structure

```
apps/
  web/         # Next.js 16 web app (fumadocs for docs)
  mobile/      # React Native mobile (nativewind)
  extension/   # Chrome extension (wxt)
  desktop/     # Desktop app (Electron)
packages/
  api/         # tRPC router + better-auth
  db/          # Drizzle schema + Supabase client
  ui/          # Shared React components (shadcn-style)
```

## Common Commands

```bash
pnpm dev              # Run all apps
pnpm dev-web          # Run Next.js only
pnpm dev-mobile       # Run Expo only
pnpm typecheck        # Type check all packages
pnpm lint             # Lint all packages (oxlint)
pnpm fmt              # Format all packages (oxfmt)
pnpm build            # Build all packages

# Database
pnpm db-start         # Start local Supabase
pnpm db-stop          # Stop Supabase
pnpm db-push          # Push Drizzle schema
pnpm db-reset         # Reset and push schema

# UI — add shadcn components (base-mira / Base UI)
cd packages/ui && pnpm dlx shadcn@latest add <component>
```

## UI Package

`packages/ui` follows the shadcn monorepo layout:

```
packages/ui/
  src/
    components/   # primitives + custom shared components (flat)
    hooks/
    lib/utils.ts  # cn()
    styles/globals.css
  components.json # style: base-mira
  postcss.config.mjs
```

Apps import via explicit paths:
- `@repo/ui/components/<name>` — shared components
- `@repo/ui/lib/utils` — cn
- `@repo/ui/globals.css` — base stylesheet
- `@repo/ui/postcss.config` — shared postcss
