import { RPCSerializer } from "@orpc/client";
import { defaultShouldDehydrateQuery, QueryClient } from "@tanstack/react-query";

// Preserve RPC types such as Date across server-to-client hydration.
const serializer = new RPCSerializer();

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      dehydrate: {
        // FormData cannot ride the hydration payload into the browser, so keep
        // blobs inline in the JSON.
        serializeData: (data) => serializer.serialize(data, { useFormDataForBlobFields: false }),
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === "pending",
        // Next.js handles redaction and uses server errors to detect dynamic routes.
        shouldRedactErrors: () => false,
      },
      hydrate: {
        deserializeData: (data) => serializer.deserialize(data),
      },
      queries: {
        // Avoid an immediate client refetch after hydration.
        staleTime: 30 * 1000,
      },
    },
  });
