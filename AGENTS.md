# AGENTS.md

**init** is an agent-first, multi-platform TypeScript starter: one typed stack (oRPC · better-auth · Drizzle · Postgres) shipping to web (Next.js), mobile (Expo), extension (WXT), and desktop (Electron). This is the tool-agnostic guide for coding agents — it's meant to be run, not just read. Claude also reads `CLAUDE.md`; both point back here.

## Quickstart (headless)

```sh
pnpm install
pnpm bootstrap --yes  # provision everything, non-interactively
pnpm dev:web          # web app → http://localhost:3000
```

`pnpm bootstrap --yes` (or any piped / non-TTY run — e.g. an agent) keeps all apps and: writes `.env` → starts local Postgres → pushes the Drizzle schema → seeds a dev user → reports agent tooling. It's idempotent; re-run any time, or `pnpm db:reset` to rebuild + re-seed. `pnpm db:start` runs local Supabase on the CLI's native runtime — Postgres as a plain process, on macOS 14+ (Apple silicon) and Linux (glibc 2.35+) — then has the CLI write its URL into `.env.local` (`supabase status --env`, `DB_URL` renamed to `POSTGRES_URL`). The `with-env` scripts load `.env.local` before `.env`, so it wins; delete it to use a `POSTGRES_URL` from `.env` instead.

