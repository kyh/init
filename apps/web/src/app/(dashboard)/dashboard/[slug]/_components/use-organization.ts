import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/react";

export const useOrganization = (slug: string) => {
  const trpc = useTRPC();
  return useSuspenseQuery(trpc.organization.get.queryOptions({ slug }));
};
