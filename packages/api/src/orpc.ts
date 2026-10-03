import { db } from "@repo/db/drizzle-client";
import { openapi } from "@orpc/openapi";
import { ORPCError, os } from "@orpc/server";
import type { z } from "zod";

import type { organizationInput } from "./organization/organization-schema";

import type { Session } from "./auth/auth";
import { auth } from "./auth/auth";
import { flags } from "./flags/flags";
import { logRequest, resolveRequestId } from "./observability/logger";

/** Headers keep context transport-independent; a supplied session avoids a second lookup. */
export const createORPCContext = async (opts: {
  headers: Headers;
  /** Lets a route echo the id its log line carries on the response. */
  requestId?: string;
  /** null means resolved and logged out; undefined triggers a lookup. */
  session?: Session | null;
}) => {
  const session =
    opts.session === undefined
      ? await auth.api.getSession({ headers: opts.headers })
      : opts.session;

  return {
    db,
    flags,
    log: logRequest,
    requestId: opts.requestId ?? resolveRequestId(opts.headers),
    session,
  };
};

export type ORPCContext = Awaited<ReturnType<typeof createORPCContext>>;

const o = os.$context<ORPCContext>();

/** Outermost, so calls rejected by a later middleware (auth, membership, input
 * validation) are logged too. oRPC's `next()` throws on failure, hence the catch. */
const logged = o.use(async ({ context, next: proceed, path }) => {
  const startedAt = performance.now();
  let code: string | undefined;
  let ok = false;
  try {
    const result = await proceed();
    ok = true;
    return result;
  } catch (error) {
    if (error instanceof ORPCError) {
      ({ code } = error);
    }
    throw error;
  } finally {
    context.log({
      code,
      durationMs: Math.round(performance.now() - startedAt),
      ok,
      path: path.join("."),
      requestId: context.requestId,
      userId: context.session?.user.id,
    });
  }
});

/** Declared codes reach /openapi.json and typed clients. A plain `throw new ORPCError` with a
 * declared code is reported as defined, so handlers need no `errors` helper. */
export const publicProcedure = logged.errors({
  BAD_REQUEST: { message: "The input failed validation" },
});

/** `session` names the security scheme apps/web declares in its OpenAPI document. */
const requireSession = openapi.spec((operation) => ({
  ...operation,
  security: [{ session: [] }],
}));

export const protectedProcedure = publicProcedure
  .errors({ UNAUTHORIZED: { message: "No signed-in session" } })
  .meta(requireSession)
  .use(({ context, next }) => {
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
  protectedProcedure
    .errors({
      NOT_FOUND: { message: "The organization or a record in it does not exist" },
      UNAUTHORIZED: { message: "No signed-in session, or not a member of the organization" },
    })
    .input(input)
    .use(async ({ context, next }, validated) => {
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
