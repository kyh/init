import { useSuspenseQuery } from "@tanstack/react-query";

import type { QueryClient } from "@tanstack/react-query";
import { orpc } from "@/orpc/react";

export const useOrganization = (slug: string) => {
  return useSuspenseQuery(orpc.organization.get.queryOptions({ input: { slug } }));
};

/**
 * Refetch an organization after a write. Lives next to the query it belongs to
 * so the key shape has one owner — mutations that change org membership or
 * metadata call this rather than rebuilding the key.
 */
export const invalidateOrganization = (queryClient: QueryClient, slug: string) =>
  queryClient.invalidateQueries({ queryKey: orpc.organization.get.key({ input: { slug } }) });

/**
 * Drop an organization's cached query without refetching — for when the slug it
 * was fetched under no longer exists. Invalidating instead would refetch the
 * still-mounted query into NOT_FOUND and its retry backoff before resolving.
 */
export const removeOrganization = (queryClient: QueryClient, slug: string) =>
  queryClient.removeQueries({ queryKey: orpc.organization.get.key({ input: { slug } }) });
