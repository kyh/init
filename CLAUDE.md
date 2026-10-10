# Agent Instructions

## Project Overview

**init** - pnpm monorepo with Turborepo. Multi-platform starter: Next.js web, Expo mobile, Chrome extension, Tauri desktop.

## Tech Stack

- **Package Manager**: pnpm 12.x with workspace catalogs
- **Build**: Turborepo, Vite, Next.js Turbopack
- **Language**: TypeScript (workspace catalog), React 19
- **Styling**: Tailwind CSS 4.x, Base UI, shadcn/ui (base-vega registry)
- **Backend**: oRPC, better-auth, Drizzle ORM
- **Billing**: Stripe via @better-auth/stripe
- **Email**: Resend REST API (console fallback in dev)
- **Database**: Postgres — the Supabase CLI locally (native processes, no Docker), Supabase in production by default; any Postgres works (auth is better-auth)
- **Storage**: Vercel Blob (avatars only; no local emulator, so that route 501s offline)
- **Desktop**: Tauri 2 — a Rust shell over the system webview (WebKit on macOS)

## Monorepo Structure

```
apps/
  web/         # Next.js 16 web app (fumadocs for docs)
  mobile/      # React Native mobile (nativewind)
  extension/   # Chrome extension (wxt)
  desktop/     # Desktop app (Tauri 2: a Rust shell around the web app)
packages/
  permissions/ # Client-safe auth helpers: role permissions, slugify
  contract/    # oRPC contract: zod inputs, outputs, errors, openapi meta
  service/     # oRPC implementation of the contract + better-auth
  db/          # Drizzle schema + client, local Supabase config
  ui/          # Shared React components (shadcn-style)
```

### Contract-first API

`@repo/contract` is the single source of truth: each feature has `<f>-schema.ts` (zod inputs; org-scoped ones extend `organizationInput`) and `<f>-contract.ts` (built on `publicBase` / `protectedBase` / `organizationBase` from `base.ts`), registered in `src/index.ts`. `@repo/service` implements it with `os = implement(contract)` — org-scoped: `const authed = os.<f>.use(requireSession); export const <f>Router = { <proc>: authed.<proc>.use(requireOrganization).handler(...) }`; public procedures implement `os.<f>.<proc>` directly (see `waitlist-router.ts`). Mount in `root-router.ts`; `os.router` fails to compile if a procedure is missing or mistyped. Implementer-level `.use` runs before input validation (anonymous → UNAUTHORIZED); procedure-level `.use` runs after. Feature routers stay plain objects — `os.<f>.router()` re-applies implementer middleware, so it would run twice. Clients type against `ContractClient` / `RouterInputs` / `RouterOutputs` from `@repo/contract` and use `@repo/permissions` for role checks; only server code (web route handlers, RSC) imports `@repo/service`. Layout follows oRPC's Hybrid monorepo recipe.

### Mutation path

Mutations go through oRPC or the better-auth client — never Next Server Actions. All four platforms (web, mobile, extension, desktop) then share one typed surface. Each mutation invalidates the specific queries it affects in its `onSuccess` (e.g. `queryClient.invalidateQueries({ queryKey: orpc.todo.list.key({ input: { slug } }) })`) — there is no global invalidate-everything cache. When wrapping better-auth in a TanStack mutation, set `fetchOptions: { throw: true }` so returned errors cannot trigger `onSuccess`.

### Mobile dependency pins

`nativewind` is pinned to the `5.0.0-preview` channel because it's the only Tailwind 4-compatible line; `react-native-css` is exact-pinned to the tested version. Lift both when nativewind 5 stable ships (see the tracking issue).

The Expo SDK pins the native modules. `update.ignoreDeps` in `pnpm-workspace.yaml` makes `pnpm up --latest -r` skip `expo`, `expo-*`, `@expo/*`, `react-native`, `react-native-*`, `@react-native/*` and `nativewind`; bump the SDK-pinned ones with `npx expo install --fix` during an SDK upgrade. It matches by name only, so the `expo:` catalog rows (`react`, `react-dom`, `typescript`, `@types/react`) are **not** guarded — ignoring them would freeze web too. After a sweep, revert those rows by hand, then run `npx expo install --check` in `apps/mobile`.

### Desktop shell

