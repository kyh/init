import * as SecureStore from "expo-secure-store";
import { expoClient } from "@better-auth/expo/client";
import { genericOAuthClient, organizationClient } from "better-auth/client/plugins";
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
    genericOAuthClient(),
  ],
});

// See the web equivalent (apps/web/src/lib/auth-client.ts). In dev,
// EXPO_PUBLIC_GITHUB_EMULATOR_URL routes GitHub through the local `emulate`
// server; unset it uses the real provider.
type GithubSignInOptions = {
  callbackURL?: string;
  fetchOptions?: Parameters<typeof authClient.signIn.social>[0]["fetchOptions"];
};
export const signInWithGithub = (options: GithubSignInOptions = {}) =>
  process.env.EXPO_PUBLIC_GITHUB_EMULATOR_URL
    ? authClient.signIn.oauth2({ providerId: "github", ...options })
    : authClient.signIn.social({ provider: "github", ...options });
