import { db } from "@repo/db/drizzle-client";
import { ORPCError, os } from "@orpc/server";
import { z } from "zod";

import type { Session } from "./auth/auth";
import { auth } from "./auth/auth";

/**
 * Builds the per-request context. Callers supply headers rather than reading
 * them here, so the same code serves the fetch handler and the in-process RSC
 * router client, which have no shared request object.
 *
 * @see https://orpc.dev/docs/context
 */
export const createORPCContext = async (opts: {
  headers: Headers;
  /**
   * Pass an already-resolved session to reuse it. RSC callers have usually
   * resolved one via the cached `getSession()` before prefetching; without
   * this they'd pay a second session lookup, because React's cache keys on the
   * function, so a separate `auth.api.getSession` call never dedupes with it.
   * `null` means "resolved, and nobody is logged in" — only `undefined` triggers
   * a lookup here.
   */
  session?: Session | null;
}) => {
  const session =
    opts.session === undefined
      ? await auth.api.getSession({ headers: opts.headers })
      : opts.session;

  return { session, db };
};

export type ORPCContext = Awaited<ReturnType<typeof createORPCContext>>;

const o = os.$context<ORPCContext>();

/**
 * Unauthenticated procedure. Does not require a session, but `context.session`
 * is still populated when the caller happens to be logged in.
 */
export const publicProcedure = o;

/**
 * Requires a session, and narrows `context.session.user` to non-nullable for
 * the handler.
 *
 * @see https://orpc.dev/docs/procedure
 */
export const protectedProcedure = publicProcedure.use(({ context, next }) => {
  if (!context.session?.user) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "You must be logged in to access this resource",
    });
  }
  return next({
    context: {
      // infers the `session` as non-nullable
      session: { ...context.session, user: context.session.user },
    },
  });
});

/** The org slug every organization-scoped procedure is keyed by. */
export const organizationInput = z.object({
  slug: z.string().min(1, "Organization slug is required"),
});

/**
 * Resolves the organization named by `input.slug` and proves the caller is a
 * member before the handler runs — so a handler cannot read or write another
 * tenant's rows by forgetting a check. Handlers get `context.organization` and
 * `context.membership` and should still scope their queries by
 * `context.organization.id`.
 *
 * Declared against a dependent context, so it only composes onto a procedure
 * that has already narrowed the session — and only after an `.input()` whose
 * schema extends `organizationInput`, which the type checker enforces.
 */
export const requireOrganization = os
  .$context<{ db: ORPCContext["db"]; session: NonNullable<ORPCContext["session"]> }>()
  .middleware(async ({ context, next }, input: z.infer<typeof organizationInput>) => {
    const organization = await context.db.query.organization.findFirst({
      where: (org, { eq }) => eq(org.slug, input.slug),
    });

    if (!organization) {
      throw new ORPCError("NOT_FOUND", { message: "Organization not found" });
    }

    // Kept as a second lookup rather than a join: membership absence must be
    // UNAUTHORIZED, distinct from the organization not existing at all.
    const membership = await context.db.query.member.findFirst({
      where: (member, { and, eq }) =>
        and(eq(member.organizationId, organization.id), eq(member.userId, context.session.user.id)),
    });

    if (!membership) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "You do not have access to this organization",
      });
    }

    return next({ context: { organization, membership } });
  });

/**
 * Organization-scoped procedure whose only input is the slug. A procedure that
 * needs more input composes the pieces itself:
 * `protectedProcedure.input(schemaExtendingOrganizationInput).use(requireOrganization)`.
 */
export const organizationProcedure = protectedProcedure
  .input(organizationInput)
  .use(requireOrganization);
