import { useSuspenseQuery } from "@tanstack/react-query";

import { orpc } from "@/orpc/react";

export const useOrganization = (slug: string) => {
  return useSuspenseQuery(orpc.organization.get.queryOptions({ input: { slug } }));
};