The CLI keeps one local database per checkout **and git branch**, each on its own port, so worktrees and parallel agents never share data or fight over a port. A new branch therefore starts with an empty database: re-run `pnpm bootstrap --yes` there. The first start downloads Postgres (~400 MB from GitHub releases, then cached in `~/.supabase/cache`). Postgres refuses to run as root, which is how cloud sessions run: the SessionStart hook in `.claude/settings.json` creates a `supabase-postgres` system user and exports `SUPABASE_NATIVE_POSTGRES_USER` for the session; anywhere else that runs as root, do the same (the CLI's error says how).

Liveness: `curl -s localhost:3000/api/health` → `{"status":"ok"}`.

## Fresh clone & remote sessions

Everything an agent needs is committed — all config, the `agent-browser` skill stub (`.claude/skills/`), and `emulate.config.yaml`. Scaffold a new project, or bring up any clone, with the same two commands:

```sh
gh repo create my-app --template kyh/init --clone && cd my-app   # new project from the template
pnpm install && pnpm bootstrap --yes                             # any clone: install + provision
```

A clone has everything except `node_modules` and `.env` (bootstrap writes `.env`). Local Postgres runs as a plain process, so a cloud sandbox runs the full stack — data, auth and all — the same way a laptop does. The committed `.codex` / `.superset` cloud-runner descriptors install deps on clone.

Headless auth (no browser) — exchange the seeded login (below) for a session cookie and hand it to agent-browser or curl:

```sh
curl -s -i -X POST localhost:3000/api/auth/sign-in/email \
  -H 'content-type: application/json' \
  -d '{"email":"dev@init.local","password":"password"}' | grep -i set-cookie
```

## Seeded login

```
dev@init.local / password
```

Created by `pnpm db:seed` with a personal organization and three sample todos. Use it to verify any authenticated flow — no signup step needed.

## Verify a change end-to-end

Static gate (mirrors CI — run before every commit):

```sh
pnpm verify           # typecheck · lint · format · knip · test
```

Smoke gate (also in CI) — drives a **running** server end-to-end: health, seeded sign-in, the todo lifecycle through oRPC, and the authenticated dashboard render. It fails naming the step that broke:

```sh
pnpm dev:web &        # or a production build: pnpm -F @repo/web build && pnpm -F @repo/web start
pnpm smoke            # SMOKE_URL=https://<preview>.vercel.app pnpm smoke for a deployment
```

When calling better-auth from your own Node `fetch`, send an `Origin` header matching the app: Node sends `Sec-Fetch-Mode: cors`, which makes better-auth reject an Origin-less request with a 403 it doesn't log. `curl` sends neither, so it needs no such header.

Interactive — drive the **real** web UI (the only headless-driveable surface) with [agent-browser](https://github.com/vercel-labs/agent-browser):

```sh
npm i -g agent-browser && agent-browser install   # once, if missing
agent-browser open http://localhost:3000
agent-browser snapshot            # accessibility tree with @eN refs
agent-browser fill @e1 dev@init.local
agent-browser fill @e2 password
agent-browser click @e3           # sign in
agent-browser get text            # assert the seeded todos render
agent-browser screenshot /tmp/after.png
```

Don't stop at typecheck/tests — exercise the actual flow and observe the result.

## OAuth without the internet

Email/password (above) needs no external service. To exercise the **GitHub** button offline, use [emulate](https://github.com/vercel-labs/emulate), a local OAuth provider (fixtures in `emulate.config.yaml`). Uncomment `NEXT_PUBLIC_GITHUB_EMULATOR_URL` in `.env` (bootstrap wrote it commented), then:

```sh
pnpm emulate     # GitHub emulator on :4000
pnpm dev:web
```

With the var set, the shipped "Continue with GitHub" button routes through a dev-only `genericOAuth` provider aimed at the emulator — same button, no diverging prod path (unset ⇒ the real provider; see `packages/service/src/auth/auth.ts`). Open `/auth/login`, click the button, and the emulator's user-picker (octocat) completes sign-in — in the desktop shell's own window too, under `pnpm dev:desktop`.

(Pure HTTP: `POST /api/auth/sign-in/social {"provider":"github"}` returns the authorize URL directly — the same flow the button triggers.)

## Platform matrix

| Platform           | Dev command          | Agent-verifiable at runtime?         |
| ------------------ | -------------------- | ------------------------------------ |
| Web (Next.js)      | `pnpm dev:web`       | **Yes** — headless via agent-browser |
| Mobile (Expo)      | `pnpm dev:mobile`    | No — needs a simulator/device        |
| Extension (WXT)    | `pnpm dev:extension` | No — load-unpacked in real Chrome    |
| Desktop (Electron) | `pnpm dev:desktop`   | No — GUI window                      |

For the three non-web targets, verify with `pnpm typecheck` and `pnpm build`; a runtime check needs a human.

## Rules that matter

- **Mutations go through oRPC or the better-auth client — never Next Server Actions.** All four platforms share one typed surface; each mutation invalidates the specific queries it touches in `onSuccess` (see `CLAUDE.md` → Mutation path).
- **No `any`, no non-null `!`, no `as` casts.** Kebab-case filenames. Make illegal states unrepresentable.
- **Lint is a clean gate.** `oxlint.config.ts` extends the ultracite presets (core, react, anti-slop, landmines; next for `apps/web`) and every rule is an error. Fix the code, not the config; a `// oxlint-disable-next-line rule -- why` needs its reason. Landmines bans prose comments (allowed: lint and TypeScript directives, a single-line `// WARNING:` for a dangerous recurring footgun, TSDoc on exported API), so a decision goes in these docs, not beside the code. It also bans annotated return types on functions with a body: pin a contract with `satisfies` or a typed variable. Tests use real implementations (no module mocks, stubbed globals or fixed sleeps) and sit beside their subject as `*.test.ts`. The config is ultracite's presets as shipped plus type-aware linting (`options.typeAware`, run by `oxlint-tsgolint`), so `no-floating-promises`, `strict-boolean-expressions` and the `no-unsafe-*` rules run. Nothing is turned off. The two settings it adds: `no-floating-promises` treats `node:test`'s `describe`/`it`/`test` as handled, and `apps/mobile/metro.config.cjs`, whose CommonJS imports ship no types, skips the `no-unsafe-*` rules. A sequential await in a loop (a retry, a poll, ordered frames) carries a per-line disable that says why. Check env strings with `=== undefined || === ""` so an empty value counts as unset, and end a switch that names every case with `default: return unreachable(x)` (`@/lib/unreachable`). A file no tsconfig includes lints with `error` types, so every TypeScript file belongs to one (dot folders such as `.well-known` need an explicit include).
- **knip is a gate.** `pnpm knip` (in `verify` and CI) fails on an unused file, export or dependency. An export only docs use, like `caller`, carries `@public` in its TSDoc; the rest of `knip.json` names entries knip cannot find (wxt entrypoints) and dependencies it cannot see (Tailwind's CSS import, Metro's cache).
- **The trust pages describe what the code does.** `apps/web/src/lib/agent/privacy-policy.ts` and `terms-of-use.ts` adapt General Legal's templates; change them in the same commit as a product change that makes them untrue (their git history is the policy's version history), and keep the terms' section numbers so cross-references hold.
- **Request data renders under `<Suspense>`.** `cacheComponents` is on: reading the session, `params` or `searchParams` outside a boundary fails `pnpm build` (not `verify`), so build after touching a page or layout. Signed-out `/dashboard/*` requests get a 307 from `src/proxy.ts` (a session-cookie check only); pages still verify the session.
- Env degrades gracefully: missing keys (Stripe, Resend) disable a feature, they don't crash boot.

## Map

- `apps/{web,mobile,extension,desktop}` · `packages/{contract,service,permissions,db,ui}`
- `CLAUDE.md` — conventions + command list (Claude-specific)
- `apps/web/content/docs` — full docs (served at `/docs`, and as raw markdown per page)
- `/llms.txt`, `/.well-known/api-catalog`, `/openapi.json` — machine-readable surfaces · `apps/web/src/lib/agent` — their builders + the trust pages
- `packages/service/src/auth/auth.ts` — auth config · `packages/db/src/drizzle-schema.ts` — app tables · `packages/service/src/seed.ts` — the seed
