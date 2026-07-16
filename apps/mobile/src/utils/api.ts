import { MutationCache, QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import superjson from "superjson";

import type { AppRouter } from "@repo/api";
import { authClient } from "./auth";
import { getBaseUrl } from "./base-url";

export const queryClient = new QueryClient({
  /**
   * Blunt but always correct: every successful mutation refetches everything,
   * so screens never render stale rows and features carry no invalidation code.
   * Matches apps/web — the contract in build/mutations.mdx is template-wide.
   */
  mutationCache: new MutationCache({
    onSuccess: async (_data, _variables, _onMutateResult, _mutation, context) => {
      await context.client.invalidateQueries();
    },
  }),
  defaultOptions: {
    queries: {
      // Navigating back to a screen remounts it; at staleTime 0 that refetches
      // over cellular every time.
      staleTime: 30 * 1000,
    },
  },
});

/**
 * Typesafe tRPC query/mutation options for TanStack Query.
 */
export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: createTRPCClient({
    links: [
      loggerLink({
        enabled: (opts) =>
          process.env.NODE_ENV === "development" ||
          (opts.direction === "down" && opts.result instanceof Error),
        colorMode: "ansi",
      }),
      httpBatchLink({
        transformer: superjson,
        url: `${getBaseUrl()}/api/trpc`,
        headers() {
          const headers = new Map<string, string>();
          headers.set("x-trpc-source", "expo-react");

          const cookies = authClient.getCookie();
          if (cookies) {
            headers.set("Cookie", cookies);
          }
          return headers;
        },
      }),
    ],
  }),
  queryClient,
});

export { type RouterInputs, type RouterOutputs } from "@repo/api";
