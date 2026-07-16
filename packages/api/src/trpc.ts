import { db } from "@repo/db/drizzle-client";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z, ZodError } from "zod";

import { auth } from "./auth/auth";

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

/**
 * Unauthenticated procedure. Does not require a session, but `ctx.session` is
 * still populated when the caller happens to be logged in.
 */
export const publicProcedure = t.procedure;

/**
 * Requires a session, and narrows `ctx.session.user` to non-nullable for the
 * handler.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
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
