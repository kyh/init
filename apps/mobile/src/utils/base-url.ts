import Constants from "expo-constants";

/**
 * In development, derives the host machine's address from the Metro debugger
 * host so the app can reach the local Next.js server. Production/standalone
 * builds have no debugger host, so EXPO_PUBLIC_API_URL must be set at build
 * time (e.g. in eas.json build profile env).
 */
export const getBaseUrl = () => {
  const productionUrl = process.env.EXPO_PUBLIC_API_URL;
  if (productionUrl) {
    return productionUrl;
  }

  const debuggerHost = Constants.expoConfig?.hostUri;
  const localhost = debuggerHost?.split(":")[0];

  if (!localhost) {
    throw new Error("No dev server host found. Set EXPO_PUBLIC_API_URL for production builds.");
  }
  return `http://${localhost}:3000`;
};
