import { QueryClient } from "@tanstack/react-query";
import SuperJSON from "superjson";

export const createQueryClient = () => {
  const queryClient = new QueryClient({
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
      dehydrate: {
        serializeData: SuperJSON.serialize,
      },
      hydrate: {
        deserializeData: SuperJSON.deserialize,
      },
    },
  });

  return queryClient;
};
