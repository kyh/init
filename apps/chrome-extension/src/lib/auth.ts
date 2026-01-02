import { adminClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { getStorageData } from "./storage";

// Create auth client with dynamic base URL
export const createAuthClientWithBaseUrl = (baseUrl: string) => {
  return createAuthClient({
    baseURL: baseUrl,
    plugins: [adminClient(), organizationClient()],
    fetchOptions: {
      credentials: "include",
    },
  });
};

// Get auth client with current base URL
export const getAuthClient = async () => {
  const baseUrl = await getStorageData("apiBaseUrl");
  return createAuthClientWithBaseUrl(baseUrl);
};

// Helper to check if user is authenticated
export const checkAuth = async (): Promise<boolean> => {
  try {
    const authClient = await getAuthClient();
    const session = await authClient.getSession();
    return !!session?.data?.session;
  } catch {
    return false;
  }
};

// Helper to get current session
export const getSession = async () => {
  try {
    const authClient = await getAuthClient();
    const session = await authClient.getSession();
    return session?.data ?? null;
  } catch {
    return null;
  }
};

// Helper to sign out
export const signOut = async () => {
  const authClient = await getAuthClient();
  await authClient.signOut();
};