`apps/desktop` is a Tauri 2 shell around the web app, not a second frontend. Its window is declared in `src-tauri/tauri.conf.json` (`create: false`) and built in `window.rs`, because the navigation pin needs closures: the web app's origin and the OAuth providers load in it, any other web page opens in the browser, and no page gets a second window or a device permission. It opens `devUrl` under `pnpm dev:desktop`, which starts the web app beside it (`tauri dev` waits for it), and `frontendDist` in a build. The web app reaches the shell only through `apps/web/src/lib/desktop-bridge.ts`, which parses every frame with zod: three update commands and the menu's `menu-action` event. Every command is named in `build.rs`'s app manifest, so a page reaches only what `capabilities/` grants, and `removeUnusedCommands` drops every other command from the binary; Tauri counts the app URL as a local origin, so an OAuth page gets no IPC. Rust rides the same gates on the toolchain `rust-toolchain.toml` pins: `typecheck` is clippy (pedantic, `-D warnings`), `test` is `cargo test`, `format` is `cargo fmt --check`. On Linux the build needs WebKitGTK (`libwebkit2gtk-4.1-dev`); macOS ships WebKit, and Windows uses the WebView2 Runtime, which the installer fetches where it is missing. Updates stay off until `plugins.updater` is configured (`apps/web/content/docs/launch/deployment.mdx`).

## Common Commands

```bash
pnpm bootstrap        # First-run: provision DB + .env + schema + seed (--yes = headless)
pnpm dev              # Run all apps
pnpm dev:web          # Run Next.js only
pnpm dev:mobile       # Run Expo only
pnpm dev:desktop      # Run the desktop app, with the web app it opens
pnpm typecheck        # Type check all packages (tsc, clippy)
pnpm lint             # Lint all packages (oxlint)
pnpm format           # Check formatting (oxfmt, cargo fmt)
pnpm format:fix       # Format all packages (oxfmt, cargo fmt)
pnpm test             # Run tests (node:test, cargo test)
                      # Real-database suites skip unless TEST_POSTGRES_URL points at a disposable, schema-pushed Postgres
pnpm verify           # typecheck · lint · format · test (static CI gate)
pnpm smoke            # Drive a running app end-to-end (runtime CI gate)
pnpm build            # Build all packages
pnpm -F @repo/desktop package  # Bundle the desktop app (.app/.dmg on macOS)

# Database
pnpm db:start         # Start local Postgres (Supabase, no Docker); writes POSTGRES_URL into .env.local
pnpm db:stop          # Stop local Postgres
pnpm db:push          # Push Drizzle schema
pnpm db:reset         # Reset, push, and re-seed schema
pnpm db:seed          # Seed dev user (dev@init.local / password) + sample data

# Agents
pnpm emulate          # Local GitHub OAuth emulator (offline auth tests)

# UI — add shadcn components (base-vega / Base UI)
cd packages/ui && pnpm dlx shadcn@latest add <component>
```

## Agent-driven development

This template is built to be driven end-to-end by a coding agent. `AGENTS.md` is the full workflow; the essentials:

- **Provision headless**: `pnpm bootstrap --yes` (idempotent; no Docker — the Supabase CLI runs Postgres natively). Non-TTY runs auto-keep all apps, so a piped invocation won't hang on the app-picker.
- **One local database per git branch**: `pnpm db:start` gives every checkout and branch its own database on its own port, and the CLI writes its URL into `.env.local` (`supabase status --env`), which the `with-env` scripts load before `.env`. A new branch or worktree starts EMPTY — re-run `pnpm bootstrap --yes` there. Never pin a port in `packages/db/supabase/config.toml`: a second branch's stack then fails to bind. Postgres refuses root, so cloud sessions get a `supabase-postgres` user from the SessionStart hook in `.claude/settings.json`.
- **Seeded login**: `dev@init.local` / `password` (via `pnpm db:seed`) — a personal org + sample todos to verify against, no signup step.
- **Verify**: `pnpm verify` for the static gate, then `pnpm smoke` against a running server for the runtime gate (health → seeded sign-in → todo lifecycle through oRPC → authenticated render; `SMOKE_URL` points it at a deployment). Drive the UI itself with `agent-browser`. Only web is headless-driveable — mobile/desktop/extension get `typecheck` + `build` only.
- **OAuth offline**: uncomment `NEXT_PUBLIC_GITHUB_EMULATOR_URL` in `.env` + `pnpm emulate`, then `pnpm dev:web` — the shipped "Continue with GitHub" button runs through a local emulator (dev-only `genericOAuth`; real provider untouched in prod).
- **Fresh clone / scaffold**: `gh repo create <name> --template kyh/init --clone`, then `pnpm install && pnpm bootstrap --yes`. Headless auth: POST `dev@init.local` / `password` to `/api/auth/sign-in/email` for a session cookie. See `AGENTS.md` → Fresh clone.

## UI Package

`packages/ui` follows the shadcn monorepo layout:

```
packages/ui/
  src/
    components/   # primitives + custom shared components (flat)
    hooks/
    styles/globals.css
  components.json # style: base-vega
  postcss.config.mjs
```

Apps import via explicit paths:

- `@repo/ui/components/<name>` — shared components
- `@repo/ui/globals.css` — base stylesheet
- `@repo/ui/postcss.config` — shared postcss

`cn` is imported straight from the `cn` package; `@repo/ui` does not re-export it.
