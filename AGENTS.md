# AGENTS.md

**init** is an agent-first, multi-platform TypeScript starter: one typed stack (tRPC · better-auth · Drizzle · Postgres) shipping to web (Next.js), mobile (Expo), extension (WXT), and desktop (Electron). This is the tool-agnostic guide for coding agents — it's meant to be run, not just read. Claude also reads `CLAUDE.md`; both point back here.

## Quickstart (headless)

```sh
pnpm install
pnpm bootstrap --yes  # provision everything, non-interactively
pnpm dev:web          # web app → http://localhost:3000
```

`pnpm bootstrap --yes` (or any piped / non-TTY run — e.g. an agent) keeps all apps and: checks Docker → starts local Supabase → writes `.env` → pushes the Drizzle schema → seeds a dev user → reports agent tooling. It's idempotent; re-run any time, or `pnpm db:reset` to rebuild + re-seed. **Requires Docker** (local Supabase); without it, the data and auth layer can't come up.

Liveness: `curl -s localhost:3000/api/health` → `{"status":"ok"}`.

## Fresh clone & remote sessions

Everything an agent needs is committed — all config, the `agent-browser` skill stub (`.claude/skills/`), and `emulate.config.yaml`. Scaffold a new project, or bring up any clone, with the same two commands:

```sh
gh repo create my-app --template kyh/init --clone && cd my-app   # new project from the template
pnpm install && pnpm bootstrap --yes                             # any clone: install + provision
```

A clone has everything except `node_modules` and `.env` (bootstrap writes `.env`), and it **needs Docker** for local Supabase — the data + auth layer. Without Docker, `pnpm verify` and `pnpm build` still work, but authed/data flows can't run. The committed `.codex` / `.superset` cloud-runner descriptors install deps on clone; a cloud sandbox with Docker runs the full stack, without it stays static-only.

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

Three gates, cheapest first. **Static** proves it compiles; **smoke** proves it
runs; **agent-browser** proves the UI works. CI runs the first two on every
commit; the third is yours to drive.

Static gate (mirrors CI — run before every commit):

```sh
pnpm verify           # typecheck · lint · format · test
```

Smoke gate — drives a **running** server over HTTP: health, a real sign-in with
the seeded login, the full todo lifecycle through tRPC, and the authenticated
dashboard render. This is the gate that catches "types fine, app broken":

```sh
pnpm dev:web &        # or `pnpm -F @repo/web build && pnpm -F @repo/web start`
pnpm smoke            # exits non-zero with the failing step named

SMOKE_URL=https://my-app-git-branch.vercel.app pnpm smoke   # or against a preview
```

Runtime — drive the **real** web UI (the only headless-driveable surface) with [agent-browser](https://github.com/vercel-labs/agent-browser):

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

## Reading the server's own logs

Every tRPC call prints one JSON line, tagged with the request id that also comes
back on the response as `x-request-id`. Take the id off a failed response and
grep for it — no correlating by timestamp:

```sh
pnpm dev:web 2>&1 | tee /tmp/web.log
grep '"requestId":"<id>"' /tmp/web.log
# {"ts":"…","requestId":"…","type":"mutation","path":"todo.create","durationMs":18,"ok":false,"code":"UNAUTHORIZED"}
```

Config lives in `packages/api/src/observability/logger.ts`.

## Shipping a change behind a flag

A flagged change is reversible without a revert — flip one env var and redeploy.
Declare the flag in `packages/api/src/flags/flags.ts` (the registry is the only
source of flag names, so a typo at a read site is a type error), then read it as
`ctx.flags.myFlag` server-side or via the `flag.list` query on any client.

```sh
FEATURE_FLAGS="myFlag" pnpm dev:web     # on locally
FEATURE_FLAGS="myFlag=false"            # off, explicitly
```

Set it per Vercel environment to land a change dark: on for preview, off in
production, until a human flips it.

## Running two agents at once

`pnpm bootstrap` claims a free web port and a free Supabase port block on first
provision, and pins both (`PORT` in `.env`, the block in
`packages/db/supabase/config.toml`). Docker volumes are already namespaced per
folder. So a second checkout bootstraps beside the first instead of on top of it
— check `.env` for the port this one landed on rather than assuming 3000.

Per-change preview environments come from Vercel: every push builds a preview
deployment at its own URL, and `baseUrl` already follows `VERCEL_URL`, so auth
and OAuth callbacks work there unmodified. Point `SMOKE_URL` at one to verify a
deployed artifact rather than a local server.

## OAuth without the internet

Email/password (above) needs no external service. To exercise the **GitHub** button offline, use [emulate](https://github.com/vercel-labs/emulate), a local OAuth provider (fixtures in `emulate.config.yaml`). Uncomment `NEXT_PUBLIC_GITHUB_EMULATOR_URL` in `.env` (bootstrap wrote it commented), then:

```sh
pnpm emulate     # GitHub emulator on :4000
pnpm dev:web
```

With the var set, the shipped "Continue with GitHub" button routes through a dev-only `genericOAuth` provider aimed at the emulator — same button, no diverging prod path (unset ⇒ the real provider; see `packages/api/src/auth/auth.ts`). Open `/auth/login`, click the button, and the emulator's user-picker (octocat) completes sign-in.

(Pure HTTP: `POST /api/auth/sign-in/oauth2 {"providerId":"github"}` returns the authorize URL directly — the same flow the button triggers.)

## Platform matrix

| Platform           | Dev command          | Agent-verifiable at runtime?           |
| ------------------ | -------------------- | -------------------------------------- |
| Web (Next.js)      | `pnpm dev:web`       | **Yes** — `pnpm smoke` + agent-browser |
| Mobile (Expo)      | `pnpm dev:mobile`    | No — needs a simulator/device          |
| Extension (WXT)    | `pnpm dev:extension` | No — load-unpacked in real Chrome      |
| Desktop (Electron) | `pnpm dev:desktop`   | No — GUI window                        |

For the three non-web targets, verify with `pnpm typecheck` and `pnpm build`; a runtime check needs a human.

## Rules that matter

- **Mutations go through tRPC or the better-auth client — never Next Server Actions.** All four platforms share one typed surface; each mutation invalidates the specific queries it touches in `onSuccess` (see `CLAUDE.md` → Mutation path).
- **A risky or half-finished change ships behind a flag**, not on a branch that rots. See "Shipping a change behind a flag" above.
- **No `any`, no non-null `!`, no `as` casts.** Kebab-case filenames. Make illegal states unrepresentable.
- Env degrades gracefully: missing keys (Stripe, Resend) disable a feature, they don't crash boot.

## Map

- `apps/{web,mobile,extension,desktop}` · `packages/{api,db,ui}`
- `CLAUDE.md` — conventions + command list (Claude-specific)
- `apps/web/content/docs` — full docs (served at `/docs`, and as raw markdown per page)
- `/llms.txt`, `/.well-known/api-catalog` — machine-readable surfaces
- `packages/api/src/auth/auth.ts` — auth config · `packages/db/src/drizzle-schema.ts` — app tables · `packages/api/src/seed.ts` — the seed
