import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { appRouter, createORPCContext } from "@repo/api";
import { getSession } from "@/lib/auth-server";
import { createRouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import type { FetchQueryOptions, QueryKey } from "@tanstack/react-query";
import { createQueryClient } from "./query-client";

const createContext = cache(async () => {
  return createORPCContext({
    headers: new Headers(await headers()),
    // Reuse the dashboard’s cached session lookup.
    session: await getSession(),
  });
});

const getQueryClient = cache(createQueryClient);

/** Server calls run in-process. Prefetch and hydrate only when a client component consumes the query. */
export const caller = createRouterClient(appRouter, { context: createContext });

export const orpc = createTanstackQueryUtils(caller);

export const HydrateClient = (props: { children: React.ReactNode }) => {
  const queryClient = getQueryClient();
  return <HydrationBoundary state={dehydrate(queryClient)}>{props.children}</HydrationBoundary>;
};

export const prefetch = <TQueryFnData, TError, TData, TQueryKey extends QueryKey>(
  queryOptions: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
) => {
  void getQueryClient().prefetchQuery(queryOptions);
};
