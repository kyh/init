import { StandardRPCJsonSerializer } from "@orpc/client/standard";
import { defaultShouldDehydrateQuery, hashKey, QueryClient } from "@tanstack/react-query";

// oRPC's own serializer, so dehydrated data round-trips every type the RPC
// protocol supports (Date, Map, Set, BigInt, URL, RegExp).
const serializer = new StandardRPCJsonSerializer();

export const createQueryClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Inputs can contain non-JSON values, so keys have to hash through the
        // same serializer the data does. Handing the result to TanStack's own
        // `hashKey` keeps its key sorting, which the serializer does not do —
        // without it, one input spelled in two property orders is two cache
        // entries, and invalidating one misses the other.
        queryKeyHashFn: (queryKey) => hashKey(serializer.serialize(queryKey)),
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 30 * 1000,
      },
      dehydrate: {
        serializeData: (data) => {
          const [json, meta] = serializer.serialize(data);
          return { json, meta };
        },
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === "pending",
        shouldRedactErrors: () => {
          // We should not catch Next.js server errors
          // as that's how Next.js detects dynamic pages
          // so we cannot redact them.
          // Next.js also automatically redacts errors for us
          // with better digests.
          return false;
        },
      },
      hydrate: {
        deserializeData: (data) => serializer.deserialize(data.json, data.meta),
      },
    },
  });

  return queryClient;
};
