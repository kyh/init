import { oc } from "@orpc/contract";
import { openapi } from "@orpc/openapi";

/** Declared codes reach /openapi.json and typed clients. A plain `throw new ORPCError` with a
 * declared code is reported as defined, so implementations need no `errors` helper. */
export const publicBase = oc.errors({
  BAD_REQUEST: { message: "The input failed validation" },
});

/** `session` names the security scheme apps/web declares in its OpenAPI document. */
const requireSession = openapi.spec((operation) => ({
  ...operation,
  security: [{ session: [] }],
}));

/** Implementations must `.use(requireSession)`; the contract only declares the outcome. */
export const protectedBase = publicBase
  .errors({ UNAUTHORIZED: { message: "No signed-in session" } })
  .meta(requireSession);

/** Implementations must `.use(requireOrganization)`, so every input extends `organizationInput`. */
export const organizationBase = protectedBase.errors({
  NOT_FOUND: { message: "The organization or a record in it does not exist" },
  UNAUTHORIZED: { message: "No signed-in session, or not a member of the organization" },
});
