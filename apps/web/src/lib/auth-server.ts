import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@repo/service/auth/auth";

/** RSC-only: cache session and organization lookups within a request. */
export const getSession = cache(
  async () => await auth.api.getSession({ headers: await headers() }),
);

export const getOrganizationBySlug = cache(
  async (slug: string) =>
    await auth.api.getFullOrganization({
      headers: await headers(),
      query: { organizationSlug: slug },
    }),
);

export const getOrganizationById = cache(
  async (id: string) =>
    await auth.api.getFullOrganization({ headers: await headers(), query: { organizationId: id } }),
);

export const listOrganizations = cache(
  async () => await auth.api.listOrganizations({ headers: await headers() }),
);
