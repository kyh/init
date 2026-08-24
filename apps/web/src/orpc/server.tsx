import { cache } from "react";
import { headers } from "next/headers";
import { appRouter, createORPCContext } from "@repo/api";
import { getSession } from "@/lib/auth-server";
import { createRouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import type { FetchQueryOptions, QueryKey } from "@tanstack/react-query";
import { createQueryClient } from "./query-client";

/**
 * Wraps `createORPCContext` and provides the required context when a React
 * Server Component calls a procedure.
 */
const createContext = cache(async () => {
  const heads = new Headers(await headers());

  heads.set("x-orpc-source", "rsc");

  return createORPCContext({
    headers: heads,
    // Dashboard pages call getSession() to gate the route before they prefetch.
    // Reuse that cached result — resolving it again here would be a second
    // session lookup per render.
    session: await getSession(),
  });
});

const getQueryClient = cache(createQueryClient);

/**
 * Calls procedures in-process, with no HTTP round trip — so SSR never asks the
 * server to fetch from itself. Use directly for server-only rendering and route
 * handlers, where hydrating a client cache buys nothing; use `orpc` + `prefetch`
 * when a client component will take the query over. See the table in
 * content/docs/build/queries.mdx.
 */
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
