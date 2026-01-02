import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import superjson from "superjson";

import type { AppRouter } from "@repo/api";
import { getStorageData } from "./storage";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
    },
    mutations: {
      onSuccess: async () => {
        await queryClient.invalidateQueries();
      },
    },
  },
});

const getBaseUrl = async (): Promise<string> => {
  return await getStorageData("apiBaseUrl");
};

// Create a trpc client that can be used with async baseUrl
export const createApiClient = (baseUrl: string) => {
  return createTRPCOptionsProxy<AppRouter>({
    client: createTRPCClient({
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        httpBatchLink({
          transformer: superjson,
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
    queryClient,
  });
};

// Lazy initialization of the API client
let apiClient: ReturnType<typeof createApiClient> | null = null;
let currentBaseUrl: string | null = null;

export const getApiClient = async () => {
  const baseUrl = await getBaseUrl();

  if (!apiClient || currentBaseUrl !== baseUrl) {
    currentBaseUrl = baseUrl;
    apiClient = createApiClient(baseUrl);
  }

  return apiClient;
};

// Direct tRPC client for simpler usage
export const getTrpcClient = async () => {
  const baseUrl = await getBaseUrl();

  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        transformer: superjson,
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
