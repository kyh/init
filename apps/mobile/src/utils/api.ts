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
      // Avoid refetching over cellular on every remount.
      staleTime: 30 * 1000,
    },
  },
});

const link = new RPCLink({
  headers: async () => ({
    // React Native has no cookie jar, so the session rides an explicit header.
    Cookie: (await authClient.getCookie()) || undefined,
    "x-orpc-source": "expo-react",
  }),
  interceptors: [
    // oxlint-disable-next-line promise/prefer-await-to-callbacks -- oRPC's interceptor hook takes the error as its argument
    onError((error) => {
      if (process.env.NODE_ENV === "development") {
        console.error(error);
      }
    }),
  ],
  origin: getBaseUrl(),
  url: "/api/orpc",
});

const client: RouterClient<AppRouter> = createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);
