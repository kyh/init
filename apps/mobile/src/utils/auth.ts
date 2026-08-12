import * as SecureStore from "expo-secure-store";
import { expoClient } from "@better-auth/expo/client";
import { genericOAuthClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { ac, roles } from "@repo/api/auth/permissions";

import { getBaseUrl } from "./base-url";

/**
 * expoClient()'s `getActions` types its `$fetch` parameter as a bare
 * `BetterFetch`, which better-auth's `BetterAuthClientPlugin` no longer accepts
 * — the two call signatures disagree on the fetch option generics. One rejected
 * element makes TypeScript give up on the whole `plugins` array, which is what
 * takes `useListOrganizations`, `getCookie` and `signIn.oauth2` down with it.
 *
 * Restating the plugin's shape re-satisfies the constraint while keeping
 * `getCookie` inferred, since the actions come from `getActions`' return type.
 * Drop this once @better-auth/expo lines its signature back up (broken from
 * 1.6.25 through at least 1.6.26).
 */
// oxlint-disable-next-line typescript/consistent-type-assertions -- an annotation can't express this; the source signature is the thing being corrected
const expoAuthClient = expoClient({
  scheme: "expo",
  storagePrefix: "expo",
  storage: SecureStore,
}) as unknown as Omit<ReturnType<typeof expoClient>, "getActions"> & {
  getActions: () => { getCookie: () => string };
};

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
  plugins: [
    expoAuthClient,
    // Exposes useListOrganizations() — todo procedures are organization-scoped,
    // so a screen needs an org slug before it can query.
    organizationClient({ ac, roles }),
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
