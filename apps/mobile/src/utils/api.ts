import { createORPCClient, onError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { SimpleCsrfProtectionLinkPlugin } from "@orpc/client/plugins";
import { StandardRPCJsonSerializer } from "@orpc/client/standard";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { hashKey, QueryClient } from "@tanstack/react-query";

import type { RouterClient } from "@orpc/server";
import type { AppRouter } from "@repo/api";
import { authClient } from "./auth";
import { getBaseUrl } from "./base-url";

const serializer = new StandardRPCJsonSerializer();

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Same canonical hash as apps/web/src/orpc/query-client.ts (which tests
      // it): both clients call the same router, and the default hash encodes
      // Map/Set inputs as "{}" — distinct inputs share one cache entry — and
      // throws on BigInt.
      queryKeyHashFn: (queryKey) => {
        const [json, meta] = serializer.serialize(queryKey);
        return hashKey([json, meta.map(hashKey).toSorted()]);
      },
      // Navigating back to a screen remounts it; at staleTime 0 that refetches
      // over cellular every time.
      staleTime: 30 * 1000,
    },
  },
});

// No SSR on React Native, so the base URL is stable for the process.
const RPC_URL = `${getBaseUrl()}/api/orpc`;

const link = new RPCLink({
  url: RPC_URL,
  plugins: [new SimpleCsrfProtectionLinkPlugin()],
  headers: async () => ({
    "x-orpc-source": "expo-react",
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
