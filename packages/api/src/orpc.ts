import { db } from "@repo/db/drizzle-client";
import { ORPCError, os } from "@orpc/server";
import type { z } from "zod";

import type { organizationInput } from "./organization/organization-schema";

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

const o = os.$context<ORPCContext>();

export const publicProcedure = o;

export const protectedProcedure = publicProcedure.use(({ context, next }) => {
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

/** Resolves membership before any tenant query. Handlers must scope rows by organization.id.
 * A factory is required because oRPC replaces, rather than merges, successive input schemas. */
export const organizationProcedure = <T extends z.ZodType<z.infer<typeof organizationInput>>>(
  input: T,
) =>
  protectedProcedure.input(input).use(async ({ context, next }, validated) => {
    const organization = await context.db.query.organization.findFirst({
      where: { slug: validated.slug },
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
  });
