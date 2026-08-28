import { createORPCClient, onError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { QueryClient } from "@tanstack/react-query";

import type { RouterClient } from "@orpc/server";
import type { AppRouter } from "@repo/api";
import { authClient } from "./auth";
import { getBaseUrl } from "./base-url";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Navigating back to a screen remounts it; at staleTime 0 that refetches
      // over cellular every time.
      staleTime: 30 * 1000,
    },
  },
});

const link = new RPCLink({
  // No SSR on React Native, so the origin is stable for the process.
  origin: getBaseUrl(),
  url: "/api/orpc",
  headers: async () => ({
    "x-orpc-source": "expo-react",
    // React Native has no cookie jar, so the session rides an explicit header.
    Cookie: (await authClient.getCookie()) || undefined,
  }),
  interceptors: [
    onError((error) => {
      if (process.env.NODE_ENV === "development") console.error(error);
    }),
  ],
});

const client: RouterClient<AppRouter> = createORPCClient(link);

/**
 * Typesafe oRPC query/mutation options for TanStack Query.
 */
export const orpc = createTanstackQueryUtils(client);

export { type RouterInputs, type RouterOutputs } from "@repo/api";
