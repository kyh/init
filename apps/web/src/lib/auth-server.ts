import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@repo/api/auth/auth";

/** RSC-only: cache session and organization lookups within a request. */
export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

// Primitive arguments let React cache deduplicate repeated lookups.
export const getOrganizationBySlug = cache(async (slug: string) =>
  auth.api.getFullOrganization({ query: { organizationSlug: slug }, headers: await headers() }),
);

export const getOrganizationById = cache(async (id: string) =>
  auth.api.getFullOrganization({ query: { organizationId: id }, headers: await headers() }),
);

export const listOrganizations = cache(async () =>
  auth.api.listOrganizations({ headers: await headers() }),
);
