/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1)
 * 2. You want to create a new middleware or type of procedure (see Part 3)
 *
 * tl;dr - this is where all the tRPC server stuff is created and plugged in.
 * The pieces you will need to use are documented accordingly near the end
 */
import { db } from "@repo/db/drizzle-client";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z, ZodError } from "zod";

import { auth, trustedOrigins } from "./auth/auth";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth.api.getSession({
    headers: opts.headers,
  });

  return {
    session,
    db,
    // Browser-supplied request provenance. Captured here because a tRPC
    // middleware cannot read raw request headers; read by the mutation origin
    // guard below. Both null for non-browser callers (React Native,
    // server-to-server).
    origin: opts.headers.get("origin"),
    secFetchSite: opts.headers.get("sec-fetch-site"),
  };
};

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

/**
 * 2. INITIALIZATION
 *
 * This is where the trpc api is initialized, connecting the context and
 * transformer
 */
const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    data: {
      ...shape.data,
      zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
    },
  }),
});

/**
 * Create a server-side caller
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these
 * a lot in the feature routers (e.g. src/todo/todo-router.ts)
 */

/**
 * This is how you create new routers and subrouters in your tRPC API
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

const TRUSTED_ORIGINS = new Set(trustedOrigins);

/**
 * True when a request carries browser provenance that isn't same-origin or an
 * allow-listed origin. Auth cookies are SameSite=None (an extension-iframe
 * constraint, see auth.ts), so the browser's own CSRF backstop is off for
 * /api/trpc and better-auth's Origin checks only cover /api/auth/*. Non-browser
 * callers send neither header and are left alone; session auth still applies.
 */
const isUntrustedOrigin = (origin: string | null, secFetchSite: string | null) => {
  // Sec-Fetch-Site is set by the browser and cannot be forged from script.
  if (secFetchSite === "same-origin" || secFetchSite === "none") return false;
  // No browser provenance at all — not a browser CSRF vector.
  if (!origin && !secFetchSite) return false;
  // A cross-site/same-site label, or any Origin, must match the allow-list.
  // Fail closed: a stripped Origin under a cross-site label is rejected.
  return origin === null || !TRUSTED_ORIGINS.has(origin);
};

/**
 * Rejects state-changing calls whose origin isn't trusted — defence-in-depth
 * against CSRF, layered under session auth rather than replacing it. Queries are
 * side-effect-free and pass through untouched.
 */
const enforceTrustedOriginOnMutation = t.middleware(({ ctx, type, next }) => {
  if (type === "mutation" && isUntrustedOrigin(ctx.origin, ctx.secFetchSite)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Cross-origin request rejected",
    });
  }
  return next();
});

/**
 * Public (unauthed) procedure
 *
 * This is the base piece you use to build new queries and mutations on your
 * tRPC API. It does not guarantee that a user querying is authorized, but you
 * can still access user session data if they are logged in
 */
export const publicProcedure = t.procedure.use(enforceTrustedOriginOnMutation);

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }
  return next({
    ctx: {
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

/**
 * Organization-scoped procedure
 *
 * Takes an organization `slug`, resolves it, and proves the caller is a member
 * before the handler runs — so a handler cannot read or write another tenant's
 * rows by forgetting a check. Handlers get `ctx.organization` and
 * `ctx.membership` and should still scope their queries by
 * `ctx.organization.id`.
 */
export const organizationProcedure = protectedProcedure
  .input(z.object({ slug: z.string().min(1, "Organization slug is required") }))
  .use(async ({ ctx, input, next }) => {
    const organization = await ctx.db.query.organization.findFirst({
      where: (org, { eq }) => eq(org.slug, input.slug),
    });

    if (!organization) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Organization not found",
      });
    }

    // Kept as a second lookup rather than a join: membership absence must be
    // UNAUTHORIZED, distinct from the organization not existing at all.
    const membership = await ctx.db.query.member.findFirst({
      where: (member, { and, eq }) =>
        and(eq(member.organizationId, organization.id), eq(member.userId, ctx.session.user.id)),
    });

    if (!membership) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You do not have access to this organization",
      });
    }

    return next({ ctx: { organization, membership } });
  });
