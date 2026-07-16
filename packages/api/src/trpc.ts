import { db } from "@repo/db/drizzle-client";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z, ZodError } from "zod";

import { auth, trustedOrigins } from "./auth/auth";

/**
 * Builds the per-request context. Callers supply headers rather than reading
 * them here, so the same code serves the fetch handler and the in-process RSC
 * caller, which have no shared request object.
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

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    data: {
      ...shape.data,
      // Flattened so clients can map a failed input back to its field
      zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
    },
  }),
});

/** @see https://trpc.io/docs/server/server-side-calls */
export const createCallerFactory = t.createCallerFactory;

/** @see https://trpc.io/docs/router */
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
 * Unauthenticated procedure. Does not require a session, but `ctx.session` is
 * still populated when the caller happens to be logged in.
 */
export const publicProcedure = t.procedure.use(enforceTrustedOriginOnMutation);

/**
 * Requires a session, and narrows `ctx.session.user` to non-nullable for the
 * handler.
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
