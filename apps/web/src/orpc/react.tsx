"use client";

import { createORPCClient, onError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import type { ContractClient } from "@repo/contract";
import { createQueryClient } from "./query-client";

let clientQueryClientSingleton: QueryClient | undefined;

const getQueryClient = () => {
  if (typeof window === "undefined") {
    return createQueryClient();
  }

  return (clientQueryClientSingleton ??= createQueryClient());
};

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  if (process.env.VERCEL_URL !== undefined) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return `http://localhost:${process.env.PORT ?? 3000}`;
};

const link = new RPCLink({
  headers: () => ({ "x-orpc-source": "nextjs-react" }),
  interceptors: [
    // oxlint-disable-next-line promise/prefer-await-to-callbacks -- oRPC's interceptor hook takes the error as its argument
    onError((error) => {
      if (process.env.NODE_ENV === "development") {
        console.error(error);
      }
    }),
  ],
  origin: getBaseUrl,
  url: "/api/orpc",
});

const client: ContractClient = createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);

export const ORPCReactProvider = (props: { children: React.ReactNode }) => {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {props.children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};
