import { db } from "@repo/db/drizzle-client";
import { ORPCError, os } from "@orpc/server";
import type { z } from "zod";

import type { organizationInput } from "./organization/organization-schema";

import type { Session } from "./auth/auth";
import { auth } from "./auth/auth";
import { flags } from "./flags/flags";
import type { RequestLogRecord } from "./observability/logger";
import { logRequest, resolveRequestId } from "./observability/logger";

/** Headers keep context transport-independent; a supplied session avoids a second lookup. */
export const createORPCContext = async (opts: {
  headers: Headers;
  /**
   * Reuse an id the caller already minted. The fetch handler does this so the
   * `x-request-id` on the response is the same one these logs carry even when
   * context creation itself fails — which is when a caller most needs something
   * to quote.
   */
  requestId?: string;
  /** null means resolved and logged out; undefined triggers a lookup. */
  session?: Session | null;
}) => {
  // Resolved before the session lookup, which can throw. Deriving an id from
  // headers cannot, so it is available to everything below regardless.
  const requestId = opts.requestId ?? resolveRequestId(opts.headers);

  const session =
    opts.session === undefined
      ? await auth.api.getSession({ headers: opts.headers })
      : opts.session;

  return { db, flags, requestId, session };
};

export type ORPCContext = Awaited<ReturnType<typeof createORPCContext>>;

const o = os.$context<ORPCContext>();

/**
 * Emits the structured log line for a call. Outermost in the chain, so calls
 * rejected by a later middleware — the auth check, organization membership,
 * input validation — are logged too; those are the ones worth seeing.
 *
 * `next()` *throws* on a downstream failure in oRPC (unlike tRPC, which returns
 * an `{ ok: false }` result), so the failure path has to be a catch. Logging
 * only after a resolved `next()` would silently omit every rejected call.
 */
const logged = o.use(async ({ context, next: proceed, path }) => {
  const startedAt = performance.now();
  const userId = context.session?.user.id;

  const write = (ok: boolean, code?: string) => {
    const record: RequestLogRecord = {
      durationMs: Math.round(performance.now() - startedAt),
      ok,
      path: path.join("."),
      requestId: context.requestId,
    };
    if (userId !== undefined) {
      record.userId = userId;
    }
    if (code !== undefined) {
      record.code = code;
    }
    logRequest(record);
  };

  try {
    const result = await proceed();
    write(true);
    return result;
  } catch (error) {
    if (error instanceof ORPCError) {
      write(false, error.code);
    } else {
      write(false);
    }
    throw error;
  }
});

export const publicProcedure = logged;

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
      where: (org, { eq }) => eq(org.slug, validated.slug),
    });

    if (!organization) {
      throw new ORPCError("NOT_FOUND", { message: "Organization not found" });
    }

    // Separate lookups distinguish a missing organization from missing membership.
    const membership = await context.db.query.member.findFirst({
      where: (member, { and, eq }) =>
        and(eq(member.organizationId, organization.id), eq(member.userId, context.session.user.id)),
    });

    if (!membership) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "You do not have access to this organization",
      });
    }

    return next({ context: { membership, organization } });
  });
