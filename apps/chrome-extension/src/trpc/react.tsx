import { useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import SuperJSON from "superjson";

import type { AppRouter } from "@repo/api";
import type { QueryClient } from "@tanstack/react-query";
import { getStorageData } from "@/lib/storage";
import { createQueryClient } from "./query-client";

let clientQueryClientSingleton: QueryClient | undefined = undefined;
const getQueryClient = () => {
  return (clientQueryClientSingleton ??= createQueryClient());
};

export const { useTRPC, TRPCProvider, useTRPCClient } =
  createTRPCContext<AppRouter>();

type TRPCReactProviderProps = {
  children: ReactNode;
  baseUrl: string;
};

export const TRPCReactProvider = ({
  children,
  baseUrl,
}: TRPCReactProviderProps) => {
  const queryClient = getQueryClient();

  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        loggerLink({
          enabled: (op) =>
            process.env.NODE_ENV === "development" ||
            (op.direction === "down" && op.result instanceof Error),
        }),
        httpBatchLink({
          transformer: SuperJSON,
          url: `${baseUrl}/api/trpc`,
          headers() {
            const headers = new Map<string, string>();
            headers.set("x-trpc-source", "chrome-extension");
            return headers;
          },
          fetch(url, options) {
            return fetch(url, {
              ...options,
              credentials: "include",
            });
          },
        }),
      ],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
};

// Direct tRPC client for non-React usage
export const getTrpcClient = async () => {
  const baseUrl = await getStorageData("apiBaseUrl");

  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        transformer: SuperJSON,
        url: `${baseUrl}/api/trpc`,
        headers() {
          const headers = new Map<string, string>();
          headers.set("x-trpc-source", "chrome-extension");
          return headers;
        },
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: "include",
          });
        },
      }),
    ],
  });
};

export { type RouterInputs, type RouterOutputs } from "@repo/api";
