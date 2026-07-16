# Agent Instructions

## Project Overview

**init** - pnpm monorepo with Turborepo. Multi-platform starter: Next.js web, Expo mobile, Chrome extension, Electron desktop.

## Tech Stack

- **Package Manager**: pnpm 10.x with workspace catalogs
- **Build**: Turborepo, Vite, Next.js Turbopack
- **Language**: TypeScript 5.x, React 19
- **Styling**: Tailwind CSS 4.x, Base UI, shadcn/ui (base-vega registry)
- **Backend**: tRPC, better-auth, Drizzle ORM
- **Billing**: Stripe via @better-auth/stripe
- **Email**: Resend REST API (console fallback in dev)
- **Database**: Supabase (Postgres + avatars storage bucket only — auth is better-auth, Data API disabled)
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
  db/          # Drizzle schema + client, Supabase local dev/migrations
  ui/          # Shared React components (shadcn-style)
```

The service-role Supabase client lives in `apps/web/src/lib/supabase-server.ts`, not in `packages/db` — `packages/db` only carries the Supabase CLI for local dev.

### Mutation path

Mutations go through tRPC or the better-auth client — never Next Server Actions. All four platforms (web, mobile, extension, desktop) then share one typed surface, and the `MutationCache` global-invalidation contract holds (it only observes React Query mutations). Do not introduce Server Actions alongside.

### Mobile dependency pins

`nativewind` is pinned to the `5.0.0-preview` channel because it's the only Tailwind 4-compatible line; `react-native-css` is exact-pinned to the tested version. Lift both when nativewind 5 stable ships (see the tracking issue).

## Common Commands

```bash
pnpm dev              # Run all apps
pnpm dev:web          # Run Next.js only
pnpm dev:mobile       # Run Expo only
pnpm typecheck        # Type check all packages
pnpm lint             # Lint all packages (oxlint)
pnpm format           # Check formatting (oxfmt)
pnpm format:fix       # Format all packages (oxfmt)
pnpm test             # Run tests (vitest)
pnpm build            # Build all packages

# Database
pnpm db:start         # Start local Supabase
pnpm db:stop          # Stop Supabase
pnpm db:push          # Push Drizzle schema
pnpm db:reset         # Reset and push schema

# UI — add shadcn components (base-vega / Base UI)
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
  components.json # style: base-vega
  postcss.config.mjs
```

Apps import via explicit paths:

- `@repo/ui/components/<name>` — shared components
- `@repo/ui/lib/utils` — cn
- `@repo/ui/globals.css` — base stylesheet
- `@repo/ui/postcss.config` — shared postcss
