# Agent Instructions

This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

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
  extension/   # Chrome extension (crxjs + vite)
  tauri/       # Desktop app (Tauri v2)
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

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds

