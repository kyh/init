import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@repo/api/auth/auth";

/**
 * RSC-only session/organization helpers. They read `next/headers`, so they live
 * in the web app rather than @repo/api — keeping the API package transport-
 * agnostic. React `cache` dedupes the lookup within a single request.
 */
export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

// React cache keys by Object.is per argument, so these take primitives: an
// object literal would be a fresh reference on every call and never dedupe.
export const getOrganizationBySlug = cache(async (slug: string) =>
  auth.api.getFullOrganization({ query: { organizationSlug: slug }, headers: await headers() }),
);

export const getOrganizationById = cache(async (id: string) =>
  auth.api.getFullOrganization({ query: { organizationId: id }, headers: await headers() }),
);

export const listOrganizations = cache(async () =>
  auth.api.listOrganizations({ headers: await headers() }),
);
