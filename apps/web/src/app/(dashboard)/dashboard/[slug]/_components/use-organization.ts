import { useSuspenseQuery } from "@tanstack/react-query";

import type { QueryClient } from "@tanstack/react-query";
import { orpc } from "@/orpc/react";

export const useOrganization = (slug: string) => {
  return useSuspenseQuery(orpc.organization.get.queryOptions({ input: { slug } }));
};

export const invalidateOrganization = (queryClient: QueryClient, slug: string) =>
  queryClient.invalidateQueries({ queryKey: orpc.organization.get.key({ input: { slug } }) });

/** Use when a slug disappears; invalidation would refetch the old slug into NOT_FOUND. */
export const removeOrganization = (queryClient: QueryClient, slug: string) =>
  queryClient.removeQueries({ queryKey: orpc.organization.get.key({ input: { slug } }) });
