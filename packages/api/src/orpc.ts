import { db } from "@repo/db/drizzle-client";
import { contract } from "@repo/contract";
import type { organizationInput } from "@repo/contract/organization/organization-schema";
import { implement, ORPCError, os as builder } from "@orpc/server";
import type { z } from "zod";

import type { Session } from "./auth/auth";
import { auth } from "./auth/auth";

/** Headers keep context transport-independent; a supplied session avoids a second lookup. */
export const createORPCContext = async (opts: {
  headers: Headers;
  /** null means resolved and logged out; undefined triggers a lookup. */
  session?: Session | null;
}) => {
  const session =
    opts.session === undefined
      ? await auth.api.getSession({ headers: opts.headers })
      : opts.session;

  return { db, session };
};

export type ORPCContext = Awaited<ReturnType<typeof createORPCContext>>;

/** Implements @repo/contract. Procedures attach middleware themselves, because a router-level
 * `.use` followed by `.router()` would run it twice. */
export const os = implement(contract).$context<ORPCContext>();

/** Middleware is contract-independent, so tests can reuse it on their own contracts. */
const base = builder.$context<ORPCContext>();

/** Pairs with `protectedBase`, which declares UNAUTHORIZED. */
export const requireSession = base.middleware(({ context, next }) => {
  if (!context.session?.user) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "You must be logged in to access this resource",
    });
  }
  return next({
    context: {
      session: { ...context.session, user: context.session.user },
    },
  });
});

/** Pairs with `organizationBase`. Resolves membership before any tenant query; handlers must
 * scope rows by organization.id. Runs after validation, so `slug` is already checked. */
export const requireOrganization = requireSession.use(
  async ({ context, next }, input: z.infer<typeof organizationInput>) => {
    const organization = await context.db.query.organization.findFirst({
      where: { slug: input.slug },
    });

    if (!organization) {
      throw new ORPCError("NOT_FOUND", { message: "Organization not found" });
    }

    // Separate lookups distinguish a missing organization from missing membership.
    const membership = await context.db.query.member.findFirst({
      where: { organizationId: organization.id, userId: context.session.user.id },
    });

    if (!membership) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "You do not have access to this organization",
      });
    }

    return next({ context: { membership, organization } });
  },
);
