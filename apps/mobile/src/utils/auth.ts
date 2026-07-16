import * as SecureStore from "expo-secure-store";
import { expoClient } from "@better-auth/expo/client";
import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { getBaseUrl } from "./base-url";

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
  plugins: [
    expoClient({
      scheme: "expo",
      storagePrefix: "expo",
      storage: SecureStore,
    }),
    // Exposes useListOrganizations() — todo procedures are organization-scoped,
    // so a screen needs an org slug before it can query.
    organizationClient(),
  ],
});
